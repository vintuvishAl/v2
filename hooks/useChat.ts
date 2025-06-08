import { useMutation, useQuery } from "convex/react";
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

export const useChat = (userName: string = "vishal") => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>("gemini-2.5-flash");
  const [showModelModal, setShowModelModal] = useState(false);

  // Convex mutations and queries
  const createChat = useMutation(api.chat.createChat);
  const chat = useQuery(
    api.chat.getChat,
    currentChatId ? { chatId: currentChatId } : "skip"
  );

  // Get the stream body to display AI responses
  const streamBody = useQuery(
    api.chat.getChatBody,
    chat?.streamId ? { streamId: chat.streamId } : "skip"
  );

  // Update messages when stream body changes
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
          const existingAIMessage = prev.find(
            (m) => m.id === `stream-${currentChatId}`
          );
          if (existingAIMessage) {
            // Only update if the text has actually changed
            if (bodyText !== existingAIMessage.text) {
              return prev.map((m) =>
                m.id === `stream-${currentChatId}`
                  ? { ...m, text: bodyText, isStreaming: true }
                  : m
              );
            }
            return prev; // No change needed
          } else {
            // Add new AI message
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
  }, [streamBody, currentChatId]);

  // Mark streaming as complete after no updates for 2 seconds
  useEffect(() => {
    if (currentChatId) {
      const timer = setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === `stream-${currentChatId}` && m.isStreaming
              ? { ...m, isStreaming: false }
              : m
          )
        );
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [streamBody, currentChatId]);

  const handleSendMessage = async () => {
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

      try {
        setIsCreatingChat(true);
        console.log("=== FRONTEND SENDING CHAT ===");
        console.log("Selected model:", selectedModel);
        console.log("Prompt:", prompt);
        
        const result = await createChat({
          prompt,
          model: selectedModel,
        });
        
        console.log("Chat creation result:", result);
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

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsCreatingChat(false);
  };

  return {
    // State
    messages,
    inputText,
    currentChatId,
    isCreatingChat,
    selectedModel,
    showModelModal,
    userName,
    
    // Actions
    setInputText,
    setSelectedModel,
    setShowModelModal,
    handleSendMessage,
    handleSuggestedQuestion,
    startNewChat,
  };
};
