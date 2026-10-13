import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    CLERK_SECRET_KEY: v.string(),
    SITE_URL: v.string(),
  },
});

export default app;
