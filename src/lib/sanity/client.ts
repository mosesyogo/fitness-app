import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import { defineQuery } from "groq";

// Client safe config
export const config = {
  projectId: "1zqfkwtf",
  dataset: "production",
  apiVersion: "2026-05-15",
  useCdn: false,

};

export const client = createClient(config);

// Admin level client, used for backend
// admin client for mutations
const adminConfig = {
  ...config,
  token: process.env.SANITY_API_TOKEN,
};

export const adminClient = createClient(adminConfig);

// Image URL builder
const builder = imageUrlBuilder(client);

// Turns a Sanity image field into a URL you can resize, e.g.
// urlFor(item.image).width(800).url()
export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}

// Defined with defineQuery so typegen can generate types for it
export const exercisesQuery = defineQuery(`*[_type == "exercise" && isActive != false] | order(name asc) {
  _id,
  name,
  description,
  difficulty,
  videoUrl,
  image
}`);
