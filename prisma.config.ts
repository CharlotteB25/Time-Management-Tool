import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts", // new update from prisma 7, before only in package.json
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
