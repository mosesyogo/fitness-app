import { Activity } from "lucide-react";
import { defineArrayMember, defineField, defineType } from "sanity";

export const workoutType = defineType({
  name: "workout",
  title: "Workout",
  type: "document",
 icon: Activity,
  fields: [
    defineField({
      name: "userId",
      title: "User ID",
      description: "The Clerk ID of the person who did this workout",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "date",
      title: "Date",
      description: "The day and time the workout took place",
      type: "datetime",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "duration",
      title: "Duration (seconds)",
      description: "How long the workout lasted, in seconds",
      type: "number",
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: "exercises",
      title: "Exercises",
      description:
        "The exercises done in this workout, with the sets completed for each one",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          name: "workoutExercise",
          title: "Workout Exercise",
          fields: [
            defineField({
              name: "exercise",
              title: "Exercise",
              description: "The exercise that was performed",
              type: "reference",
              to: [{ type: "exercise" }],
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: "sets",
              title: "Sets",
              description: "Each set completed for this exercise",
              type: "array",
              of: [
                defineArrayMember({
                  type: "object",
                  name: "set",
                  title: "Set",
                  fields: [
                    defineField({
                      name: "reps",
                      title: "Reps",
                      description: "How many times the exercise was repeated",
                      type: "number",
                      validation: (rule) => rule.required().integer().min(0),
                    }),
                    defineField({
                      name: "weight",
                      title: "Weight",
                      description: "How much weight was used for this set",
                      type: "number",
                      validation: (rule) => rule.min(0),
                    }),
                    defineField({
                      name: "weightUnit",
                      title: "Weight Unit",
                      description: "Whether the weight is in pounds or kilograms",
                      type: "string",
                      options: {
                        list: [
                          { title: "Pounds (lbs)", value: "lbs" },
                          { title: "Kilograms (kg)", value: "kg" },
                        ],
                        layout: "radio",
                      },
                      initialValue: "lbs",
                    }),
                  ],
                  preview: {
                    select: {
                      reps: "reps",
                      weight: "weight",
                      weightUnit: "weightUnit",
                    },
                    prepare({ reps, weight, weightUnit }) {
                      return {
                        title: `${reps ?? 0} reps`,
                        subtitle:
                          weight !== undefined
                            ? `${weight} ${weightUnit ?? ""}`.trim()
                            : "Bodyweight",
                      };
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              exerciseName: "exercise.name",
              sets: "sets",
            },
            prepare({ exerciseName, sets }) {
              const count = Array.isArray(sets) ? sets.length : 0;
              return {
                title: exerciseName ?? "Unnamed exercise",
                subtitle: `${count} ${count === 1 ? "set" : "sets"}`,
              };
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      date: "date",
      duration: "duration",
      exercises: "exercises",
    },
    prepare({ date, duration, exercises }) {
      const exerciseCount = Array.isArray(exercises) ? exercises.length : 0;
      const minutes = Math.round((duration ?? 0) / 60);

      return {
        title: date
          ? new Date(date).toLocaleDateString(undefined, {
              weekday: "short",
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "No date",
        subtitle: `${minutes} min · ${exerciseCount} ${
          exerciseCount === 1 ? "exercise" : "exercises"
        }`,
      };
    },
  },
});