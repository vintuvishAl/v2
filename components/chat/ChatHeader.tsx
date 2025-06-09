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
}) => {
  return (
    <View className="flex-row justify-between items-center px-6 py-4 bg-app-dark-background">
      <View className="flex-row items-center">
        <TouchableOpacity testID="all-chats-button" className="p-2 " onPress={onMenuPress}>
          <Ionicons
            name="menu"
            size={30}
            className="text-app-dark-icon"
            color={"#1cb8ff"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          testID="add-button"
          className="p-2"
          onPress={onNewChatPress}
        >
          <Ionicons
            name="add"
            size={30}
            className="text-app-dark-icon"
            color={"#1cb8ff"}
          />
        </TouchableOpacity>
        {/* <TouchableOpacity testID="search-button" className="p-2" onPress={onSearchPress}>
          <Ionicons
            name="search"
            size={30}
            className="text-app-dark-icon"
            color={"#1cb8ff"}
          />
        </TouchableOpacity> */}
        
      </View>

      <View className="flex-row items-center space-x-2">
        <Text className="text-app-dark-text text-xl font-bold">
          V2 Chat
        </Text>
      </View>
    </View>
  );
};
