import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { urlFor } from "../../lib/sanity/client";

export type Exercise = {
  _id: string;
  name: string;
  description?: string | null;
  difficulty?: "beginner" | "intermediate" | "advanced" | string | null;
  videoUrl?: string | null;
  image?: {
    alt?: string | null;
    asset?: {
      _ref?: string;
      _type?: "reference";
      [key: string]: unknown;
    } | null;
    [key: string]: unknown;
  } | null;
};

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

interface ExerciseCardProps {
  item: Exercise;
  onPress: () => void;
  showChevron?: boolean;
}

export default function ExerciseCard({
  item,
  onPress,
  showChevron = true,
}: ExerciseCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="bg-white rounded-2xl mb-4 shadow-sm border border-gray-100"
    >
      <View className="flex-row items-center p-4">
        {/* Thumbnail */}
        <View className="w-20 h-20 bg-white rounded-xl overflow-hidden mr-4 items-center justify-center">
          {item.image ? (
            <Image
              source={{ uri: urlFor(item.image).width(240).height(240).url() }}
              accessibilityLabel={item.image.alt ?? item.name}
              style={{ width: 80, height: 80 }}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name="fitness-outline" size={36} color="#9CA3AF" />
          )}
        </View>

        {/* Details */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900 mb-1">
            {item.name}
          </Text>

          {!!item.description && (
            <Text className="text-sm text-gray-600 mb-2" numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View
            className={`self-start px-3 py-1 rounded-full ${getDifficultyColor(
              item.difficulty ?? "",
            )}`}
          >
            <Text className="text-xs font-semibold text-white">
              {getDifficultyText(item.difficulty ?? "")}
            </Text>
          </View>
        </View>

        {/* Chevron */}
        {showChevron && (
          <Ionicons
            name="chevron-forward"
            size={20}
            color="#6B7280"
            style={{ marginLeft: 8 }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}
