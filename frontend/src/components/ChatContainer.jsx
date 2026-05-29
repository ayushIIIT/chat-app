import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);

  const [revealedMessages, setRevealedMessages] = useState({});

  const toggleReveal = (messageId) => {
    setRevealedMessages((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  useEffect(() => {
    getMessages(selectedUser._id);
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === authUser._id;
          const isToxic = message.isToxic === true;
          const isAI = message.isAI === true;
          const isRevealed = revealedMessages[message._id] || false;

          // AI messages always appear on the left (chat-start)
          // regardless of who triggered the @AI command
          const chatAlignment = isOwn && !isAI ? "chat-end" : "chat-start";

          return (
            <div
              key={message._id}
              className={`chat ${chatAlignment}`}
              ref={messageEndRef}
            >
              {/* Avatar */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  {isAI ? (
                    // AI bot avatar — distinct robot emoji on colored background
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                      }}
                    >
                      🤖
                    </div>
                  ) : (
                    <img
                      src={
                        isOwn
                          ? authUser.profilePic || "/avatar.png"
                          : selectedUser.profilePic || "/avatar.png"
                      }
                      alt="profile pic"
                    />
                  )}
                </div>
              </div>

              {/* Header — timestamp + AI label */}
              <div className="chat-header mb-1 flex items-center gap-2">
                {isAI && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#8b5cf6",
                      background: "#ede9fe",
                      padding: "1px 6px",
                      borderRadius: "99px",
                    }}
                  >
                    Gemini AI
                  </span>
                )}
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>

              {/* Message bubble */}
              <div
                className="chat-bubble flex flex-col"
                style={
                  isAI
                    ? {
                        background: "linear-gradient(135deg, #ede9fe, #ddd6fe)",
                        color: "#3b0764",
                        border: "1px solid #c4b5fd",
                      }
                    : {}
                }
              >
                {message.image && (
                  <img
                    src={message.image}
                    alt="Attachment"
                    className="sm:max-w-[200px] rounded-md mb-2"
                  />
                )}

                {message.text && (
                  <div>
                    {isToxic && !isAI ? (
                      <div>
                        {/* Blurred toxic message with click to reveal */}
                        <p
                          style={{
                            filter: isRevealed ? "none" : "blur(6px)",
                            transition: "filter 0.3s ease",
                            cursor: "pointer",
                            userSelect: isRevealed ? "text" : "none",
                          }}
                          onClick={() => toggleReveal(message._id)}
                          title={isRevealed ? "Click to hide" : "Click to reveal"}
                        >
                          {message.text}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginTop: "6px",
                            fontSize: "11px",
                            opacity: 0.75,
                            cursor: "pointer",
                          }}
                          onClick={() => toggleReveal(message._id)}
                        >
                          <span>⚠️</span>
                          <span>
                            {isRevealed
                              ? "Click to hide flagged content"
                              : "Flagged content — click to reveal"}
                          </span>
                        </div>
                      </div>
                    ) : (
                      // Normal message OR AI reply — render as plain text
                      <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                    )}
                  </div>
                )}

                {/* Show what question the AI was answering */}
                {isAI && message.aiPrompt && (
                  <div
                    style={{
                      marginTop: "8px",
                      paddingTop: "6px",
                      borderTop: "1px solid #c4b5fd",
                      fontSize: "11px",
                      opacity: 0.6,
                    }}
                  >
                    💬 Replying to: "{message.aiPrompt}"
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput />
    </div>
  );
};

export default ChatContainer;