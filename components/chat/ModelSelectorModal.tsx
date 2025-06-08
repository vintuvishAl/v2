import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import type { ModelType } from "../../hooks/useChat";
import { modelOptions } from "./ChatInput";

interface ModelSelectorModalProps {
  visible: boolean;
  selectedModel: ModelType;
  onClose: () => void;
  onModelSelect: (model: ModelType) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  visible,
  selectedModel,
  onClose,
  onModelSelect,
}) => {
  const handleModelSelect = (model: ModelType) => {
    onModelSelect(model);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-app-dark-background rounded-t-3xl pb-0">
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-app-dark-border">
            <Text className="text-app-dark-text text-lg font-semibold">
              Select Model
            </Text>
            <TouchableOpacity
              onPress={onClose}
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
                onPress={() => handleModelSelect(model.id)}
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
  );
};
