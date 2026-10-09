import { describe, test, expect } from "vitest";
import prisma from "../../../src/lib/prisma.js";

describe("Database connection", () => {

    test("should connect to the test database", async () => {

        const result = await prisma.$queryRaw<
            { database_name: string }[]
        >`SELECT current_database() AS database_name`;

        expect(result[0]?.database_name).toBe("it_service_desk_test");

    });

});