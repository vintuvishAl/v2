import { useQuery } from 'convex/react';
import React from 'react';
import { Text, View } from 'react-native';
import ChatView from '../components/ChatView';
import { AuthScreen } from '../components/auth';
import { api } from '../convex/_generated/api';

export default function HomeScreen() {
  const user = useQuery(api.auth.currentUser);

  if (user === undefined) {
    // Loading state
    return (
      <View className="flex-1 bg-app-dark-background justify-center items-center">
        <Text className="text-white text-lg">Loading...</Text>
      </View>
    );
  }

  if (user === null) {
    // Not authenticated
    return <AuthScreen />;
  }
  // Authenticated - show the chat
  return <ChatView userName={user.name || user.email || "user"} />;
}
