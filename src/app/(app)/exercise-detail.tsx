import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { defineQuery } from "groq";
import Markdown from "react-native-markdown-display";
import React from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { client, urlFor } from "../../lib/sanity/client";
import type { Exercise } from "../components/ExerciseCard";

// Defined outside the component so typegen can pick it up
const exerciseByIdQuery = defineQuery(`*[_type == "exercise" && _id == $id][0] {
  _id,
  name,
  description,
  difficulty,
  videoUrl,
  image
}`);

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-500";
    case "intermediate":
      return "bg-yellow-500";
    case "advanced":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
};

const getDifficultyText = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "Beginner";
    case "intermediate":
      return "Intermediate";
    case "advanced":
      return "Advanced";
    default:
      return "Unknown";
  }
};

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();
  const router = useRouter();

  const [exercise, setExercise] = React.useState<Exercise | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [aiGuidance, setAiGuidance] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);

  const toExercise = (value: unknown): Exercise => {
    const data = value as Partial<Exercise> | null;

    return {
      _id: data?._id ?? "",
      name: data?.name ?? "Untitled exercise",
      description: data?.description ?? undefined,
      difficulty: data?.difficulty ?? undefined,
      videoUrl: data?.videoUrl ?? undefined,
      image: data?.image ?? undefined,
    };
  };

  React.useEffect(() => {
    const fetchExercise = async () => {
      if (!id) return;

      try {
        const result = await client.fetch(exerciseByIdQuery, { id });
        setExercise(result ? toExercise(result) : null);
      } catch (err) {
        console.error("Error fetching exercise:", err);
        setError("Could not load this exercise. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    void fetchExercise();
  }, [id]);

  const openVideo = async () => {
    if (!exercise?.videoUrl) return;
    try {
      await Linking.openURL(exercise.videoUrl);
    } catch (err) {
      console.error("Could not open video:", err);
    }
  };

  const getAiGuidance = async () => {
    if (!exercise) return;

    try {
      setAiLoading(true);

      const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "";
      const response = await fetch(`${baseUrl}/api/ai`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ exerciseId: exercise._id }),
      });

      const responseText = await response.text();
      let data: {
        details?: unknown;
        error?: unknown;
        guidance?: unknown;
      };

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        const preview = responseText.replace(/\s+/g, " ").slice(0, 240);
        throw new Error(
          `API returned non-JSON (${response.status}): ${preview || "empty response"}`,
        );
      }

      if (!response.ok) {
        const message =
          typeof data?.details === "string"
            ? data.details
            : typeof data?.error === "string"
              ? data.error
              : `Request failed: ${response.status}`;
        throw new Error(message);
      }

      if (typeof data?.guidance !== "string" || !data.guidance.trim()) {
        throw new Error("The AI API returned an empty guidance response.");
      }

      setAiGuidance(data.guidance ?? "");
    } catch (error) {
      console.error("Error fetching AI guidance:", error);
      const message =
        error instanceof Error ? error.message : "Unknown request error.";
      setAiGuidance(`AI request failed: ${message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Close button that sits on top-left of the screen
  const renderCloseButton = () => (
    <TouchableOpacity
      onPress={() => router.back()}
      className="absolute top-4 left-4 w-10 h-10 bg-gray-200 rounded-full items-center justify-center z-10"
      activeOpacity={0.7}
      accessibilityLabel="Close"
    >
      <Ionicons name="close" size={22} color="#6B7280" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#0000ff" />
          <Text className="text-gray-500">Loading exercise...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !exercise) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar style="dark" />
        {renderCloseButton()}
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#9CA3AF" />
          <Text className="text-xl font-semibold text-gray-900 mt-4">
            {error ? "Something went wrong" : "Exercise not found"}
          </Text>
          <Text className="text-gray-600 text-center mt-2">
            {error || "This exercise may have been removed."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image with close button */}
        <View className="relative bg-white">
          {renderCloseButton()}

          {exercise.image ? (
            <Image
              source={{ uri: urlFor(exercise.image).width(1200).url() }}
              accessibilityLabel={exercise.image.alt ?? exercise.name ?? "Exercise image"}
              style={{ width: "100%", height: 288 }}
              resizeMode="contain"
            />
          ) : (
            <View className="w-full h-72 items-center justify-center">
              <Ionicons name="fitness-outline" size={72} color="#9CA3AF" />
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-6 pb-10">
          {/* Title and difficulty */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-800 mb-2">
              {exercise.name}
            </Text>
            <View
              className={`self-start px-4 py-2 rounded-full ${getDifficultyColor(
                exercise.difficulty ?? "",
              )}`}
            >
              <Text className="text-white font-semibold text-sm">
                {getDifficultyText(exercise.difficulty ?? "")}
              </Text>
            </View>
          </View>

          {/* Description */}
          {!!exercise.description && (
            <View className="mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                Description
              </Text>
              <Text className="text-gray-600 leading-6">
                {exercise.description}
              </Text>
            </View>
          )}

          {/* Video section */}
          {!!exercise.videoUrl && (
            <View className="mb-6">
              <Text className="text-xl font-semibold text-gray-800 mb-3">
                Video Tutorial
              </Text>
              <TouchableOpacity
                className="bg-red-500 rounded-xl p-4 flex-row items-center"
                onPress={openVideo}
                activeOpacity={0.8}
              >
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
                  <Ionicons name="play" size={20} color="#EF4444" />
                </View>
                <View>
                  <Text className="text-white font-semibold text-lg">
                    Watch Tutorial
                  </Text>
                  <Text className="text-red-100 text-sm">
                    Learn proper form
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Guidance */}
          {(aiGuidance || aiLoading) && (
            <View className="mb-6">
              <View className="flex-row items-center mb-3">
                <Ionicons name="fitness" size={24} color="#3B82F6" />
                <Text className="text-xl font-semibold text-gray-800 ml-2">
                  AI Coach says...
                </Text>
              </View>

              {aiLoading ? (
                <View className="bg-gray-50 rounded-xl p-4 items-center">
                  <ActivityIndicator size="small" color="#3B82F6" />
                  <Text className="text-gray-600 mt-2">
                    Getting personalized guidance...
                  </Text>
                </View>
              ) : (
                <View className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-500">
                  <Markdown
                    style={{
                      body: {
                        color: "#374151",
                        paddingBottom: 20,
                      },
                      heading2: {
                        fontSize: 18,
                        fontWeight: "bold",
                        color: "#1F2937",
                        marginTop: 12,
                        marginBottom: 6,
                      },
                      heading3: {
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#374151",
                        marginTop: 8,
                        marginBottom: 4,
                      },
                    }}
                  >
                    {aiGuidance}
                  </Markdown>
                </View>
              )}
            </View>
          )}

          {/* Action Buttons */}
          <View className="mt-8 gap-2">
            {/* AI Coach Button */}
            <TouchableOpacity
              className={`rounded-xl py-4 items-center ${
                aiLoading
                  ? "bg-gray-400"
                  : aiGuidance
                    ? "bg-green-500"
                    : "bg-blue-500"
              }`}
              onPress={getAiGuidance}
              disabled={aiLoading}
              activeOpacity={0.8}
            >
              {aiLoading ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Loading...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-bold text-lg">
                  {aiGuidance
                    ? "Refresh AI Guidance"
                    : "Get AI Guidance on Form & Technique"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              className="bg-gray-200 rounded-xl py-4 items-center"
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text className="text-gray-800 font-bold text-lg">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
