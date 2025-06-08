import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity } from "react-native";

const redirectTo = makeRedirectUri();

export function GoogleSignIn() {
  const { signIn } = useAuthActions();
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const { redirect } = await signIn("google", { redirectTo });
      
      if (Platform.OS === "web") {
        // On web, the redirect handles everything
        return;
      }
      
      // On mobile, handle the auth session
      const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);
      if (result.type === "success") {
        const { url } = result;
        const code = new URL(url).searchParams.get("code");
        if (code) {
          await signIn("google", { code });
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      Alert.alert("Sign In Error", "Failed to sign in with Google. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <TouchableOpacity
      onPress={handleSignIn}
      disabled={isLoading}
      className="bg-white rounded-lg px-6 py-4 flex-row items-center justify-center shadow-lg border border-gray-200"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#1f2937" />
      ) : (
        <>
          <Text className="text-gray-800 text-lg font-semibold ml-2">
            Sign in with Google
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
