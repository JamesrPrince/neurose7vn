import React, { useState, useEffect, useRef } from "react";
import styled from "@emotion/styled";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
`;

const MessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Message = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${(props) => (props.isSent ? "flex-end" : "flex-start")};
  max-width: 70%;
  align-self: ${(props) => (props.isSent ? "flex-end" : "flex-start")};
`;

const MessageContent = styled.div`
  background: ${(props) =>
    props.isSent ? "var(--primary)" : "var(--background)"};
  color: ${(props) => (props.isSent ? "white" : "inherit")};
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  border-bottom-${(props) => (props.isSent ? "right" : "left")}-radius: 0;
`;

const MessageMeta = styled.div`
  font-size: 0.75rem;
  color: var(--secondary);
  margin-top: 0.25rem;
`;

const InputContainer = styled.div`
  border-top: 1px solid var(--border);
  padding: 1rem;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
`;

const TextArea = styled.textarea`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  resize: none;
  height: 2.5rem;
  max-height: 150px;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }
`;

const SendButton = styled.button`
  background: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--primary-dark);
  }

  &:disabled {
    background: var(--border);
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  font-size: 0.875rem;
  color: var(--secondary);
  padding: 0.5rem 1rem;
  font-style: italic;
`;

const MessagingInterface = ({ projectId, receiverId, receiverName }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messageListRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
    });

    newSocket.on("new-message", ({ message: newMessage, sender }) => {
      setMessages((prev) => [...prev, { ...newMessage, sender }]);
      if (messageListRef.current) {
        messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      }
    });

    newSocket.on("user-typing", ({ userId, projectId: typingProjectId }) => {
      if (userId === receiverId && typingProjectId === projectId) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
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

    return () => {
      newSocket.close();
    };
  }, [projectId, receiverId]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/messages?projectId=${projectId}&receiverId=${receiverId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        setMessages(data);

        if (messageListRef.current) {
          messageListRef.current.scrollTop =
            messageListRef.current.scrollHeight;
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [projectId, receiverId]);

  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;

    socket.emit("private-message", {
      content: message.trim(),
      receiverId,
      projectId,
    });

    setMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit("typing", { receiverId, projectId });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Container>
      <MessageList ref={messageListRef}>
        {messages.map((msg) => (
          <Message key={msg.id} isSent={msg.senderId === user.id}>
            <MessageContent isSent={msg.senderId === user.id}>
              {msg.content}
            </MessageContent>
            <MessageMeta>
              {msg.senderId === user.id ? "You" : receiverName} •{" "}
              {formatTimestamp(msg.createdAt)}
              {msg.senderId === user.id && msg.isRead && " • Read"}
            </MessageMeta>
          </Message>
        ))}
      </MessageList>

      {isTyping && (
        <TypingIndicator>{receiverName} is typing...</TypingIndicator>
      )}

      <InputContainer>
        <InputWrapper>
          <TextArea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
          />
          <SendButton onClick={handleSendMessage} disabled={!message.trim()}>
            Send
          </SendButton>
        </InputWrapper>
      </InputContainer>
    </Container>
  );
};

export default MessagingInterface;
