import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

export type ModelType = "gemini-2.5-flash" | "gemini-2.5-pro" | "gpt-4o-mini" | "gpt-4o";

export const useChat = (userName: string = "vishal", onScrollToBottom?: () => void) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);  const [selectedModel, setSelectedModel] = useState<ModelType>("gemini-2.5-flash");
  const [showModelModal, setShowModelModal] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);  const [useAgent, setUseAgent] = useState(false);

  // Get the current authenticated user
  const user = useQuery(api.auth.currentUser);
  // Convex mutations and queries
  const createChat = useMutation(api.chat.createUserChat);
  const continueChat = useMutation(api.chat.continueUserChat);
  const deleteChat = useMutation(api.chat.deleteChat);
  const chatHistory = useQuery(api.chat.getUserChats);
  const chat = useQuery(
    api.chat.getChat,
    currentChatId ? { chatId: currentChatId } : "skip"
  );
  // Get chat messages for existing chat
  const chatMessages = useQuery(
    api.chat.getChatMessagesFromDB,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  // Get the stream body to display AI responses
  const streamBody = useQuery(
    api.chat.getChatBody,
    chat?.streamId ? { streamId: chat.streamId } : "skip"
  );  // Update messages when stream body changes
  useEffect(() => {
    if (streamBody && currentChatId) {
      // The persistent streaming library should return the accumulated text
      let bodyText = "";

      if (typeof streamBody === "string") {
        bodyText = streamBody;
      } else if (streamBody && typeof streamBody === "object") {
        // Handle object format from persistent streaming
        const streamBodyAny = streamBody as any;
        bodyText = streamBodyAny.text || streamBodyAny.body || "";
      }

      if (bodyText && bodyText.trim()) {
        console.log("=== STREAMING UPDATE ===");
        console.log("Stream text length:", bodyText.length);
          setMessages((prev) => {
          console.log("Current messages count:", prev.length);
          
          // Check if this content already exists in a non-streaming message (from DB)
          const existingDBMessage = prev.find(m => 
            !m.isUser && !m.isStreaming && (
              m.text.trim() === bodyText.trim() || 
              bodyText.trim().startsWith(m.text.trim()) ||
              m.text.trim().startsWith(bodyText.trim())
            )
          );
          
          if (existingDBMessage && existingDBMessage.text.length >= bodyText.length) {
            console.log("DB message is complete enough, skipping streaming message");
            return prev;
          } else if (existingDBMessage && bodyText.length > existingDBMessage.text.length) {
            console.log("Streaming message is more complete than DB, replacing DB message");
            // Replace the truncated DB message with the streaming version
            return prev.map(m => 
              m === existingDBMessage 
                ? {
                    id: `stream-${currentChatId}`,
                    text: bodyText,
                    isUser: false,
                    timestamp: new Date(),
                    isStreaming: true,
                  }
                : m
            );
          }
          
          const existingAIMessage = prev.find(
            (m) => m.id === `stream-${currentChatId}`
          );
          
          if (existingAIMessage) {
            // Only update if the text has actually changed
            if (bodyText !== existingAIMessage.text) {
              console.log("Updating existing streaming message");
              setTimeout(() => onScrollToBottom?.(), 100);
              return prev.map((m) =>
                m.id === `stream-${currentChatId}`
                  ? { ...m, text: bodyText, isStreaming: true }
                  : m
              );
            }
            console.log("No change needed for streaming message");
            return prev;
          } else {
            console.log("Adding new streaming message");
            setTimeout(() => onScrollToBottom?.(), 100);
            return [
              ...prev,
              {
                id: `stream-${currentChatId}`,
                text: bodyText,
                isUser: false,
                timestamp: new Date(),
                isStreaming: true,
              },
            ];
          }
        });
      }
    }
  }, [streamBody, currentChatId, onScrollToBottom]);  // Load existing chat messages when a chat is selected
  useEffect(() => {
    if (chatMessages && chatMessages.messages) {
      // Convert timestamp numbers to Date objects for frontend use
      const messagesWithDates = chatMessages.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      console.log("=== LOADING MESSAGES FROM DB ===");
      console.log("DB Messages:", messagesWithDates.length);
      
      // When loading from database, we need to handle streaming messages carefully
      setMessages((prev) => {
        // Find any current streaming message
        const currentStreamingMessage = prev.find(m => 
          m.id === `stream-${currentChatId}` && m.isStreaming
        );
        
        if (currentStreamingMessage) {
          console.log("Found active streaming message, comparing with DB...");
          
          // Check if there's a corresponding message in DB that might be truncated
          const dbAIMessages = messagesWithDates.filter(m => !m.isUser);
          const lastDbAIMessage = dbAIMessages[dbAIMessages.length - 1];
          
          if (lastDbAIMessage && currentStreamingMessage.text.startsWith(lastDbAIMessage.text)) {
            console.log("Streaming message is more complete than DB, keeping streaming version");
            // The streaming message is more complete, keep it and replace the truncated DB version
            const filteredDbMessages = messagesWithDates.filter(m => m !== lastDbAIMessage);
            return [...filteredDbMessages, currentStreamingMessage];
          } else if (lastDbAIMessage && lastDbAIMessage.text.includes(currentStreamingMessage.text)) {
            console.log("DB message is more complete than streaming, using DB version");
            // DB message is more complete, use DB messages
            return messagesWithDates;
          } else {
            console.log("Streaming and DB messages seem different, keeping both");
            // They seem to be different messages, keep both but remove duplicates
            return [...messagesWithDates, currentStreamingMessage];
          }
        } else {
          console.log("No active streaming message, using DB messages only");
          return messagesWithDates;
        }
      });
    }
  }, [chatMessages, currentChatId]);
  // Mark streaming as complete after no updates for 2 seconds
  useEffect(() => {
    if (currentChatId) {
      const timer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.id === `stream-${currentChatId}` && m.isStreaming) {
              // When streaming is complete, the message should be in the database
              // We can either mark it as not streaming or remove it if it's already in DB
              return { ...m, isStreaming: false };
            }
            return m;
          })
        );
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [streamBody, currentChatId]);  const handleSendMessage = async () => {
    if (inputText.trim()) {
      console.log("=== SENDING MESSAGE ===");
      console.log("Input text:", inputText.trim());
      
      const userMessage: Message = {
        id: `user-${Date.now()}-${Math.random()}`, // More unique ID
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        console.log("Adding user message, current count:", prev.length);
        // Check if this exact message was already added recently (within 1 second)
        const recentMessage = prev.find(m => 
          m.isUser && 
          m.text === userMessage.text && 
          Math.abs(new Date().getTime() - m.timestamp.getTime()) < 1000
        );
        
        if (recentMessage) {
          console.log("Duplicate user message detected, skipping");
          return prev;
        }
        
        return [...prev, userMessage];
      });
      
      const prompt = inputText.trim();
      setInputText("");

      if (useAgent) {
        // Use agent functionality
        await handleAgentMessage(prompt);
      } else {
        // Use regular streaming chat - continue existing chat or create new one
        try {
          setIsCreatingChat(true);
          console.log("=== FRONTEND SENDING CHAT ===");
          console.log("Selected model:", selectedModel);
          console.log("Prompt:", prompt);
          console.log("Current chat ID:", currentChatId);
          
          if (currentChatId) {
            // Continue existing chat - add message to existing conversation
            const result = await continueChat({
              chatId: currentChatId,
              prompt,
              model: selectedModel,
            });
            console.log("Continue chat result:", result);
          } else {
            // Create new chat only if no current chat exists
            const result = await createChat({
              prompt,
              model: selectedModel,
            });
            console.log("Chat creation result:", result);
            setCurrentChatId(result.chatId);
          }
        } catch (error) {
          console.error("Error with chat:", error);
          // Add error message
          setMessages((prev) => [
            ...prev,
            {
              id: `error-${Date.now()}`,
              text: "Sorry, I encountered an error. Please try again.",
              isUser: false,
              timestamp: new Date(),
            },
          ]);
        } finally {
          setIsCreatingChat(false);
        }
      }
    }
  };

  const handleSuggestedQuestion = async (question: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsCreatingChat(true);
      console.log("=== FRONTEND SUGGESTED QUESTION ===");
      console.log("Selected model:", selectedModel);
      console.log("Question:", question);
      
      const result = await createChat({
        prompt: question,
        model: selectedModel,
      });
      
      console.log("Suggested question result:", result);
      setCurrentChatId(result.chatId);
    } catch (error) {
      console.error("Error creating chat:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          text: "Sorry, I encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsCreatingChat(false);
    }
  };
  // Agent functionality
  const agentChat = useAction(api.chat.agentChat);
    const handleAgentMessage = async (prompt: string) => {
    try {
      console.log("=== FRONTEND SENDING AGENT CHAT ===");
      console.log("Prompt:", prompt);
      console.log("Current thread ID:", currentThreadId);
        const result = await agentChat({
        prompt,
        model: selectedModel,
        threadId: currentThreadId || undefined,
        userId: user?._id || userName,
      });
      
      console.log("Agent chat result:", result);
        
      if (result.success) {
        // Update thread ID if we got a new one
        if (result.threadId && result.threadId !== currentThreadId) {
          setCurrentThreadId(result.threadId);
        }
        
        // Add agent response
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            text: result.response || "No response received",
            isUser: false,
            timestamp: new Date(),
          },
        ]);
        
        // Log tools used if any
        if (result.toolsUsed && result.toolsUsed.length > 0) {
          console.log("Tools used:", result.toolsUsed);
        }
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            id: `agent-error-${Date.now()}`,
            text: `Agent error: ${result.error}`,
            isUser: false,
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error with agent chat:", error);
      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          id: `agent-error-${Date.now()}`,
          text: "Sorry, the agent encountered an error. Please try again.",
          isUser: false,
          timestamp: new Date(),
        },
      ]);
    }
  };  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setCurrentThreadId(null);
    setIsCreatingChat(false);
  };

  const loadChat = (chatId: Id<"chats">) => {
    setCurrentChatId(chatId);
    setCurrentThreadId(null);
    setMessages([]); // Will be populated by useEffect when chatMessages loads
  };

  const handleDeleteChat = async (chatId: Id<"chats">) => {
    try {
      await deleteChat({ chatId });
      // If the deleted chat is the current one, start a new chat
      if (chatId === currentChatId) {
        startNewChat();
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };  return {
    // State
    messages,
    inputText,
    currentChatId,
    isCreatingChat,
    selectedModel,
    showModelModal,
    showChatHistory,
    useAgent,
    userName,
    user,
    chatHistory: chatHistory || [],
    
    // Actions
    setInputText,
    setSelectedModel,
    setShowModelModal,
    setShowChatHistory,
    setUseAgent,
    handleSendMessage,
    handleSuggestedQuestion,
    startNewChat,
    loadChat,
    handleDeleteChat,
  };
};
