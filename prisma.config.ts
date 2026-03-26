import { defineConfig } from "prisma/config";

// Load .env only in local development (not in Netlify/CI where env vars are injected)
if (process.env.NODE_ENV !== "production" && !process.env.NETLIFY) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("dotenv").config();
  } catch {}
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
