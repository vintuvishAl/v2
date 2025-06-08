import React from "react";
import { Text, View } from "react-native";
import type { Message } from "../../hooks/useChat";

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
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
  );
};
