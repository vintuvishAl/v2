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
        setMessages((prev) => {
          // Check if this content already exists in a non-streaming message (from DB)
          const existingDBMessage = prev.find(m => 
            !m.isUser && !m.isStreaming && m.text.trim() === bodyText.trim()
          );
          
          if (existingDBMessage) {
            // Content already exists in DB, don't add streaming message
            return prev;
          }
          
          const existingAIMessage = prev.find(
            (m) => m.id === `stream-${currentChatId}`
          );
          if (existingAIMessage) {
            // Only update if the text has actually changed
            if (bodyText !== existingAIMessage.text) {
              // Trigger scroll to bottom when streaming content updates
              setTimeout(() => onScrollToBottom?.(), 100);
              return prev.map((m) =>
                m.id === `stream-${currentChatId}`
                  ? { ...m, text: bodyText, isStreaming: true }
                  : m
              );
            }
            return prev; // No change needed
          } else {
            // Add new AI message and scroll to bottom
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
  }, [streamBody, currentChatId, onScrollToBottom]);// Load existing chat messages when a chat is selected
  useEffect(() => {
    if (chatMessages && chatMessages.messages) {
      // Convert timestamp numbers to Date objects for frontend use
      const messagesWithDates = chatMessages.messages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      // When loading from database, we should replace all messages
      // but preserve any currently streaming message that isn't in the DB yet
      setMessages((prev) => {
        const streamingMessage = prev.find(m => m.id === `stream-${currentChatId}` && m.isStreaming);
        if (streamingMessage) {
          // Check if the streaming message content is already in the database
          const isStreamingContentInDB = messagesWithDates.some(dbMsg => 
            !dbMsg.isUser && dbMsg.text.trim() === streamingMessage.text.trim()
          );
          
          if (isStreamingContentInDB) {
            // Streaming content is already saved in DB, just use DB messages
            return messagesWithDates;
          } else {
            // Keep the streaming message as it's newer than what's in DB
            return [...messagesWithDates, streamingMessage];
          }
        }
        return messagesWithDates;
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
  }, [streamBody, currentChatId]);const handleSendMessage = async () => {
    if (inputText.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText.trim(),
        isUser: true,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
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
