import React from 'react';
import { SafeAreaView, Text, View } from 'react-native';
import { GoogleSignIn } from './GoogleSignIn';

export function AuthScreen() {
  return (
    <SafeAreaView className="flex-1 bg-app-dark-background">
      <View className="flex-1 justify-center items-center px-8">
        {/* Header */}
        <View className="mb-12 items-center">
          <Text className="text-white text-3xl font-bold mb-4">
            Welcome to LLM Chat
          </Text>
          <Text className="text-gray-400 text-center text-lg leading-6">
            Sign in to start chatting with AI assistants
          </Text>
        </View>

        {/* Sign In Section */}
        <View className="w-full max-w-sm">
          <GoogleSignIn />
        </View>
      </View>
    </SafeAreaView>
  );
}
