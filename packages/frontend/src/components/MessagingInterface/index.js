import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import axios from "axios";
import io from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: white;
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #666;
  }
`;

const Message = styled.div`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  position: relative;
  word-wrap: break-word;

  ${(props) =>
    props.isSender
      ? `
    align-self: flex-end;
    background-color: #0070f3;
    color: white;
    border-bottom-right-radius: 4px;
  `
      : `
    align-self: flex-start;
    background-color: #f0f0f0;
    color: #333;
    border-bottom-left-radius: 4px;
  `}

  .meta {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    opacity: 0.8;
  }

  .attachments {
    margin-top: 0.5rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;

    a {
      padding: 0.25rem 0.5rem;
      background-color: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
      font-size: 0.875rem;
      color: ${(props) => (props.isSender ? "white" : "#0070f3")};
      text-decoration: none;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
    }
  }
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-top: 1px solid #ddd;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: none;
  font-family: inherit;
  font-size: 1rem;
  min-height: 40px;
  max-height: 120px;

  &:focus {
    outline: none;
    border-color: #0070f3;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background-color: #0070f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0051cc;
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileButton = styled.button`
  padding: 0.75rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #f8f9fa;
    border-color: #0070f3;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SelectedFiles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-top: 1px solid #ddd;

  .file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    background-color: #f8f9fa;
    border-radius: 4px;
    font-size: 0.875rem;

    button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      color: #dc3545;
      display: flex;
      align-items: center;

      &:hover {
        color: #bd2130;
      }
    }
  }
`;

const TypingIndicator = styled.div`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #666;
  font-style: italic;
`;

const MessagingInterface = ({ projectId, otherUserId, otherUserName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const token = localStorage.getItem("token");
    const newSocket = io(process.env.GATSBY_API_URL, {
      auth: { token },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected");
    });

    newSocket.on("new-message", ({ message }) => {
      setMessages((prev) => [...prev, message]);
    });

    newSocket.on("user-typing", ({ userId, projectId: typingProjectId }) => {
      if (userId === otherUserId && typingProjectId === projectId) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    newSocket.on("message-read", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    setSocket(newSocket);

    // Fetch existing messages
    fetchMessages();

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [projectId, otherUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.GATSBY_API_URL}/api/messages/conversation/${projectId}/${otherUserId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages(response.data.data.messages);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    // Send typing indicator
    if (socket) {
      socket.emit("typing", {
        receiverId: otherUserId,
        projectId,
      });
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    e.target.value = null; // Reset file input
  };

  const handleFileRemove = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!newMessage.trim() && selectedFiles.length === 0) return;

    try {
      // Upload files if any
      let attachments = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => {
          formData.append("files", file);
        });

        const token = localStorage.getItem("token");
        const uploadResponse = await axios.post(
          `${process.env.GATSBY_API_URL}/api/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        attachments = uploadResponse.data.data.filenames;
      }

      // Send message through socket
      socket.emit("private-message", {
        content: newMessage.trim(),
        receiverId: otherUserId,
        projectId,
        attachments,
      });

      setNewMessage("");
      setSelectedFiles([]);
      setError(null);
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message");
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 24 * 60 * 60 * 1000) {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  if (error) {
    return <div style={{ color: "#dc3545" }}>{error}</div>;
  }

  return (
    <Container>
      <MessagesContainer>
        {messages.map((message) => (
          <Message key={message.id} isSender={message.senderId === user.id}>
            <div>{message.content}</div>
            {message.attachments?.length > 0 && (
              <div className="attachments">
                {message.attachments.map((filename) => (
                  <a
                    key={filename}
                    href={`${process.env.GATSBY_API_URL}/uploads/${filename}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {filename.split("-").slice(1).join("-")}
                  </a>
                ))}
              </div>
            )}
            <div className="meta">
              <span>{formatTimestamp(message.createdAt)}</span>
              {message.senderId === user.id && (
                <span>{message.isRead ? "✓✓" : "✓"}</span>
              )}
            </div>
          </Message>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {isTyping && (
        <TypingIndicator>{otherUserName} is typing...</TypingIndicator>
      )}

      {selectedFiles.length > 0 && (
        <SelectedFiles>
          {selectedFiles.map((file, index) => (
            <div key={index} className="file">
              <span>{file.name}</span>
              <button onClick={() => handleFileRemove(index)}>×</button>
            </div>
          ))}
        </SelectedFiles>
      )}

      <InputContainer>
        <FileInput
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileSelect}
        />
        <FileButton
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
        >
          📎
        </FileButton>
        <TextArea
          value={newMessage}
          onChange={handleMessageChange}
          placeholder="Type a message..."
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          onClick={handleSubmit}
          disabled={!newMessage.trim() && selectedFiles.length === 0}
        >
          Send
        </Button>
      </InputContainer>
    </Container>
  );
};

export default MessagingInterface;
