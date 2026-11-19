import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { client } from "../../../../lib/sanity/client";
import { StatusBar } from "expo-status-bar";

export const getWorkoutsQuery = defineQuery(`*[_type == "workout" && userId == $userId] | order(date desc) {
  _id,
  date,
  duration,
  exercises[] {
    _key,
    exercise->{
      _id,
      name
    },
    sets[] {
      _key,
      reps,
      weight,
      weightUnit
    }
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

const formatDate = (dateString?: string | null) => {
  if (!dateString) return "Date not recorded";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date not recorded";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatWorkoutDuration = (seconds?: number | null) => {
  if (seconds === undefined || seconds === null || seconds <= 0) {
    return "Duration not recorded";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) return `${remainingSeconds}s`;
  if (remainingSeconds === 0) return `${minutes} min`;
  return `${minutes} min ${remainingSeconds}s`;
};

const getTotalSets = (workout: WorkoutHistoryItem) =>
  workout.exercises?.reduce(
    (total, exercise) => total + (exercise.sets?.length ?? 0),
    0,
  ) ?? 0;

const getExerciseNames = (workout: WorkoutHistoryItem) =>
  (workout.exercises ?? [])
    .map((item) => item.exercise?.name)
    .filter((name): name is string => Boolean(name));

export default function HistoryPage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const { refresh } = useLocalSearchParams<{ refresh?: string }>();

  const [workouts, setWorkouts] = React.useState<WorkoutHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");

  const fetchWorkouts = React.useCallback(async () => {
    if (!isLoaded) return;

    if (!userId) {
      setWorkouts([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const results = await client.fetch(getWorkoutsQuery, { userId });
      setWorkouts((results ?? []) as WorkoutHistoryItem[]);
      setError("");
    } catch (fetchError) {
      console.error("Error fetching workouts:", fetchError);
      setError("We couldn't load your workout history. Pull down to try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoaded, userId]);

  React.useEffect(() => {
    void fetchWorkouts();
  }, [fetchWorkouts]);

  React.useEffect(() => {
    if (refresh === "true") {
      void fetchWorkouts();
      router.replace("/(app)/(tabs)/history");
    }
  }, [fetchWorkouts, refresh, router]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    void fetchWorkouts();
  }, [fetchWorkouts]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="border-b border-gray-200 bg-white px-6 py-4">
          <Text className="text-2xl font-bold text-gray-900">Workout History</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-3 text-gray-600">Loading your workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar />
      <View className="border-b border-gray-200 bg-white px-6 py-4">
        <Text className="text-2xl font-bold text-gray-900">Workout History</Text>
        <Text className="mt-1 text-sm text-gray-600">
          {workouts.length} completed {workouts.length === 1 ? "workout" : "workouts"}
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        ) : null}

        {workouts.length === 0 ? (
          <View className="items-center rounded-2xl bg-white px-8 py-10">
            <Ionicons name="barbell-outline" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-xl font-semibold text-gray-900">
              No workouts yet
            </Text>
            <Text className="mt-2 text-center text-gray-600">
              Your completed workouts will appear here.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {workouts.map((workout) => {
              const names = getExerciseNames(workout);
              const totalSets = getTotalSets(workout);

              return (
                <TouchableOpacity
                  key={workout._id}
                  activeOpacity={0.8}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/(tabs)/history/workout-record",
                      params: { workoutId: workout._id },
                    })
                  }
                >
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-gray-900">
                        {formatDate(workout.date)}
                      </Text>
                      <View className="mt-1 flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="ml-2 text-sm text-gray-600">
                          {formatWorkoutDuration(workout.duration)}
                        </Text>
                      </View>
                    </View>
                    <View className="ml-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <Ionicons name="fitness-outline" size={24} color="#3B82F6" />
                    </View>
                  </View>

                  <View className="mb-3 flex-row gap-2">
                    <View className="rounded-full bg-gray-100 px-3 py-1.5">
                      <Text className="text-xs font-medium text-gray-700">
                        {workout.exercises?.length ?? 0} {(workout.exercises?.length ?? 0) === 1 ? "exercise" : "exercises"}
                      </Text>
                    </View>
                    <View className="rounded-full bg-gray-100 px-3 py-1.5">
                      <Text className="text-xs font-medium text-gray-700">
                        {totalSets} {totalSets === 1 ? "set" : "sets"}
                      </Text>
                    </View>
                  </View>

                  {names.length > 0 ? (
                    <Text className="text-sm leading-5 text-gray-600" numberOfLines={2}>
                      {names.slice(0, 3).join(" · ")}
                      {names.length > 3 ? ` · ${names.length - 3} more` : ""}
                    </Text>
                  ) : null}

                  <View className="mt-4 flex-row items-center justify-end">
                    <Text className="mr-1 text-sm font-semibold text-blue-600">
                      View workout
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
