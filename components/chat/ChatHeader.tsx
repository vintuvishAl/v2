import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity, View } from "react-native";

interface ChatHeaderProps {
  onMenuPress: () => void;
  onSearchPress: () => void;
  onNewChatPress: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onMenuPress,
  onSearchPress,
  onNewChatPress,
}) => {
  return (
    <View className="flex-row justify-start items-center px-6 py-4 bg-app-dark-background">
      <View className="flex-row space-x-6">
        <TouchableOpacity testID="all-chats-button" className="p-2" onPress={onMenuPress}>
          <Ionicons
            name="menu"
            size={24}
            className="text-app-dark-icon"
            color={"#1769aa"}
          />
        </TouchableOpacity>
        <TouchableOpacity testID="search-button" className="p-2" onPress={onSearchPress}>
          <Ionicons
            name="search"
            size={24}
            className="text-app-dark-icon"
            color={"#1769aa"}
          />
        </TouchableOpacity>
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
    </View>
  );
};
