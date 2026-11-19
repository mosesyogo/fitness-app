import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const router = useRouter();

  const startWorkout = () => {
    router.push("/activeWorkout");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      <View className="flex-1 px-6 py-8">
        <View className="mb-8">
          <Text className="mb-2 text-3xl font-bold text-gray-900">
            Ready to Train?
          </Text>
          <Text className="text-lg text-gray-600">
            Start your workout session
          </Text>
        </View>

        <View className="mb-6 rounded-3xl border mt-auto  border-gray-100 bg-white p-6 shadow-sm " >
          <View className="mb-6 flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="fitness" size={24} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-xl font-semibold text-gray-900">
                  Start Workout
                </Text>
                <Text className="mt-1 text-sm text-gray-500">
                  Begin your training session
                </Text>
              </View>
            </View>

            <View className="rounded-full bg-green-100 px-3 py-1">
              <Text className="text-sm font-medium text-green-700">Ready</Text>
            </View>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.8}
            className="items-center rounded-2xl bg-blue-600 py-4 active:bg-blue-700"
            onPress={startWorkout}
          >
            <View className="flex-row items-center">
              <Ionicons name="play" size={20} color="white" />
              <Text className="ml-2 text-lg font-semibold text-white">
                Start Workout
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
