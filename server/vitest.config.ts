import { defineConfig } from "vitest/config";
import { config } from "dotenv";

export default defineConfig(() => {
    config({
        path: ".env.test",
        override: false,
    });

    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        throw new Error("Test DATABASE_URL is missing");
    }

    const databaseName = new URL(databaseUrl).pathname.slice(1);

    if (databaseName !== "it_service_desk_test") {
        throw new Error(
            `Tests cannot use database: ${databaseName}`
        );
    }

    process.env.NODE_ENV = "test";

    return {
        test: {
            environment: "node",
            fileParallelism: false,

            coverage: {
                provider: "v8" as const,

                include: [
                    "src/**/*.ts",
                ],

                exclude: [
                    "src/**/*.d.ts",
                    "src/routers/**",
                    "src/schemas/**",
                    "src/lib/prisma.ts",
                ],

                reporter: [
                    "text",
                    "html",
                ],
            },
        },
    };
});