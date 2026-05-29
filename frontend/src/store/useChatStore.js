import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();

    // Detect if message starts with @AI (case insensitive)
    const isAIMessage = messageData.text?.trim().match(/^@AI\s+/i);

    if (isAIMessage) {
      // ── AI Route ──────────────────────────────────────────────────
      try {
        // Send last 6 messages as context so Gemini remembers conversation
        const recentMessages = messages.slice(-6);

        const res = await axiosInstance.post(
          `/messages/ai/${selectedUser._id}`,
          {
            text: messageData.text,
            recentMessages,
          }
        );

        // Backend returns both the user message and AI reply
        // We add both to the messages array at once
        const { userMessage, aiMessage } = res.data;
        set({ messages: [...messages, userMessage, aiMessage] });

      } catch (error) {
        toast.error(error.response?.data?.error || "AI reply failed. Please try again.");
      }

    } else {
      // ── Normal Message Route ───────────────────────────────────────
      try {
        const res = await axiosInstance.post(
          `/messages/send/${selectedUser._id}`,
          messageData
        );
        set({ messages: [...messages, res.data] });

        // Tier 2 — message went through but is blurred for others
        if (res.data.isToxic) {
          toast("⚠️ Your message was flagged and will appear blurred.", {
            duration: 4000,
            style: {
              background: "#7f1d1d",
              color: "#fecaca",
            },
          });
        }
      } catch (error) {
        // Tier 1 — message was hard blocked (403)
        if (error.response?.status === 403 && error.response.data?.blocked) {
          toast.error("🚫 Message blocked — severe content detected.", {
            duration: 4000,
          });
        } else {
          toast.error(error.response?.data?.message || "Failed to send message");
        }
      }
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      // Accept messages from selected user OR AI messages
      const isMessageSentFromSelectedUser =
        newMessage.senderId === selectedUser._id;
      const isAIReply = newMessage.isAI === true;

      if (!isMessageSentFromSelectedUser && !isAIReply) return;

      // Avoid duplicate — AI reply is already added via the POST response
      const alreadyExists = get().messages.some(
        (m) => m._id === newMessage._id
      );
      if (alreadyExists) return;

      set({
        messages: [...get().messages, newMessage],
      });
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));