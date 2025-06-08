import React from "react";
import { Text, View } from "react-native";
import Markdown from "react-native-markdown-display";
import type { Message } from "../../hooks/useChat";

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const markdownStyles = {
    body: {
      color: '#f3f4f6', // text-app-dark-text color
      fontSize: 16,
    },
    code_inline: {
      backgroundColor: '#374151',
      color: '#e5e7eb',
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    code_block: {
      backgroundColor: '#374151',
      color: '#e5e7eb',
      padding: 12,
      borderRadius: 8,
      marginVertical: 8,
    },
    blockquote: {
      backgroundColor: '#1f2937',
      borderLeftColor: '#6b7280',
      borderLeftWidth: 4,
      paddingLeft: 12,
      paddingVertical: 8,
      marginVertical: 8,
    },
    heading1: {
      color: '#f3f4f6',
      fontSize: 24,
      fontWeight: 'bold' as const,
      marginVertical: 8,
    },
    heading2: {
      color: '#f3f4f6',
      fontSize: 20,
      fontWeight: 'bold' as const,
      marginVertical: 6,
    },
    heading3: {
      color: '#f3f4f6',
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginVertical: 4,
    },
    list_item: {
      color: '#f3f4f6',
      marginVertical: 2,
    },
    strong: {
      color: '#f3f4f6',
      fontWeight: 'bold' as const,
    },
    em: {
      color: '#f3f4f6',
      fontStyle: 'italic' as const,
    },
  };

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
            {message.isUser ? (
              <Text className="text-app-dark-text">{message.text}</Text>
            ) : (
              <Markdown style={markdownStyles}>
                {message.text}
              </Markdown>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};
