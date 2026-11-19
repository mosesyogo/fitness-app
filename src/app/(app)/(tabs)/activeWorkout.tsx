import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useFocusEffect, useRouter } from "expo-router";
import { defineQuery } from "groq";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useStopwatch } from "react-timer-hook";
import ExerciseSelectionModal from "../../components/ExerciseSelectionModal";
import { client } from "../../../lib/sanity/client";
import { useWorkoutStore } from "../../../../store/workout-store";

const findExerciseQuery = defineQuery(
  `*[_type == "exercise" && name == $name][0] { _id, name }`,
);

type WorkoutData = {
  _type: "workout";
  userId: string;
  date: string;
  duration: number;
  exercises: {
    _type: "workoutExercise";
    _key: string;
    exercise: { _type: "reference"; _ref: string };
    sets: {
      _type: "set";
      _key: string;
      reps: number;
      weight: number;
      weightUnit: "lbs" | "kg";
    }[];
  }[];
};

export default function ActiveWorkout() {
  const [showExerciseSelection, setShowExerciseSelection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const {
    workoutExercises,
    setWorkoutExercises,
    resetWorkout,
    weightUnit,
    setWeightUnit,
  } = useWorkoutStore();
  const { userId } = useAuth();
  const router = useRouter();
  const { seconds, minutes, totalSeconds, reset } = useStopwatch({
    autoStart: true,
  });

  useFocusEffect(
    useCallback(() => {
      if (workoutExercises.length === 0) reset();
    }, [workoutExercises.length, reset]),
  );

  const getWorkoutDuration = () =>
    `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

  const cancelWorkout = () => {
    Alert.alert(
      "Cancel Workout",
      "Are you sure you want to cancel the workout?",
      [
        { text: "No", style: "cancel" },
        {
          text: "End Workout",
          onPress: () => {
            resetWorkout();
            router.back();
          },
        },
      ],
    );
  };

  const addExercise = () => setShowExerciseSelection(true);

  const deleteExercise = (exerciseId: string) => {
    setWorkoutExercises((exercises) =>
      exercises.filter((exercise) => exercise.id !== exerciseId),
    );
  };

  const addNewSet = (exerciseId: string) => {
    const newSet = {
      id: Math.random().toString(),
      reps: "",
      weight: "",
      weightUnit,
      isCompleted: false,
    };

    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? { ...exercise, sets: [...exercise.sets, newSet] }
          : exercise,
      ),
    );
  };

  const updateSet = (
    exerciseId: string,
    setId: string,
    field: "reps" | "weight",
    value: string,
  ) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId ? { ...set, [field]: value } : set,
              ),
            }
          : exercise,
      ),
    );
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.filter((set) => set.id !== setId),
            }
          : exercise,
      ),
    );
  };

  const toggleSetCompletion = (exerciseId: string, setId: string) => {
    setWorkoutExercises((exercises) =>
      exercises.map((exercise) =>
        exercise.id === exerciseId
          ? {
              ...exercise,
              sets: exercise.sets.map((set) =>
                set.id === setId
                  ? { ...set, isCompleted: !set.isCompleted }
                  : set,
              ),
            }
          : exercise,
      ),
    );
  };

  const saveWorkoutToDatabase = async () => {
    if (!userId) {
      Alert.alert("Sign in required", "Please sign in before saving a workout.");
      return false;
    }
    if (isSaving) return false;

    setIsSaving(true);
    try {
      const exercisesForSanity = await Promise.all(
        workoutExercises.map(async (exercise) => {
          const exerciseDoc = await client.fetch(findExerciseQuery, {
            name: exercise.name,
          });

          if (!exerciseDoc) {
            throw new Error(`Exercise "${exercise.name}" was not found in Sanity.`);
          }

          const setsForSanity = exercise.sets
            .filter((set) => set.isCompleted && set.reps && set.weight)
            .map((set) => ({
              _type: "set" as const,
              _key: Math.random().toString(36).substring(2, 11),
              reps: Number.parseInt(set.reps, 10) || 0,
              weight: Number.parseFloat(set.weight) || 0,
              weightUnit: set.weightUnit,
            }));

          return {
            _type: "workoutExercise" as const,
            _key: Math.random().toString(36).substring(2, 11),
            exercise: {
              _type: "reference" as const,
              _ref: exerciseDoc._id,
            },
            sets: setsForSanity,
          };
        }),
      );

      const validExercises = exercisesForSanity.filter(
        (exercise) => exercise.sets.length > 0,
      );

      if (validExercises.length === 0) {
        Alert.alert(
          "No Completed Sets",
          "Please complete at least one set before saving the workout.",
        );
        return false;
      }

      const workoutData: WorkoutData = {
        _type: "workout",
        userId,
        date: new Date().toISOString(),
        duration: totalSeconds,
        exercises: validExercises,
      };

      const response = await fetch("/api/save-workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workoutData }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Failed to save workout.");
      }

      console.log("Workout saved successfully:", result);
      return true;
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Save Failed", "Failed to save workout. Please try again.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const endWorkout = async () => {
    const saved = await saveWorkoutToDatabase();
    if (!saved) return;

    Alert.alert("Workout Saved", "Your workout has been saved successfully.");
    resetWorkout();
    router.replace("/(app)/(tabs)/history?refresh=true");
  };

  const saveWorkout = () => {
    Alert.alert(
      "Complete Workout",
      "Are you sure you want to complete the workout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Complete", onPress: () => void endWorkout() },
      ],
    );
  };

  const totalSets = workoutExercises.reduce(
    (total, exercise) => total + exercise.sets.length,
    0,
  );
  const completedSets = workoutExercises.reduce(
    (total, exercise) =>
      total + exercise.sets.filter((set) => set.isCompleted).length,
    0,
  );
  const canCompleteWorkout =
    !isSaving &&
    workoutExercises.length > 0 &&
    !workoutExercises.some((exercise) =>
      exercise.sets.some((set) => !set.isCompleted),
    );

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />

      {/* Top Safe Area */}
      <View
        className="bg-gray-800"
        style={{
          paddingTop: Platform.OS === "ios" ? 55 : StatusBar.currentHeight ?? 0,
        }}
      />

      {/* Header */}
      <View className="bg-gray-800 px-6 py-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-semibold text-white">Active Workout</Text>
            <Text className="text-gray-300">{getWorkoutDuration()}</Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <View className="flex-row rounded-lg bg-gray-700 p-1">
              <TouchableOpacity
                onPress={() => setWeightUnit("lbs")}
                className={`rounded px-3 py-1 ${weightUnit === "lbs" ? "bg-blue-600" : ""}`}
              >
                <Text className={`text-sm ${weightUnit === "lbs" ? "text-white" : "text-gray-300"}`}>
                  lbs
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setWeightUnit("kg")}
                className={`rounded px-3 py-1 ${weightUnit === "kg" ? "bg-blue-600" : ""}`}
              >
                <Text className={`text-sm ${weightUnit === "kg" ? "text-white" : "text-gray-300"}`}>
                  kg
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={cancelWorkout}
              className="rounded-lg bg-red-600 px-4 py-2"
            >
              <Text className="font-medium text-white">End Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text className="mb-2 mt-4 text-center text-gray-600">
            {workoutExercises.length} {workoutExercises.length === 1 ? "exercise" : "exercises"}
          </Text>

          {workoutExercises.length === 0 && (
            <View className="mx-1 mt-4 items-center rounded-2xl bg-gray-50 p-8">
              <Ionicons name="barbell-outline" size={48} color="#9CA3AF" />
              <Text className="mt-4 text-center text-lg font-medium text-gray-600">
                No exercises yet
              </Text>
              <Text className="mt-2 text-center text-gray-500">
                Get started by adding your first exercise below
              </Text>
            </View>
          )}

          {workoutExercises.map((exercise) => (
            <View key={exercise.id} className="mb-4">
              <View className="mb-2 flex-row items-center rounded-2xl bg-blue-50 p-3">
                <TouchableOpacity
                  className="flex-1"
                  onPress={() =>
                    router.push({
                      pathname: "/exercise-detail",
                      params: { id: exercise.sanityId },
                    })
                  }
                >
                  <Text className="mb-1 text-lg font-bold text-gray-900">
                    {exercise.name}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {exercise.sets.length} {exercise.sets.length === 1 ? "set" : "sets"} · {exercise.sets.filter((set) => set.isCompleted).length} completed
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${exercise.name}`}
                  onPress={() => deleteExercise(exercise.id)}
                  className="ml-2 h-10 w-10 items-center justify-center rounded-xl bg-red-500"
                >
                  <Ionicons name="trash" size={17} color="white" />
                </TouchableOpacity>
              </View>

              <View className="rounded-2xl border border-gray-200 bg-white p-3">
                <Text className="mb-2 text-base font-semibold text-gray-900">Sets</Text>
                {exercise.sets.length === 0 ? (
                  <Text className="py-4 text-center text-gray-500">
                    No sets yet. Add your first set below.
                  </Text>
                ) : (
                  exercise.sets.map((set, index) => (
                    <View
                      key={set.id}
                      className={`mb-2 rounded-xl border p-3 ${
                        set.isCompleted
                          ? "border-green-300 bg-green-100"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="w-8 font-medium text-gray-700">{index + 1}</Text>

                        <View className="mx-1 flex-1">
                          <Text className="mb-1 text-xs text-gray-500">Reps</Text>
                          <TextInput
                            value={set.reps}
                            onChangeText={(value) =>
                              updateSet(exercise.id, set.id, "reps", value)
                            }
                            placeholder="0"
                            keyboardType="numeric"
                            editable={!set.isCompleted}
                            className={`rounded-lg border px-3 py-2 text-center text-gray-900 ${
                              set.isCompleted
                                ? "border-gray-300 bg-gray-100 text-gray-500"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                        </View>

                        <View className="mx-1 flex-1">
                          <Text className="mb-1 text-xs text-gray-500">
                            Weight ({set.weightUnit})
                          </Text>
                          <TextInput
                            value={set.weight}
                            onChangeText={(value) =>
                              updateSet(exercise.id, set.id, "weight", value)
                            }
                            placeholder="0"
                            keyboardType="numeric"
                            editable={!set.isCompleted}
                            className={`rounded-lg border px-3 py-2 text-center text-gray-900 ${
                              set.isCompleted
                                ? "border-gray-300 bg-gray-100 text-gray-500"
                                : "border-gray-300 bg-white"
                            }`}
                          />
                        </View>

                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={set.isCompleted ? "Mark set incomplete" : "Complete set"}
                          onPress={() => toggleSetCompletion(exercise.id, set.id)}
                          className={`ml-1 h-10 w-10 items-center justify-center rounded-xl ${
                            set.isCompleted ? "bg-green-500" : "bg-gray-200"
                          }`}
                        >
                          <Ionicons
                            name={set.isCompleted ? "checkmark" : "checkmark-outline"}
                            size={20}
                            color={set.isCompleted ? "white" : "#9CA3AF"}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          accessibilityRole="button"
                          accessibilityLabel={`Delete set ${index + 1}`}
                          onPress={() => deleteSet(exercise.id, set.id)}
                          className="ml-1 h-10 w-10 items-center justify-center rounded-xl bg-red-500"
                        >
                          <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}

                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => addNewSet(exercise.id)}
                  className="mt-1 flex-row items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 py-3"
                >
                  <Ionicons name="add" size={16} color="#3B82F6" />
                  <Text className="ml-1 font-medium text-blue-600">Add Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}

          <TouchableOpacity
            accessibilityRole="button"
            onPress={addExercise}
            className="mb-3 flex-row items-center justify-center rounded-2xl bg-blue-600 py-4 active:bg-blue-700"
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="ml-2 text-lg font-semibold text-white">Add Exercise</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={saveWorkout}
            disabled={!canCompleteWorkout}
            className={`mb-2 items-center rounded-2xl py-4 ${
              canCompleteWorkout ? "bg-green-600 active:bg-green-700" : "bg-gray-400"
            }`}
          >
            {isSaving ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="white" />
                <Text className="ml-2 text-lg font-semibold text-white">Saving...</Text>
              </View>
            ) : (
              <Text className="text-lg font-semibold text-white">Complete Workout</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <ExerciseSelectionModal
        visible={showExerciseSelection}
        onClose={() => setShowExerciseSelection(false)}
      />
    </View>
  );
}
