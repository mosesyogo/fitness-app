import Groq from "groq-sdk";
import { defineQuery } from "groq";
import { client } from "../../lib/sanity/client";

const exerciseLookupQuery = defineQuery(`*[_type == "exercise" && _id == $id][0]{
  _id,
  name,
  description,
  difficulty
}`);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { exerciseId, exerciseName, description } = body ?? {};

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "GROQ_API_KEY is missing in the Expo server environment." },
        { status: 500 },
      );
    }
    const groq = new Groq({ apiKey });

    let resolvedName = typeof exerciseName === "string" ? exerciseName : "exercise";
    let resolvedDescription = typeof description === "string" ? description : "";

    if (exerciseId) {
      const exercise = await client.fetch(exerciseLookupQuery, { id: exerciseId });

      if (exercise) {
        resolvedName = typeof exercise.name === "string" ? exercise.name : resolvedName;
        resolvedDescription = typeof exercise.description === "string"
          ? exercise.description
          : resolvedDescription;
      }
    }

    const prompt = `You are a fitness coach.
You are given an exercise. Provide clear instructions on how to perform it, including any equipment required. Explain the exercise in detail for a beginner.

The exercise name is: ${resolvedName}
${resolvedDescription ? `Exercise details: ${resolvedDescription}` : ""}

Keep it short and concise. Use Markdown formatting.

Use the following format:

## Equipment Required

## Instructions

### Tips

### Variations

### Safety

Keep spacing between headings and content. Always use headings and subheadings.`;

    const result = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return Response.json({
      guidance: result.choices[0]?.message?.content ?? "",
    });
  } catch (error) {
    console.error("Error fetching Groq guidance:", error);
    return Response.json(
      {
        error: "Could not get exercise guidance.",
        ...(process.env.NODE_ENV !== "production" && {
          details: error instanceof Error ? error.message : String(error),
        }),
      },
      { status: 500 },
    );
  }
}
