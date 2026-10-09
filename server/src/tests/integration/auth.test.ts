import request from "supertest";
import { describe, test, expect } from "vitest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import prisma from "../../../src/lib/prisma.js";
import app from "../../../src/app.js";

describe("Authentication API", () => {

    test("POST /api/auth/login should reject empty credentials", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({});

        expect(response.status).toBe(400);

    });

    test("POST /api/auth/login should reject invalid email", async () => {

        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email: "vale-email",
                password: "password123"
            });

        expect(response.status).toBe(400);

    });

    test("GET /api/users should reject requests without token", async () => {

        const response = await request(app)
            .get("/api/users");

        expect(response.status).toBe(401);

    });

    test("GET /api/users should reject invalid token", async () => {

        const response = await request(app)
            .get("/api/users")
            .set("Authorization", "Bearer invalid-token");

        expect(response.status).toBe(401);

    });

    test("GET /api/users should reject USER role with 403", async () => {

        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "USER"
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .get("/api/users")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(403);

    });

    test("POST /api/auth/login should login user with valid credentials", async () => {

        const password = "TestPassword123!";
        const email = `login-${crypto.randomUUID()}@example.com`;

        // 1. Krüpteerimise asemel räsime parooli
        const passwordHash = await bcrypt.hash(password, 12);

        // 2. Loome testkasutaja
        const user = await prisma.user.create({
            data: {
                name: "Login Test User",
                email,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // 3. Saadame sisselogimispäringu
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password,
                });

            // 4. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // 5. Kontrollime tagastatud kasutaja andmeid
            expect(response.body.user.id).toBe(user.id);
            expect(response.body.user.email).toBe(email);
            expect(response.body.user.role).toBe("USER");

            // 6. Kontrollime JWT tokeni olemasolu
            expect(response.body.token).toBeDefined();
            expect(typeof response.body.token).toBe("string");

            // 7. Kontrollime JWT tokeni sisu
            const decoded = jwt.verify(
                response.body.token,
                process.env.JWT_SECRET!
            );

            expect(decoded).toMatchObject({
                userId: user.id,
                role: "USER",
            });

            // 8. Kontrollime, et parooliräsi ei saadeta kliendile
            expect(response.body.user.password).toBeUndefined();

        } finally {

            // 9. Kustutame testkasutaja
            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("POST /api/auth/login should reject incorrect password", async () => {

        const password = "CorrectPassword123!";
        const email = `login-${crypto.randomUUID()}@example.com`;

        // 1. Loome parooliräsi
        const passwordHash = await bcrypt.hash(password, 12);

        // 2. Loome testkasutaja
        const user = await prisma.user.create({
            data: {
                name: "Login Test User",
                email,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // 3. Proovime sisse logida vale parooliga
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password: "WrongPassword123!",
                });

            // 4. Kontrollime, et sisselogimine keelati
            expect(response.status).toBe(401);

            // 5. Kontrollime, et JWT tokenit ei tagastatud
            expect(response.body.token).toBeUndefined();

        } finally {

            // 6. Kustutame testkasutaja
            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("POST /api/auth/login should reject non-existing user", async () => {

        // Genereerime juhusliku e-posti aadressi
        const email = `nonexisting-${crypto.randomUUID()}@example.com`;

        // Proovime sisse logida
        const response = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password: "TestPassword123!",
            });

        // Server peab sisselogimise keelama
        expect(response.status).toBe(401);

        // JWT tokenit ei tohi tagastada
        expect(response.body.token).toBeUndefined();
    });

});