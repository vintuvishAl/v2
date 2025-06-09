import { Ionicons } from "@expo/vector-icons";
import React, { useCallback } from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import type { ModelType } from "../../hooks/useChat";
import { useHapticFeedback } from "../../hooks/useHapticFeedback";
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
  const { onImportantAction, onButtonPress } = useHapticFeedback();

  // Animated values for smooth modal transitions
  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  // Update animation when modal visibility changes
  React.useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(300, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, translateY, opacity]);

  // Animated styles
  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleModelSelect = useCallback((model: ModelType) => {
    onImportantAction();
    onModelSelect(model);
    onClose();
  }, [onImportantAction, onModelSelect, onClose]);

  const handleClose = useCallback(() => {
    onButtonPress();
    onClose();
  }, [onButtonPress, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }, backgroundStyle]}>
        <Animated.View style={[{ backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 0 }, modalStyle]}>
          {/* Modal Header */}
          <View className="flex-row justify-between items-center p-6 border-b border-app-dark-border">
            <Text className="text-app-dark-text text-lg font-semibold">
              Select Model
            </Text>
            <TouchableOpacity
              onPress={handleClose}
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
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};
