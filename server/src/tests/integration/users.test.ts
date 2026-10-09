import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { describe, test, expect, afterEach } from "vitest";

import app from "../../../src/app.js";
import prisma from "../../../src/lib/prisma.js";

describe("Users API", () => {

    const createdUserIds: string[] = [];

    afterEach(async () => {
        for (const id of createdUserIds) {
            await prisma.user.delete({
                where: { id },
            });
        }

        createdUserIds.length = 0;
    });

    test("POST /api/users should create a user", async () => {

        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const userData = {
            name: "Test User",
            email: `test-${crypto.randomUUID()}@example.com`,
            password: "TestPassword123!",
            role: "USER",
        };

        const response = await request(app)
            .post("/api/users")
            .set("Authorization", `Bearer ${token}`)
            .send(userData);

        expect(response.status).toBe(201);

        expect(response.body.name).toBe(userData.name);
        expect(response.body.email).toBe(userData.email);
        expect(response.body.role).toBe("USER");

        expect(response.body).not.toHaveProperty("password");

        const userId = response.body.id;

        createdUserIds.push(userId);

        const savedUser = await prisma.user.findUnique({
            where: { id: userId },
        });

        expect(savedUser).not.toBeNull();

        expect(savedUser?.password).not.toBe(userData.password);

        const passwordMatches = await bcrypt.compare(
            userData.password,
            savedUser!.password
        );

        expect(passwordMatches).toBe(true);

    });

    test("POST /api/users should reject duplicate email", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const userData = {
            name: "Duplicate Test User",
            email: `duplicate-${crypto.randomUUID()}@example.com`,
            password: "TestPassword123!",
            role: "USER",
        };

        // Esimene päring loob kasutaja
        const firstResponse = await request(app)
            .post("/api/users")
            .set("Authorization", `Bearer ${token}`)
            .send(userData);

        expect(firstResponse.status).toBe(201);

        createdUserIds.push(firstResponse.body.id);

        // Teine päring proovib luua sama e-postiga kasutajat
        const secondResponse = await request(app)
            .post("/api/users")
            .set("Authorization", `Bearer ${token}`)
            .send(userData);

        expect(secondResponse.status).toBe(409);

        expect(secondResponse.body.message).toBe(
            "User with this email already exists"
        );
    });

    test("POST /api/users should reject invalid user data", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .post("/api/users")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "",
                email: "invalid-email",
                password: "123",
                role: "USER",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe("Invalid user data");

        expect(response.body.errors).toBeInstanceOf(Array);

        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("POST /api/users should reject USER role", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "USER",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .post("/api/users")
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Unauthorized User",
                email: `unauthorized-${crypto.randomUUID()}@example.com`,
                password: "TestPassword123!",
                role: "ADMIN",
            });

        expect(response.status).toBe(403);
    });

    test("PATCH /api/users/:id should reject USER role", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "USER",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .patch("/api/users/123e4567-e89b-42d3-a456-426614174001")
            .set("Authorization", `Bearer ${token}`)
            .send({
                role: "ADMIN",
            });

        expect(response.status).toBe(403);
    });

    test("DELETE /api/users/:id should reject USER role", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "USER",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .delete("/api/users/123e4567-e89b-42d3-a456-426614174001")
            .set("Authorization", `Bearer ${token}`);

        expect(response.status).toBe(403);
    });

    test("GET /api/users should return users for ADMIN without passwords", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [admin.id];

        try {
            // 2. Loome tavalise kasutaja
            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(user.id);

            // 3. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN küsib kasutajate nimekirja
            const response = await request(app)
                .get("/api/users")
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // 6. Vastus peab olema massiiv
            expect(Array.isArray(response.body)).toBe(true);

            // 7. Otsime testis loodud kasutaja
            const returnedUser = response.body.find(
                (item: { id: string }) => item.id === user.id
            );

            expect(returnedUser).toBeDefined();

            // 8. Kontrollime kasutaja andmeid
            expect(returnedUser.name).toBe("Test User");
            expect(returnedUser.email).toBe(user.email);
            expect(returnedUser.role).toBe("USER");

            // 9. Kontrollime, et parooliräsi ei tagastata
            expect(returnedUser.password).toBeUndefined();

            // 10. Kontrollime ka administraatori andmeid
            const returnedAdmin = response.body.find(
                (item: { id: string }) => item.id === admin.id
            );

            // expect(returnedAdmin).toBeDefined();
            // expect(returnedAdmin.password).toBeUndefined();

            expect(returnedUser).not.toHaveProperty("password");
            expect(returnedAdmin).not.toHaveProperty("password");

        } finally {

            // 11. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("GET /api/users/:id should return user for ADMIN", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [admin.id];

        try {
            // 2. Loome kasutaja, kelle andmeid hakkame küsima
            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(user.id);

            // 3. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN küsib konkreetse kasutaja andmeid
            const response = await request(app)
                .get(`/api/users/${user.id}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // 6. Kontrollime kasutaja andmeid
            expect(response.body.id).toBe(user.id);
            expect(response.body.name).toBe("Test User");
            expect(response.body.email).toBe(user.email);
            expect(response.body.role).toBe("USER");

            // 7. Kontrollime kuupäevaväljade olemasolu
            expect(response.body.createdAt).toBeDefined();
            expect(response.body.updatedAt).toBeDefined();

            // 8. Kontrollime, et parooliräsi ei tagastata
            expect(response.body).not.toHaveProperty("password");

        } finally {

            // 9. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("GET /api/users/:id should return 404 when user does not exist", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        try {
            // 2. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 3. Genereerime UUID, millega kasutajat ei eksisteeri
            const nonExistingUserId = crypto.randomUUID();

            // 4. ADMIN küsib olematu kasutaja andmeid
            const response = await request(app)
                .get(`/api/users/${nonExistingUserId}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(404);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe("User not found");

        } finally {

            // 7. Kustutame administraatori
            await prisma.user.delete({
                where: {
                    id: admin.id,
                },
            });
        }
    });

    test("GET /api/users/:id should return 400 for invalid UUID", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        try {
            // 2. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 3. Kasutame vigast UUID-d
            const invalidUserId = "123";

            // 4. Saadame päringu
            const response = await request(app)
                .get(`/api/users/${invalidUserId}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(400);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe("Invalid user ID");

            // 7. Kontrollime Zodi valideerimisvigade olemasolu
            expect(Array.isArray(response.body.errors)).toBe(true);
            expect(response.body.errors.length).toBeGreaterThan(0);

        } finally {

            // 8. Kustutame testkasutaja
            await prisma.user.delete({
                where: {
                    id: admin.id,
                },
            });
        }
    });

    test("PATCH /api/users/:id should allow ADMIN to update user", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [admin.id];

        try {
            // 2. Loome kasutaja, kelle andmeid muudame
            const user = await prisma.user.create({
                data: {
                    name: "Original User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(user.id);

            // 3. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN muudab kasutaja nime
            const response = await request(app)
                .patch(`/api/users/${user.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Updated User Name",
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // 6. Kontrollime API vastust
            expect(response.body.id).toBe(user.id);
            expect(response.body.name).toBe("Updated User Name");

            // E-posti aadress ei tohi muutuda
            expect(response.body.email).toBe(user.email);

            // Parooliräsi ei tohi vastuses olla
            expect(response.body).not.toHaveProperty("password");

            // 7. Kontrollime PostgreSQL-i salvestatud andmeid
            const updatedUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });

            expect(updatedUser).not.toBeNull();

            expect(updatedUser?.name).toBe("Updated User Name");

            // Kontrollime, et muud väljad jäid muutmata
            expect(updatedUser?.email).toBe(user.email);
            expect(updatedUser?.role).toBe("USER");

        } finally {

            // 8. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/users/:id should hash updated password", async () => {

        const oldPassword = "OldPassword123!";
        const newPassword = "NewPassword456!";

        const passwordHash = await bcrypt.hash(oldPassword, 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [admin.id];

        try {
            // 2. Loome kasutaja vana parooliga
            const user = await prisma.user.create({
                data: {
                    name: "Test User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(user.id);

            // 3. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN muudab kasutaja parooli
            const response = await request(app)
                .patch(`/api/users/${user.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    password: newPassword,
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // Parool ei tohi API vastusesse sattuda
            expect(response.body).not.toHaveProperty("password");

            // 6. Loeme kasutaja andmebaasist
            const updatedUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });

            expect(updatedUser).not.toBeNull();

            // 7. Parool ei tohi olla salvestatud lihttekstina
            expect(updatedUser?.password).not.toBe(newPassword);

            // 8. Uus parool peab vastama salvestatud räsile
            const newPasswordMatches = await bcrypt.compare(
                newPassword,
                updatedUser!.password
            );

            expect(newPasswordMatches).toBe(true);

            // 9. Vana parool ei tohi enam sobida
            const oldPasswordMatches = await bcrypt.compare(
                oldPassword,
                updatedUser!.password
            );

            expect(oldPasswordMatches).toBe(false);

        } finally {

            // 10. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/users/:id should return 400 for empty body", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [admin.id];

        try {
            // 2. Loome kasutaja, kelle andmeid proovime muuta
            const user = await prisma.user.create({
                data: {
                    name: "Original User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(user.id);

            // 3. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Saadame tühja PATCH-päringu
            const response = await request(app)
                .patch(`/api/users/${user.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({});

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(400);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe(
                "No fields provided for update"
            );

            // 7. Kontrollime, et kasutaja andmed ei muutunud
            const unchangedUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });

            expect(unchangedUser?.name).toBe("Original User");
            expect(unchangedUser?.email).toBe(user.email);

        } finally {

            // 8. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/users/:id should return 404 when user does not exist", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        try {
            // 2. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 3. Genereerime UUID, mida andmebaasis ei eksisteeri
            const nonExistingUserId = crypto.randomUUID();

            // 4. Proovime muuta olematu kasutaja nime
            const response = await request(app)
                .patch(`/api/users/${nonExistingUserId}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    name: "Updated User Name",
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(404);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe("User not found");

        } finally {

            // 7. Kustutame administraatori
            await prisma.user.delete({
                where: {
                    id: admin.id,
                },
            });
        }
    });

    test("PATCH /api/users/:id should return 400 for invalid UUID", async () => {

        // 1. Genereerime ADMIN tokeni
        const token = jwt.sign(
            {
                userId: crypto.randomUUID(),
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        // 2. Kasutame vigast UUID-d
        const invalidUserId = "123";

        // 3. Saadame PATCH-päringu
        const response = await request(app)
            .patch(`/api/users/${invalidUserId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: "Updated User Name",
            });

        // 4. Kontrollime HTTP staatust
        expect(response.status).toBe(400);

        // 5. Kontrollime veateadet
        expect(response.body.message).toBe("Invalid user ID");

        // 6. Kontrollime Zodi valideerimisvigu
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("PATCH /api/users/:id should return 400 for invalid user data", async () => {

        // 1. Genereerime ADMIN tokeni
        const token = jwt.sign(
            {
                userId: crypto.randomUUID(),
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        // 2. Kasutame korrektset UUID-d
        const userId = crypto.randomUUID();

        // 3. Saadame vigased kasutajaandmed
        const response = await request(app)
            .patch(`/api/users/${userId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                name: 12345,
            });

        // 4. Kontrollime HTTP staatust
        expect(response.status).toBe(400);

        // 5. Kontrollime veateadet
        expect(response.body.message).toBe("Invalid user data");

        // 6. Kontrollime Zodi valideerimisvigu
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("DELETE /api/users/:id should allow ADMIN to delete user", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome administraatori
        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        let userId: string | undefined;

        try {
            // 2. Loome kasutaja, kelle kustutamist testime
            const user = await prisma.user.create({
                data: {
                    name: "User To Delete",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            userId = user.id;

            // 3. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN kustutab kasutaja
            const response = await request(app)
                .delete(`/api/users/${user.id}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(204);

            // 6. Kontrollime, et vastuse sisu on tühi
            expect(response.text).toBe("");

            // 7. Kontrollime, et kasutaja on PostgreSQL-ist kustutatud
            const deletedUser = await prisma.user.findUnique({
                where: {
                    id: user.id,
                },
            });

            expect(deletedUser).toBeNull();

        } finally {

            // 8. Koristame testandmed
            // deleteMany ei tekita viga, kui kasutaja on juba kustutatud
            if (userId) {
                await prisma.user.deleteMany({
                    where: {
                        id: userId,
                    },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: admin.id,
                },
            });
        }
    });

    test("DELETE /api/users/:id should return 404 when user does not exist", async () => {

        // 1. Genereerime ADMIN tokeni
        const token = jwt.sign(
            {
                userId: crypto.randomUUID(),
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        // 2. Genereerime korrektse UUID
        const nonExistingUserId = crypto.randomUUID();

        // 3. Proovime kustutada olematut kasutajat
        const response = await request(app)
            .delete(`/api/users/${nonExistingUserId}`)
            .set("Authorization", `Bearer ${token}`);

        // 4. Kontrollime HTTP staatust
        expect(response.status).toBe(404);

        // 5. Kontrollime veateadet
        expect(response.body.message).toBe("User not found");
    });

    test("DELETE /api/users/:id should return 400 for invalid UUID", async () => {

        // 1. Genereerime ADMIN tokeni
        const token = jwt.sign(
            {
                userId: crypto.randomUUID(),
                role: "ADMIN",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        // 2. Kasutame vigast UUID-d
        const invalidUserId = "123";

        // 3. Saadame DELETE-päringu
        const response = await request(app)
            .delete(`/api/users/${invalidUserId}`)
            .set("Authorization", `Bearer ${token}`);

        // 4. Kontrollime HTTP staatust
        expect(response.status).toBe(400);

        // 5. Kontrollime veateadet
        expect(response.body.message).toBe("Invalid user ID");

        // 6. Kontrollime Zodi valideerimisvigu
        expect(Array.isArray(response.body.errors)).toBe(true);
        expect(response.body.errors.length).toBeGreaterThan(0);
    });

});