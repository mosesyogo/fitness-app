import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { defineQuery } from "groq";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDuration } from "../../../../../lib/utils";
import { client } from "../../../../lib/sanity/client";

const getWorkoutsQuery = defineQuery(`*[_type == "workout" && userId == $userId] | order(date desc) {
  _id,
  date,
  duration,
  exercises[] {
    _key,
    exercise->{ _id, name },
    sets[] { _key, reps, weight, weightUnit }
  }
}`);

type WorkoutHistoryItem = {
  _id: string;
  date?: string | null;
  duration?: number | null;
  exercises?: Array<{
    _key: string;
    exercise?: { _id: string; name?: string | null } | null;
    sets?: Array<{
      _key: string;
      reps?: number | null;
      weight?: number | null;
      weightUnit?: "lbs" | "kg" | null;
    }> | null;
  }> | null;
};

export default function Page() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [workouts, setWorkouts] = React.useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user?.id) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    let isCurrent = true;
    const fetchWorkouts = async () => {
      setLoading(true);
      try {
        const results = await client.fetch<WorkoutHistoryItem[]>(getWorkoutsQuery, {
          userId: user.id,
        });
        if (isCurrent) setWorkouts(results);
      } catch (error) {
        console.error("Error fetching profile workouts:", error);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    void fetchWorkouts();
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce(
    (total, workout) => total + (workout.duration ?? 0),
    0,
  );
  const averageDuration = totalWorkouts
    ? Math.round(totalDuration / totalWorkouts)
    : 0;
  const joinDate = user?.createdAt ? new Date(user.createdAt) : new Date();
  const daysSinceJoining = Math.max(
    0,
    Math.floor((Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const formattedJoinDate = joinDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const performSignOut = async () => {
    try {
      // The Stack.Protected guard in the (app) layout redirects to
      // the sign-in screen automatically once the session ends
      await signOut();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Please try again.";

      if (Platform.OS === "web") {
        window.alert(`Sign out failed: ${message}`);
      } else {
        Alert.alert("Sign out failed", message);
      }
    }
  };

  const handleSignOut = () => {
    // Alert.alert buttons don't work on web, so use a browser confirm there
    if (Platform.OS === "web") {
      if (window.confirm("Are you sure you want to sign out?")) {
        void performSignOut();
      }
      return;
    }

    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-gray-900">Profile</Text>
          <Text className="text-gray-600 mt-1">Manage your account and stats</Text>
        </View>

        {/* User Info Card */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <View className="flex-row items-center">
              <Image
                source={{
                  uri: user?.externalAccounts[0]?.imageUrl ?? user?.imageUrl,
                }}
                className="rounded-full"
                style={{ width: 64, height: 64 }}
              />
              <View className="flex-1 ml-4">
                <Text className="text-xl font-semibold text-gray-900">
                  {user?.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || "User"}
                </Text>
                <Text className="text-gray-600">
                  {user?.primaryEmailAddress?.emailAddress ?? ""}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Member since {formattedJoinDate}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your Fitness Stats
            </Text>
            {loading ? (
              <View className="py-5 items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="text-sm text-gray-500 mt-2">Loading stats...</Text>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between">
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-bold text-blue-600">
                      {totalWorkouts}
                    </Text>
                    <Text className="text-sm text-gray-600 text-center">
                      Total{"\n"}Workouts
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-bold text-green-600">
                      {formatDuration(totalDuration)}
                    </Text>
                    <Text className="text-sm text-gray-600 text-center">
                      Total{"\n"}Time
                    </Text>
                  </View>
                  <View className="items-center flex-1">
                    <Text className="text-2xl font-bold text-purple-600">
                      {daysSinceJoining}
                    </Text>
                    <Text className="text-sm text-gray-600 text-center">
                      Days Since Joining
                    </Text>
                  </View>
                </View>
                {totalWorkouts > 0 && (
                  <View className="mt-4 pt-4 border-t border-gray-100 flex-row items-center justify-between">
                    <Text className="text-gray-600">Average workout duration:</Text>
                    <Text className="font-semibold text-gray-900">
                      {formatDuration(averageDuration)}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* Account Settings */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-3">
            Account Settings
          </Text>
          <View className="bg-white rounded-2xl shadow-sm border border-gray-100">
            {[
              { label: "Edit Profile", icon: "person-outline" as const, color: "#3B82F6" },
              { label: "Notifications", icon: "notifications-outline" as const, color: "#10B981" },
              { label: "Preferences", icon: "settings-outline" as const, color: "#8B5CF6" },
              { label: "Help & Support", icon: "help-circle-outline" as const, color: "#F59E0B" },
            ].map((item, index) => (
              <TouchableOpacity
                key={item.label}
                className={`flex-row items-center justify-between p-4 ${
                  index < 3 ? "border-b border-gray-100" : ""
                }`}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text className="text-gray-900 font-medium">{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-6 mb-8">
          <TouchableOpacity
            onPress={handleSignOut}
            className="bg-red-600 rounded-2xl p-4 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
