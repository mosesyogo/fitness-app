import { defineField, defineType } from "sanity";
import { Dumbbell } from "lucide-react";

export const exerciseType = defineType({
  name: "exercise",
  title: "Exercise",
  type: "document",
  icon: Dumbbell,
  fields: [
    defineField({
      name: "name",
      title: "Name",
      description: "The name of the exercise, for example 'Barbell Squat'",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      description:
        "A short explanation of how to do the exercise and which muscles it works",
      type: "text",
      rows: 4,
    }),
    defineField({
      name: "difficulty",
      title: "Difficulty",
      description: "How challenging the exercise is for the person doing it",
      type: "string",
      options: {
        list: [
          { title: "Beginner", value: "beginner" },
          { title: "Intermediate", value: "intermediate" },
          { title: "Advanced", value: "advanced" },
        ],
        layout: "radio",
      },
      initialValue: "beginner",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt Text",
          description:
            "Remember to use alt text for people to be able to read what is happening in the image if they are using a screen reader, it's also important for SEO",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "videoUrl",
      title: "Video URL",
      description:
        "A link to a video showing how to do the exercise, for example a YouTube link",
      type: "string",
      validation: (rule) => rule.uri({ scheme: ["http", "https"] }),
    }),
    defineField({
      name: "isActive",
      title: "Is Active?",
      description:
        "Turn this off to hide the exercise from the app without deleting it",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "difficulty",
      media: "image",
    },
  },
});