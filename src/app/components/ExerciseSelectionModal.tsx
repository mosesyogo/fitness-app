import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { client, exercisesQuery } from "../../lib/sanity/client";
import { useWorkoutStore } from "../../../store/workout-store";
import ExerciseCard, { Exercise } from "./ExerciseCard";

interface ExerciseSelectionModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ExerciseSelectionModal({
  visible,
  onClose,
}: ExerciseSelectionModalProps) {
  const { addExerciseToWorkout } = useWorkoutStore();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load the exercises each time the modal opens
  useEffect(() => {
    if (visible) {
      void fetchExercises();
    }
  }, [visible]);

  // Filter the list whenever the search text or the data changes
  useEffect(() => {
    const filtered = exercises.filter((exercise) =>
      exercise.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    setFilteredExercises(filtered);
  }, [searchQuery, exercises]);

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
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    // Directly add exercise to workout
    addExerciseToWorkout({ name: exercise.name, sanityId: exercise._id });
    onClose();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="px-4 pt-4 pb-4 border-b border-gray-100 bg-white">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-gray-800">
              Add Exercise
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-4">
            Tap any exercise to add it to your workout
          </Text>

          {/* Search Bar */}
          <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
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
          renderItem={({ item }) => (
            <ExerciseCard
              item={item}
              onPress={() => handleExercisePress(item)}
              showChevron={false}
            />
          )}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: 16,
            paddingBottom: 32,
            paddingHorizontal: 16,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]} // Android
              tintColor="#3B82F6" // iOS
            />
          }
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="fitness-outline" size={64} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-400 mt-4">
                {searchQuery ? "No exercises found" : "Loading exercises..."}
              </Text>
              <Text className="text-sm text-gray-400 mt-2">
                {searchQuery ? "Try adjusting your search" : "Please wait a moment"}
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </Modal>
  );
}
