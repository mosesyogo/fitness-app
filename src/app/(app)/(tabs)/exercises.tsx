import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ExerciseCard, { Exercise } from "../../components/ExerciseCard";
import { client, exercisesQuery } from "../../../lib/sanity/client";

export default function Exercises() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExercises = async () => {
    try {
      const results = await client.fetch(exercisesQuery);
      const data: Exercise[] = results.map((exercise) => ({
        _id: exercise._id,
        name: exercise.name ?? "Untitled exercise",
        description: exercise.description ?? undefined,
        difficulty: exercise.difficulty ?? undefined,
        videoUrl: exercise.videoUrl ?? undefined,
        image: exercise.image ?? undefined,
      }));
      setExercises(data);
      setFilteredExercises(data);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      // You could add error handling here, like showing a toast
    } finally {
      setLoading(false);
    }
  };

  // Load exercises when the screen first opens
  useEffect(() => {
    void fetchExercises();
  }, []);

  // Filter the list whenever the search text or the data changes
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      setFilteredExercises(exercises);
      return;
    }

    setFilteredExercises(
      exercises.filter((exercise) =>
        exercise.name.toLowerCase().includes(query),
      ),
    );
  }, [searchQuery, exercises]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-6 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">
          Exercise Library
        </Text>
        <Text className="text-gray-600 mt-1">
          Discover and master new exercises
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mt-4">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-3 text-gray-800 outline-none"
            placeholder="Search exercises..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Exercise List */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
        renderItem={({ item }) => (
          <ExerciseCard
            item={item}
            onPress={() =>
              router.push(`/exercise-detail?id=${item._id}` as any)
            }
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]} // Android
            tintColor="#3B82F6" // iOS
            title="Pull to refresh exercises" // iOS
            titleColor="#6B7280" // iOS
          />
        }
        ListEmptyComponent={
          <View className="bg-white rounded-2xl p-8 items-center">
            <Ionicons name="fitness-outline" size={64} color="#9CA3AF" />
            <Text className="text-xl font-semibold text-gray-900 mt-4">
              {loading
                ? "Loading exercises..."
                : searchQuery
                  ? "No exercises found"
                  : "No exercises yet"}
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              {searchQuery
                ? "Try adjusting your search"
                : "Your exercises will appear here"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
