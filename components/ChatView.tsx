import React, { useEffect, useState } from "react";
import { Keyboard, KeyboardEvent, Platform, SafeAreaView, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useChat } from "../hooks/useChat";
import { ChatHeader } from "./chat/ChatHeader";
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
  
  const {
    // State
    messages,
    inputText,
    isCreatingChat,
    selectedModel,
    showModelModal,
    
    // Actions
    setInputText,
    setSelectedModel,
    setShowModelModal,
    handleSendMessage,
    handleSuggestedQuestion,
    startNewChat,
  } = useChat(userName);

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

  const handleActionButton = (action: string) => {
    // Handle action button press
    console.log(`${action} button pressed`);
  };

  const handleMenuPress = () => {
    console.log("Menu pressed");
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
    <SafeAreaView className="flex-1 bg-app-dark-background pt-5">
      {/* Top Bar */}
      <ChatHeader
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onNewChatPress={startNewChat}
      />      {/* Main Content with Keyboard Aware Scroll */}      <KeyboardAwareScrollView
        className="flex-1"
        testID="chat-container"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={keyboardHeight > 0 ? keyboardHeight + 50 : (Platform.OS === "ios" ? 250 : 220)}
        showsVerticalScrollIndicator={false}
        bounces={false}
        resetScrollToCoords={{ x: 0, y: 0 }}
        scrollEnabled={true}
        keyboardOpeningTime={250}
      >
        {/* Messages Container */}
        <View className="flex-1 px-8">
          {messages.length === 0 ? (
            <WelcomeScreen
              userName={userName}
              onActionPress={handleActionButton}
              onSuggestedQuestionPress={handleSuggestedQuestion}
            />
          ) : (
            <MessageList messages={messages} />
          )}
        </View>
        
        {/* Bottom Input Bar - Inside KeyboardAwareScrollView */}
        <ChatInput
          inputText={inputText}
          onInputChange={setInputText}
          onSendMessage={handleSendMessage}
          onModelSelectorPress={() => setShowModelModal(true)}
          onGlobePress={handleGlobePress}
          onAttachPress={handleAttachPress}
          selectedModel={selectedModel}
          isCreatingChat={isCreatingChat}
        />
      </KeyboardAwareScrollView>
      
      {/* Model Selection Modal */}
      <ModelSelectorModal
        visible={showModelModal}
        selectedModel={selectedModel}
        onClose={() => setShowModelModal(false)}
        onModelSelect={setSelectedModel}
      />
    </SafeAreaView>
  );
};

export default ChatView;
