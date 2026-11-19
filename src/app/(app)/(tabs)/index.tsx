import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { defineQuery } from "groq";
import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { formatDuration } from "../../../../lib/utils";
import { client } from "../../../lib/sanity/client";

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
  const { user } = useUser();
  const router = useRouter();
  const [workouts, setWorkouts] = React.useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const fetchWorkouts = async () => {
    if (!user?.id) {
      setWorkouts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const results = await client.fetch<WorkoutHistoryItem[]>(getWorkoutsQuery, {
        userId: user.id,
      });
      setWorkouts(results);
    } catch (error) {
      console.error("Error fetching workouts:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    void fetchWorkouts();
    // fetch when the signed-in user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    void fetchWorkouts();
  };

  const totalWorkouts = workouts.length;
  const lastWorkout = workouts[0];
  const totalDuration = workouts.reduce(
    (sum, workout) => sum + (workout.duration ?? 0),
    0,
  );
  const averageDuration = totalWorkouts
    ? Math.round(totalDuration / totalWorkouts)
    : 0;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalSets = (workout: WorkoutHistoryItem) =>
    workout.exercises?.reduce(
      (total, exercise) => total + (exercise.sets?.length ?? 0),
      0,
    ) ?? 0;

  const getExerciseNames = (workout: WorkoutHistoryItem) =>
    workout.exercises
      ?.map((item) => item.exercise?.name)
      .filter((name): name is string => Boolean(name)) ?? [];

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-600 mt-4">Loading your workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Header */}
        <View className="px-6 pt-8 pb-6">
          <Text className="text-lg text-gray-600">Welcome back,</Text>
          <Text className="text-3xl font-bold text-gray-900">
            {user?.firstName || "Athlete"}! 💪
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="px-6 mb-6">
          <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Your Stats
            </Text>
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
                  {averageDuration > 0 ? formatDuration(averageDuration) : "0m"}
                </Text>
                <Text className="text-sm text-gray-600 text-center">
                  Average{"\n"}Duration
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/workout")}
            className="bg-blue-600 rounded-2xl p-6 mb-4 shadow-sm"
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center flex-1">
                <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-4">
                  <Ionicons name="play" size={24} color="white" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-xl font-semibold">
                    Start Workout
                  </Text>
                  <Text className="text-blue-100">
                    Begin your training session
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>

          <View className="flex-row gap-4">
            <TouchableOpacity
              onPress={() => router.push("/history")}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              activeOpacity={0.7}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="time-outline" size={24} color="#6B7280" />
                </View>
                <Text className="text-gray-900 font-medium text-center">
                  Workout{"\n"}History
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push("/exercises")}
              className="flex-1 bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              activeOpacity={0.7}
            >
              <View className="items-center">
                <View className="w-12 h-12 bg-gray-100 rounded-full items-center justify-center mb-3">
                  <Ionicons name="barbell-outline" size={24} color="#6B7280" />
                </View>
                <Text className="text-gray-900 font-medium text-center">
                  Browse{"\n"}Exercises
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Workout */}
        {lastWorkout && (
          <View className="px-6 mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Last Workout
            </Text>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/history/workout-record",
                  params: { workoutId: lastWorkout._id },
                })
              }
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between mb-4">
                <View>
                  <Text className="text-lg font-semibold text-gray-900">
                    {formatDate(lastWorkout.date ?? "")}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={16} color="#6B7280" />
                    <Text className="text-gray-600 ml-2">
                      {lastWorkout.duration != null
                        ? formatDuration(lastWorkout.duration)
                        : "Duration not recorded"}
                    </Text>
                  </View>
                </View>
                <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
                  <Ionicons name="fitness-outline" size={24} color="#3B82F6" />
                </View>
              </View>
              <Text className="text-gray-600">
                {lastWorkout.exercises?.length ?? 0} exercises · {getTotalSets(lastWorkout)} sets
              </Text>
              {getExerciseNames(lastWorkout).length > 0 && (
                <Text className="text-sm text-gray-500 mt-2" numberOfLines={1}>
                  {getExerciseNames(lastWorkout).join(", ")}
                </Text>
              )}
              <View className="flex-row justify-end mt-3">
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty State */}
        {totalWorkouts === 0 && (
          <View className="px-6 mb-6">
            <View className="bg-white rounded-2xl p-8 items-center shadow-sm border border-gray-100">
              <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="barbell-outline" size={32} color="#3B82F6" />
              </View>
              <Text className="text-xl font-semibold text-gray-900 mb-2">
                Ready to start your fitness journey?
              </Text>
              <Text className="text-gray-600 text-center mb-4">
                Track your workouts and see your progress over time.
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/workout")}
                className="bg-blue-600 rounded-xl px-6 py-3"
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold">
                  Start Your First Workout
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
