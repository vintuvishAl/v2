import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import React, { useEffect, useState } from "react";
import {
    Modal,
    Platform,
    SafeAreaView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatViewProps {
  userName?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ userName = "vishal" }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<Id<"chats"> | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);  const [selectedModel, setSelectedModel] = useState<"gemini-2.5-flash" | "gemini-2.5-pro" | "gpt-4o-mini" | "gpt-4o">("gemini-2.5-flash");
  const [showModelModal, setShowModelModal] = useState(false);

  const modelOptions = [
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "Google" },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "Google" },
    { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
    { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  ] as const;

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
  ); // Update messages when stream body changes
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

  const suggestedQuestions = [
    "How does AI work?",
    "Are black holes real?",
    "How many Rs are in the word 'strawberry'?",
    "What is the meaning of life?",
  ];
  const actionButtons = [
    {
      label: "Create",
      icon: "star-outline" as const,
      colorClass: "app-dark-icon",
    },
    {
      label: "Explore",
      icon: "document-text-outline" as const,
      colorClass: "",
    },
    { label: "Code", icon: "code-slash" as const, colorClass: "text-code" },
    {
      label: "Learn",
      icon: "school-outline" as const,
      colorClass: "text-learn",
    },
  ];
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
      setInputText("");      try {
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

    setMessages((prev) => [...prev, userMessage]);    try {
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

  const handleActionButton = (action: string) => {
    // Handle action button press
    console.log(`${action} button pressed`);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setIsCreatingChat(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-app-dark-background pt-5">
      {/* Top Bar */}
      <View className="flex-row justify-start items-center px-6 py-4 bg-app-dark-background">
        <View className="flex-row space-x-6">
          <TouchableOpacity testID="all-chats-button" className="p-2">
            <Ionicons
              name="menu"
              size={24}
              className="text-app-dark-icon"
              color={"#1769aa"}
            />
          </TouchableOpacity>
          <TouchableOpacity testID="search-button" className="p-2">
            <Ionicons
              name="search"
              size={24}
              className="text-app-dark-icon"
              color={"#1769aa"}
            />
          </TouchableOpacity>{" "}
          <TouchableOpacity
            testID="add-button"
            className="p-2"
            onPress={startNewChat}
          >
            <Ionicons
              name="add"
              size={24}
              className="text-app-dark-icon"
              color={"#1769aa"}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Main Content */}
      <KeyboardAwareScrollView
        className="flex-1 px-8"
        testID="chat-messages"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={20}
        extraHeight={Platform.OS === "ios" ? 20 : 0}
      >
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center py-16">
            {/* Welcome Message */}
            <Text className="text-app-dark-text text-4xl font-semibold mb-16 text-center">
              How can I help you, {userName}?
            </Text>
            {/* Action Buttons */}
            <View className="w-full max-w-2xl mb-3">
              <View className="flex-row flex-wrap justify-center">
                <View className="flex-row w-full ">
                  {actionButtons.map((button, index) => (
                    <TouchableOpacity
                      key={index}
                      className="flex-col items-center justify-start bg-app-dark-chat-bg px-1 py-2 rounded-2xl border border-app-dark-border flex-1 mx-2"
                      onPress={() => handleActionButton(button.label)}
                      testID={`action-${button.label.toLowerCase()}`}
                    >
                      <Ionicons
                        name={button.icon}
                        size={20}
                        className={button.colorClass}
                        color={"#1769aa"}
                      />
                      <Text className="text-app-dark-text  font-semibold text-lg">
                        {button.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
            {/* Suggested Questions */}
            <View className="w-full max-w-2xl">
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  className=" p-5 rounded-xl border-b-1 border-l-0 border-r-0 border-t-0 border   border-app-dark-border"
                  onPress={() => handleSuggestedQuestion(question)}
                  testID={`suggestion-${index}`}
                >
                  <Text className="text-app-dark-text text-base">
                    {question}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View className="py-4">
            {messages.map((message) => (
              <View
                key={message.id}
                className={`mb-4 ${
                  message.isUser ? "items-end" : "items-start"
                }`}
                testID={`message-${message.id}`}
              >
                <View
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.isUser
                      ? "bg-app-dark-user-message ml-auto"
                      : "bg-app-dark-ai-message mr-auto"
                  }`}
                >
                  <Text className="text-app-dark-text">{message.text}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </KeyboardAwareScrollView>
      {/* Bottom Input Bar */}
      <View className="bg-app-dark-background px-3 py-0">
        {/* Input Field - Separate section */}
        <View className="border-4 border-app-dark-border border-b-0 rounded-lg rounded-b-none   ">
          <View className="bg-app-dark-chat-bg  px-6 py-2  ">
            <TextInput
              className="text-app-dark-text text-base min-h-6"
              placeholder="Type your message here..."
              placeholderTextColor="#9ca3af"
              value={inputText}
              onChangeText={setInputText}
              multiline
              testID="message-input"
            />
          </View>
          {/* Gemini Model Info Bar - Separate section */}
          <View className="flex-row items-center justify-between bg-app-dark-chat-bg  px-6 py-2 ">            <View className="flex-row items-center space-x-4 gap-2">
              {/* Model Selection Button */}
              <TouchableOpacity
                className="flex-row items-center space-x-1 bg-app-dark-border px-3 py-2 rounded-lg"
                testID="model-selector"
                onPress={() => setShowModelModal(true)}
              >
                <Text className="text-app-dark-text text-sm font-medium">
                  {modelOptions.find(m => m.id === selectedModel)?.name}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={16}
                  className="text-app-dark-icon"
                  color={"#6b6b6b"}
                />
              </TouchableOpacity>
              {/* Globe Icon */}
              <TouchableOpacity testID="globe-button">
                <Ionicons
                  name="globe-outline"
                  size={20}
                  className="text-app-dark-icon"
                  color={"#6b6b6b"}
                />
              </TouchableOpacity>
              {/* Paperclip Icon */}
              <TouchableOpacity testID="attach-button">
                <Ionicons
                  name="attach"
                  size={20}
                  className="text-app-dark-icon"
                  color={"#6b6b6b"}
                />
              </TouchableOpacity>
            </View>{" "}
            {/* Send Button - separate from input field */}
            <TouchableOpacity
              className={`px-4 py-3 rounded-xl ${
                inputText.trim() && !isCreatingChat
                  ? "bg-app-dark-tint"
                  : "bg-app-dark-border"
              }`}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isCreatingChat}
              testID="send-button"
            >
              {isCreatingChat ? (
                <Ionicons
                  name="hourglass"
                  size={20}
                  className="text-app-dark-text"
                  color={"#6b6b6b"}
                />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={20}
                  className="text-app-dark-text"
                  color={"#1f2937"}
                />
              )}
            </TouchableOpacity>          </View>
        </View>
      </View>      {/* Model Selection Modal */}
      <Modal
        visible={showModelModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowModelModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-app-dark-background rounded-t-3xl pb-0">
            {/* Modal Header */}
            <View className="flex-row justify-between items-center p-6 border-b border-app-dark-border">
              <Text className="text-app-dark-text text-lg font-semibold">
                Select Model
              </Text>
              <TouchableOpacity
                onPress={() => setShowModelModal(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6b6b6b" />
              </TouchableOpacity>
            </View>
            
            {/* Model Options */}
            <View className="p-6 pb-8">
              {modelOptions.map((model) => (
                <TouchableOpacity
                  key={model.id}
                  className={`flex-row items-center justify-between p-4 rounded-lg mb-3 ${
                    selectedModel === model.id 
                      ? 'bg-app-dark-tint border border-blue-500' 
                      : 'bg-app-dark-chat-bg border border-app-dark-border'
                  }`}
                  onPress={() => {
                    setSelectedModel(model.id);
                    setShowModelModal(false);
                  }}
                >
                  <View className="flex-1">
                    <Text className="text-app-dark-text font-medium text-base">
                      {model.name}
                    </Text>
                    <Text className="text-gray-400 text-sm mt-1">
                      {model.provider}
                    </Text>
                  </View>
                  {selectedModel === model.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#1769aa" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChatView;
