import Groq from "groq-sdk";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export const sendAIMessage = async (req, res) => {
  try {
    const { text, recentMessages } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Strip "@AI" prefix to get the actual question
    const userQuestion = text.replace(/^@AI\s*/i, "").trim();

    if (!userQuestion) {
      return res.status(400).json({ error: "Please ask a question after @AI" });
    }

    // ── Step 1: Save the user's @AI message first ─────────────────────
    const userMessage = await Message.create({
      senderId,
      receiverId,
      text,
      isAI: false,
      isToxic: false,
      toxicityScore: 0,
      moderationCategories: {},
      flaggedAt: null,
    });

    // Emit user's message to receiver via socket
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", userMessage);
    }

    // ── Step 2: Build conversation history for context ────────────────
    const history = (recentMessages || [])
      .filter((m) => m.text)
      .slice(-10)
      .map((m) => ({
        role: m.isAI ? "assistant" : "user",
        content: m.text,
      }));

    // ── Step 3: Call Groq API ─────────────────────────────────────────
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // free, fast, very capable model
      messages: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant inside a chat app. Keep your answers concise, friendly and conversational. Avoid overly long responses.",
        },
        ...history,
        {
          role: "user",
          content: userQuestion,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const aiReply = completion.choices[0]?.message?.content || "Sorry, I could not generate a response.";

    // ── Step 4: Save AI reply as a message ────────────────────────────
    const aiMessage = await Message.create({
      senderId: receiverId,  // appears to come from the other person's side
      receiverId: senderId,
      text: aiReply,
      isAI: true,
      aiPrompt: userQuestion,
      isToxic: false,
      toxicityScore: 0,
      moderationCategories: {},
      flaggedAt: null,
    });

    // ── Step 5: Emit AI reply to both users via socket ────────────────
    const senderSocketId = getReceiverSocketId(senderId.toString());
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", aiMessage);
    }
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", aiMessage);
    }

    // Return both messages so frontend can add them to state
    res.status(201).json({
      userMessage,
      aiMessage,
    });

  } catch (error) {
    console.error("AI controller error:", error.message);
    res.status(500).json({ error: "AI reply failed. Please try again." });
  }
};