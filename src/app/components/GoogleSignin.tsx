import React, { useCallback, useEffect } from "react";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Platform, Text, TouchableOpacity, View } from "react-native";

export const useWarmUpBrowser = () => {
  useEffect(() => {
    if (Platform.OS === "web") return;

    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

// Handle any pending authentication sessions
if (Platform.OS !== "web") {
  WebBrowser.maybeCompleteAuthSession();
}

export default function GoogleSignIn() {
  useWarmUpBrowser();

  // Use the `useSSO()` hook to access the `startSSOFlow()` method
  const { startSSOFlow } = useSSO();

  const onPress = useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: "acme",
          path: "sso-callback",
        }),
      });

      // If sign in was successful, set the active session
      if (createdSessionId) {
        await setActive!({ session: createdSessionId });
      } else {
        // If there is no `createdSessionId`, there are missing requirements,
        // such as MFA. Use the `signIn` or `signUp` returned from
        // `startSSOFlow` to handle them.
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      console.error("Google sign-in failed:", err);
    }
  }, [startSSOFlow]);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white border-2 border-gray-200 rounded-xl py-4 shadow-sm"
      activeOpacity={0.8}
    >
      <View className="flex-row items-center justify-center">
        <Ionicons name="logo-google" size={20} color="#EA4335" />
        <Text className="text-gray-900 font-semibold text-lg ml-3">
          Continue with Google
        </Text>
      </View>
    </TouchableOpacity>
  );
}