import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface ChatHeaderProps {
  onMenuPress: () => void;
  onSearchPress: () => void;
  onNewChatPress: () => void;
  useAgent: boolean;
  onToggleAgent: (enabled: boolean) => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onMenuPress,
  onSearchPress,
  onNewChatPress,
  useAgent,
  onToggleAgent,
}) => {  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-app-dark-background">      <View className="flex-row items-center">
        <TouchableOpacity testID="all-chats-button" className="p-2 mr-6" onPress={onMenuPress}>
          <Ionicons
            name="menu"
            size={24}
            className="text-app-dark-icon"
            color={"#1769aa"}
          />
        </TouchableOpacity>
        {/* <TouchableOpacity testID="search-button" className="p-2" onPress={onSearchPress}>
          <Ionicons
            name="search"
            size={24}
            className="text-app-dark-icon"
            color={"#1769aa"}
          />
        </TouchableOpacity> */}
        <TouchableOpacity
          testID="add-button"
          className="p-2"
          onPress={onNewChatPress}
        >
          <Ionicons
            name="add"
            size={24}
            className="text-app-dark-icon"
            color={"#1769aa"}
          />
        </TouchableOpacity>
      </View>

      <View className="flex-1">
        <Text className="text-app-dark-text text-lg font-semibold">
          V2Chat
        </Text>
      </View>
      
      {/* Search Button */}
        {/* Agent Toggle */}
      <TouchableOpacity
        testID="agent-toggle"
        className={`px-3 py-2 rounded-lg flex-row items-center ${
          useAgent ? 'bg-blue-600' : 'bg-gray-600'
        }`}
        onPress={() => onToggleAgent(!useAgent)}
      >
        <Ionicons
          name={useAgent ? "calculator" : "chatbubble"}
          size={16}
          color="white"
        />
        <View className="w-2" />
        <Ionicons
          name="swap-horizontal"
          size={12}
          color="white"
        />
      </TouchableOpacity>
    </View>
  );
};
