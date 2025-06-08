import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { FlatList, Modal, Text, TouchableOpacity, View } from "react-native";
import type { Id } from "../../convex/_generated/dataModel";

interface ChatHistoryItem {
  _id: Id<"chats">;
  title: string;
  createdAt: number;
  updatedAt?: number;
}

interface ChatHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  chatHistory: ChatHistoryItem[];
  onChatSelect: (chatId: Id<"chats">) => void;
  onDeleteChat: (chatId: Id<"chats">) => void;
  onNewChat: () => void;
  loading?: boolean;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  visible,
  onClose,
  chatHistory,
  onChatSelect,
  onDeleteChat,
  onNewChat,
  loading = false,
}) => {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleChatPress = (chatId: Id<"chats">) => {
    onChatSelect(chatId);
    onClose();
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const renderChatItem = ({ item }: { item: ChatHistoryItem }) => (
    <View className="flex-row items-center px-4 py-3 border-b border-gray-700">
      <TouchableOpacity
        className="flex-1 mr-3"
        onPress={() => handleChatPress(item._id)}
      >
        <Text className="text-white text-base font-medium mb-1" numberOfLines={1}>
          {item.title}
        </Text>
        <Text className="text-gray-400 text-sm">
          {formatDate(item.updatedAt || item.createdAt)}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        className="p-2"
        onPress={() => onDeleteChat(item._id)}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-900">
        {/* Header */}
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-700">
          <Text className="text-white text-xl font-semibold">Chat History</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* New Chat Button */}
        <TouchableOpacity
          className="flex-row items-center px-4 py-4 bg-blue-600 mx-4 mt-4 rounded-lg"
          onPress={handleNewChat}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text className="text-white text-base font-medium ml-2">Start New Chat</Text>
        </TouchableOpacity>

        {/* Chat List */}
        <View className="flex-1 mt-4">
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-gray-400">Loading chat history...</Text>
            </View>
          ) : chatHistory.length === 0 ? (
            <View className="flex-1 justify-center items-center px-4">
              <Ionicons name="chatbubbles-outline" size={64} color="#6b7280" />
              <Text className="text-gray-400 text-lg mt-4 mb-2">No chat history</Text>
              <Text className="text-gray-500 text-center">
                Start a conversation to see your chat history here
              </Text>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              renderItem={renderChatItem}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};
