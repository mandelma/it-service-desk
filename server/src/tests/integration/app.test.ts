import request from "supertest";
import { describe, test, expect } from "vitest";
import app from "../../app.js";

describe("Express API", () => {

    test("GET / should return 200 and API message", async () => {

        const response = await request(app).get("/");

        expect(response.status).toBe(200);

        expect(response.body).toEqual({
            message: "IT Service Desk API is running"
        });

    });

});