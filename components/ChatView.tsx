import React, { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, KeyboardEvent, SafeAreaView, ScrollView, View } from "react-native";
import { useChat } from "../hooks/useChat";
import { ChatHeader } from "./chat/ChatHeader";
import { ChatHistoryModal } from "./chat/ChatHistoryModal";
import { ChatInput } from "./chat/ChatInput";
import { MessageList } from "./chat/MessageList";
import { ModelSelectorModal } from "./chat/ModelSelectorModal";
import { WelcomeScreen } from "./chat/WelcomeScreen";

interface ChatViewProps {
  userName?: string;
}

const ChatView: React.FC<ChatViewProps> = ({ userName = "vishal" }) => {
  // Keyboard height state
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
    const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  const {    // State
    messages,
    inputText,
    isCreatingChat,
    selectedModel,
    showModelModal,
    showChatHistory,
    useAgent,
    chatHistory,
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
  } = useChat(userName, scrollToBottom);
  // Listen to keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e: KeyboardEvent) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages]);

  const handleActionButton = (action: string) => {
    // Handle action button press
    console.log(`${action} button pressed`);
  };
  const handleMenuPress = () => {
    setShowChatHistory(true);
  };

  const handleSearchPress = () => {
    console.log("Search pressed");
  };

  const handleGlobePress = () => {
    console.log("Globe pressed");
  };

  const handleAttachPress = () => {
    console.log("Attach pressed");
  };  return (
    <SafeAreaView className="flex-1 bg-app-dark-background pt-5">      {/* Top Bar */}
      <ChatHeader
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onNewChatPress={startNewChat}
        useAgent={useAgent}
        onToggleAgent={setUseAgent}
      />      {/* Main Content Container */}
      <View className="flex-1" style={{ paddingBottom: keyboardHeight }}>
        {/* Messages Container with ScrollView */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-8"
          testID="chat-container"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >          {messages.length === 0 ? (
            <WelcomeScreen
              userName={userName}
              onActionPress={handleActionButton}
              onSuggestedQuestionPress={handleSuggestedQuestion}
            />
          ) : (
            <MessageList messages={messages} />
          )}
        </ScrollView>

        {/* Fixed Bottom Input Bar */}
        <ChatInput
          inputText={inputText}
          onInputChange={setInputText}
          onSendMessage={handleSendMessage}
          onModelSelectorPress={() => setShowModelModal(true)}
          onGlobePress={handleGlobePress}
          onAttachPress={handleAttachPress}
          selectedModel={selectedModel}
          isCreatingChat={isCreatingChat}
          useAgent={useAgent}
        />
      </View>
        {/* Model Selection Modal */}
      <ModelSelectorModal
        visible={showModelModal}
        selectedModel={selectedModel}
        onClose={() => setShowModelModal(false)}
        onModelSelect={setSelectedModel}
      />
      
      {/* Chat History Modal */}
      <ChatHistoryModal
        visible={showChatHistory}
        onClose={() => setShowChatHistory(false)}
        chatHistory={chatHistory}
        onChatSelect={loadChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={startNewChat}
        loading={chatHistory === undefined}
      />
    </SafeAreaView>
  );
};

export default ChatView;
