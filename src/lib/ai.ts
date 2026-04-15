import { createVertex } from "@ai-sdk/google-vertex";

export const vertex = createVertex({
  project: process.env.GOOGLE_VERTEX_PROJECT,
  location: process.env.GOOGLE_VERTEX_LOCATION,
  googleAuthOptions: {
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
    },
  },
});

export const DEFAULT_MODEL = "gemini-3.1-pro-preview";
export const LIGHT_MODEL = "gemini-3.1-flash-lite-preview";
