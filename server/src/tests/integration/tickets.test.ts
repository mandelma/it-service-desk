import request from "supertest";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import { describe, test, expect } from "vitest";

import app from "../../../src/app.js";
import prisma from "../../../src/lib/prisma.js";

describe("Tickets API", () => {

    test("POST /api/tickets should create a ticket", async () => {

        // 1. Loome testkasutaja
        const passwordHash = await bcrypt.hash(
            "TestPassword123!",
            12
        );

        const user = await prisma.user.create({
            data: {
                name: "Ticket Test User",
                email: `ticket-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {

            // 2. Genereerime testkasutajale JWT tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: user.role,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 3. Saadame tööpileti loomise päringu
            const ticketData = {
                title: "Computer not working",
                description: "The computer does not start.",
                priority: "HIGH",
            };

            const response = await request(app)
                .post("/api/tickets")
                .set("Authorization", `Bearer ${token}`)
                .send(ticketData);

            // 4. Kontrollime API vastust
            expect(response.status).toBe(201);

            expect(response.body.title).toBe(ticketData.title);

            expect(response.body.description).toBe(
                ticketData.description
            );

            expect(response.body.priority).toBe("HIGH");

            expect(response.body.createdById).toBe(user.id);

            // 5. Kontrollime andmebaasi
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: response.body.id,
                },
            });

            expect(savedTicket).not.toBeNull();

            expect(savedTicket?.title).toBe(ticketData.title);

            expect(savedTicket?.createdById).toBe(user.id);

        } finally {

            // 6. Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });

        }

    });

    test("POST /api/tickets should reject invalid ticket data", async () => {
        const token = jwt.sign(
            {
                userId: "123e4567-e89b-42d3-a456-426614174000",
                role: "USER",
            },
            process.env.JWT_SECRET!,
            { expiresIn: "1h" }
        );

        const response = await request(app)
            .post("/api/tickets")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "",
                description: "",
                priority: "INVALID_PRIORITY",
            });

        expect(response.status).toBe(400);

        expect(response.body.message).toBe("Invalid ticket data");

        expect(response.body.errors).toBeInstanceOf(Array);

        expect(response.body.errors.length).toBeGreaterThan(0);
    });

    test("GET /api/tickets should return only user's own tickets", async () => {

        // 1. Loome kaks testkasutajat
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const user1 = await prisma.user.create({
            data: {
                name: "Test User One",
                email: `user1-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let user2: typeof user1 | undefined;

        try {
            user2 = await prisma.user.create({
                data: {
                    name: "Test User Two",
                    email: `user2-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            // 2. Loome kummalegi kasutajale ühe tööpileti
            const ticket1 = await prisma.ticket.create({
                data: {
                    title: "User One Ticket",
                    description: "First user's ticket",
                    priority: "HIGH",
                    createdById: user1.id,
                },
            });

            const ticket2 = await prisma.ticket.create({
                data: {
                    title: "User Two Ticket",
                    description: "Second user's ticket",
                    priority: "LOW",
                    createdById: user2.id,
                },
            });

            // 3. Loome esimese kasutaja JWT tokeni
            const token = jwt.sign(
                {
                    userId: user1.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Teeme GET päringu esimese kasutajana
            const response = await request(app)
                .get("/api/tickets")
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);

            expect(Array.isArray(response.body)).toBe(true);

            // 5. Kontrollime, et kasutaja näeb enda tööpiletit
            const ticketIds = response.body.map(
                (ticket: { id: string }) => ticket.id
            );

            expect(ticketIds).toContain(ticket1.id);

            // 6. Kontrollime, et teise kasutaja tööpiletit ei näidata
            expect(ticketIds).not.toContain(ticket2.id);

            // 7. Kontrollime, et kõik tagastatud tööpiletid
            // kuuluvad esimesele kasutajale
            for (const ticket of response.body) {
                expect(ticket.createdById).toBe(user1.id);
            }

        } finally {

            // 8. Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: {
                        in: [user1.id, ...(user2 ? [user2.id] : [])],
                    },
                },
            });

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: [user1.id, ...(user2 ? [user2.id] : [])],
                    },
                },
            });
        }
    });

    test("GET /api/tickets/:id should reject access to another user's ticket", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome esimese kasutaja
        const user1 = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let user2: typeof user1 | undefined;

        try {
            // Loome teise kasutaja
            user2 = await prisma.user.create({
                data: {
                    name: "Another User",
                    email: `another-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            // Loome tööpileti, mis kuulub esimesele kasutajale
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Private Ticket",
                    description: "Only the owner should see this ticket",
                    priority: "HIGH",
                    createdById: user1.id,
                },
            });

            // Genereerime TEISE kasutaja JWT tokeni
            const token = jwt.sign(
                {
                    userId: user2.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Teine kasutaja proovib avada esimese kasutaja tööpiletit
            const response = await request(app)
                .get(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`);

            // Ligipääs peab olema keelatud
            expect(response.status).toBe(404);

            expect(response.body.message).toBe("Ticket not found");

        } finally {

            // Kustutame testkasutajate tööpiletid
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user1.id,
                },
            });

            // Koostame kasutajate ID-de massiivi
            const userIds = [user1.id];

            if (user2) {
                userIds.push(user2.id);
            }

            // Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("GET /api/tickets/:id should return owner's ticket", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // Loome kasutajale tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Computer problem",
                    description: "Computer does not start",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // Genereerime tööpileti omaniku tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Kasutaja pärib enda tööpileti
            const response = await request(app)
                .get(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.status).toBe(200);

            expect(response.body.id).toBe(ticket.id);
            expect(response.body.title).toBe(ticket.title);
            expect(response.body.createdById).toBe(user.id);

            // Kontrollime ka seotud kasutaja andmeid
            expect(response.body.createdBy.id).toBe(user.id);
            expect(response.body.createdBy.name).toBe(user.name);

        } finally {
            // Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should update owner's ticket", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome testkasutaja
        const user = await prisma.user.create({
            data: {
                name: "Ticket Update User",
                email: `update-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // 2. Loome tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Old title",
                    description: "Old description",
                    priority: "LOW",
                    createdById: user.id,
                },
            });

            // 3. Genereerime kasutaja JWT tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Saadame PATCH päringu
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Updated title",
                    description: "Updated description",
                });

            // 5. Kontrollime API vastust
            expect(response.status).toBe(200);

            expect(response.body.title).toBe("Updated title");
            expect(response.body.description).toBe("Updated description");

            // Prioriteet ei tohi muutuda
            expect(response.body.priority).toBe("LOW");

            // 6. Kontrollime salvestatud andmeid
            const updatedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(updatedTicket).not.toBeNull();

            expect(updatedTicket?.title).toBe("Updated title");
            expect(updatedTicket?.description).toBe("Updated description");
            expect(updatedTicket?.priority).toBe("LOW");

        } finally {

            // 7. Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should reject another user's ticket", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tööpileti omaniku
        const user1 = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let user2: typeof user1 | undefined;

        try {
            // Loome teise kasutaja
            user2 = await prisma.user.create({
                data: {
                    name: "Another User",
                    email: `another-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            // Tööpileti omanik on user1
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Original title",
                    description: "Original description",
                    priority: "LOW",
                    createdById: user1.id,
                },
            });

            // Genereerime tokeni kasutajale user2
            const token = jwt.sign(
                {
                    userId: user2.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // user2 proovib muuta user1 tööpiletit
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Unauthorized change",
                });

            // Server peab ligipääsu keelama
            expect(response.status).toBe(404);
            expect(response.body.message).toBe("Ticket not found");

            // Kontrollime, et andmebaasis pole midagi muutunud
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.title).toBe("Original title");

        } finally {
            // Kustutame testandmed
            const userIds = [user1.id];

            if (user2) {
                userIds.push(user2.id);
            }

            await prisma.ticket.deleteMany({
                where: {
                    createdById: {
                        in: userIds,
                    },
                },
            });

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should prevent USER from changing status", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome testkasutaja
        const user = await prisma.user.create({
            data: {
                name: "Status Test User",
                email: `status-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // Loome kasutajale tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Status Test Ticket",
                    description: "Testing status permissions",
                    priority: "MEDIUM",
                    createdById: user.id,
                },
            });

            // Genereerime JWT tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // USER proovib muuta enda tööpileti staatust
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    status: "RESOLVED",
                });

            // Muutmine peab olema keelatud
            expect(response.status).toBe(403);

            expect(response.body.message).toBe(
                "You are not allowed to update status or assignment"
            );

            // Kontrollime, et staatus ei muutunud andmebaasis
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.status).toBe(ticket.status);

        } finally {
            // Kustutame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should allow TECHNICIAN to update status", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tööpileti omaniku
        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let technician: typeof user | undefined;

        try {
            // Loome tehniku
            technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `technician-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            // Loome tehnikule määratud tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Computer problem",
                    description: "Computer does not start",
                    priority: "HIGH",
                    createdById: user.id,
                    assignedToId: technician.id,
                },
            });

            // Genereerime tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Tehnik muudab tööpileti staatust
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    status: "IN_PROGRESS",
                });

            // Kontrollime API vastust
            expect(response.status).toBe(200);
            expect(response.body.status).toBe("IN_PROGRESS");

            // Kontrollime muudatust andmebaasis
            const updatedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(updatedTicket?.status).toBe("IN_PROGRESS");

            // Muud väljad peavad jääma muutmata
            expect(updatedTicket?.title).toBe(ticket.title);
            expect(updatedTicket?.priority).toBe(ticket.priority);

        } finally {
            // Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            const userIds = [user.id];

            if (technician) {
                userIds.push(technician.id);
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should prevent TECHNICIAN from updating title", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tööpileti omaniku
        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let technician: typeof user | undefined;

        try {
            // Loome tehniku
            technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `technician-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            // Loome tehnikule määratud tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Original title",
                    description: "Original description",
                    priority: "HIGH",
                    createdById: user.id,
                    assignedToId: technician.id,
                },
            });

            // Genereerime tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Tehnik proovib muuta tööpileti pealkirja
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Unauthorized title change",
                });

            // Server peab muutmise keelama
            expect(response.status).toBe(403);

            expect(response.body.message).toBe(
                "Technicians can only update ticket status"
            );

            // Kontrollime, et pealkiri jäi andmebaasis muutmata
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.title).toBe("Original title");

        } finally {

            // Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            const userIds = [user.id];

            if (technician) {
                userIds.push(technician.id);
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should reject unassigned TECHNICIAN", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tööpileti omaniku
        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let technician: typeof user | undefined;

        try {
            // Loome tehniku
            technician = await prisma.user.create({
                data: {
                    name: "Unassigned Technician",
                    email: `technician-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            // Loome tööpileti, mida pole tehnikule määratud
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Unassigned Ticket",
                    description: "Ticket without an assigned technician",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // Kontrollime, et tööpiletil pole määratud tehnikut
            expect(ticket.assignedToId).toBeNull();

            // Genereerime tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Tehnik proovib muuta määramata tööpileti staatust
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    status: "IN_PROGRESS",
                });

            // Server peab muutmise keelama
            expect(response.status).toBe(403);

            expect(response.body.message).toBe(
                "You can only update tickets assigned to you"
            );

            // Kontrollime, et staatus jäi andmebaasis muutmata
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.status).toBe(ticket.status);

        } finally {

            // Eemaldame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            const userIds = [user.id];

            if (technician) {
                userIds.push(technician.id);
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should assign ticket to technician", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome tööpileti omaniku
        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let technician: typeof user | undefined;

        try {
            // 2. Loome tehniku
            technician = await prisma.user.create({
                data: {
                    name: "Assign Test Technician",
                    email: `technician-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            // 3. Loome tööpileti ilma määratud tehnikuta
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Printer not working",
                    description: "Office printer is not responding",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // Kontrollime algset olukorda
            expect(ticket.assignedToId).toBeNull();

            // 4. Genereerime tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. Tehnik määrab tööpileti endale
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`);

            // 6. Kontrollime API vastust
            expect(response.status).toBe(200);

            expect(response.body.assignedToId).toBe(technician.id);

            expect(response.body.status).toBe("IN_PROGRESS");

            // Kontrollime seotud tehniku andmeid
            expect(response.body.assignedTo.id).toBe(technician.id);
            expect(response.body.assignedTo.role).toBe("TECHNICIAN");

            // 7. Kontrollime PostgreSQL-i salvestatud andmeid
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket).not.toBeNull();

            expect(savedTicket?.assignedToId).toBe(technician.id);

            expect(savedTicket?.status).toBe("IN_PROGRESS");

        } finally {

            // 8. Kustutame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            const userIds = [user.id];

            if (technician) {
                userIds.push(technician.id);
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should reject another technician", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tööpileti omaniku
        const owner = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        const createdUserIds = [owner.id];

        try {
            // Loome esimese tehniku
            const technician1 = await prisma.user.create({
                data: {
                    name: "Technician One",
                    email: `tech1-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician1.id);

            // Loome teise tehniku
            const technician2 = await prisma.user.create({
                data: {
                    name: "Technician Two",
                    email: `tech2-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician2.id);

            // Loome esimesele tehnikule määratud tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Network problem",
                    description: "Office network is not working",
                    priority: "HIGH",
                    createdById: owner.id,
                    assignedToId: technician1.id,
                },
            });

            // Genereerime TEISE tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician2.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Teine tehnik proovib tööpiletit endale määrata
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`);

            // Server peab tagastama konflikti
            expect(response.status).toBe(409);

            expect(response.body.message).toBe(
                "Ticket is already assigned to another technician"
            );

            // Kontrollime, et tööpilet kuulub endiselt esimesele tehnikule
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.assignedToId).toBe(technician1.id);
            expect(savedTicket?.status).toBe(ticket.status);

        } finally {

            // Kustutame testis loodud tööpiletid
            await prisma.ticket.deleteMany({
                where: {
                    createdById: owner.id,
                },
            });

            // Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should reject USER role", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // Loome tavalise kasutaja
        const user = await prisma.user.create({
            data: {
                name: "Test User",
                email: `user-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // Loome kasutajale tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Computer problem",
                    description: "Computer is not working",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // Genereerime USER rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // USER proovib tööpiletit endale määrata
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`);

            // Kontrollime, et server keeldub
            expect(response.status).toBe(403);

            // Kontrollime, et andmebaasis midagi ei muutunud
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket?.assignedToId).toBeNull();

            expect(savedTicket?.status).toBe(ticket.status);

        } finally {

            // Kustutame testis loodud tööpiletid
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            // Kustutame testkasutaja
            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("DELETE /api/tickets/:id should allow ADMIN to delete ticket", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome tööpileti omaniku
        const user = await prisma.user.create({
            data: {
                name: "Ticket Owner",
                email: `owner-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        let admin: typeof user | undefined;

        try {
            // 2. Loome administraatori
            admin = await prisma.user.create({
                data: {
                    name: "Test Admin",
                    email: `admin-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "ADMIN",
                },
            });

            // 3. Loome tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Ticket to delete",
                    description: "This ticket should be deleted",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // 4. Genereerime ADMIN rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. ADMIN saadab DELETE päringu
            const response = await request(app)
                .delete(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`);

            // 6. Kontrollime HTTP vastust
            expect(response.status).toBe(204);

            // 204 vastusel ei tohi olla response body't
            expect(response.text).toBe("");

            // 7. Kontrollime, et tööpilet on andmebaasist kustutatud
            const deletedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(deletedTicket).toBeNull();

        } finally {

            // 8. Eemaldame võimalikud allesjäänud tööpiletid
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            // 9. Eemaldame testkasutajad
            const userIds = [user.id];

            if (admin) {
                userIds.push(admin.id);
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: userIds,
                    },
                },
            });
        }
    });

    test("DELETE /api/tickets/:id should reject USER role", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome tavalise kasutaja
        const user = await prisma.user.create({
            data: {
                name: "Test User",
                email: `user-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        try {
            // 2. Loome kasutajale tööpileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Protected ticket",
                    description: "This ticket must not be deleted",
                    priority: "HIGH",
                    createdById: user.id,
                },
            });

            // 3. Genereerime USER rolliga JWT tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. USER proovib oma tööpiletit kustutada
            const response = await request(app)
                .delete(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Server peab kustutamise keelama
            expect(response.status).toBe(403);

            // 6. Kontrollime, et tööpilet on endiselt andmebaasis
            const savedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(savedTicket).not.toBeNull();
            expect(savedTicket?.id).toBe(ticket.id);
            expect(savedTicket?.title).toBe("Protected ticket");

        } finally {

            // 7. Kustutame testandmed
            await prisma.ticket.deleteMany({
                where: {
                    createdById: user.id,
                },
            });

            await prisma.user.delete({
                where: {
                    id: user.id,
                },
            });
        }
    });

    test("DELETE /api/tickets/:id should return 404 when ticket does not exist", async () => {

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

            // 3. Genereerime juhusliku UUID
            const nonExistingTicketId = crypto.randomUUID();

            // 4. ADMIN proovib kustutada olematut tööpiletit
            const response = await request(app)
                .delete(`/api/tickets/${nonExistingTicketId}`)
                .set("Authorization", `Bearer ${token}`);

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(404);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe("Ticket not found");

        } finally {

            // 7. Kustutame testkasutaja
            await prisma.user.delete({
                where: {
                    id: admin.id,
                },
            });
        }
    });

    test("POST /api/tickets should reject assignment to USER", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome pileti esitaja
        const creator = await prisma.user.create({
            data: {
                name: "Ticket Creator",
                email: `creator-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const createdUserIds = [creator.id];

        try {
            // 2. Loome teise tavakasutaja
            const assignedUser = await prisma.user.create({
                data: {
                    name: "Regular User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(assignedUser.id);

            // 3. Genereerime pileti esitaja JWT tokeni
            const token = jwt.sign(
                {
                    userId: creator.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Proovime määrata pileti tavakasutajale
            const response = await request(app)
                .post("/api/tickets")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Printer not working",
                    description: "Office printer does not respond",
                    priority: "MEDIUM",
                    assignedToId: assignedUser.id,
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(400);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe(
                "Ticket can only be assigned to a technician or admin"
            );

            // 7. Kontrollime, et piletit ei loodud
            const tickets = await prisma.ticket.findMany({
                where: {
                    createdById: creator.id,
                },
            });

            expect(tickets).toHaveLength(0);

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

    test("POST /api/tickets should return 404 when assigned user does not exist", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome pileti esitaja
        const creator = await prisma.user.create({
            data: {
                name: "Ticket Creator",
                email: `creator-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        try {
            // 2. Genereerime JWT tokeni
            const token = jwt.sign(
                {
                    userId: creator.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 3. Genereerime UUID, millega kasutajat ei eksisteeri
            const nonExistingUserId = crypto.randomUUID();

            // 4. Proovime luua pileti olematule kasutajale
            const response = await request(app)
                .post("/api/tickets")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Printer not working",
                    description: "Office printer does not respond",
                    priority: "MEDIUM",
                    assignedToId: nonExistingUserId,
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(404);

            // 6. Kontrollime veateadet
            expect(response.body.message).toBe(
                "Assigned user not found"
            );

            // 7. Kontrollime, et piletit ei loodud
            const tickets = await prisma.ticket.findMany({
                where: {
                    createdById: creator.id,
                },
            });

            expect(tickets).toHaveLength(0);

        } finally {

            // 8. Kustutame testkasutaja
            await prisma.user.deleteMany({
                where: {
                    id: creator.id,
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should allow ADMIN to assign technician", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome kolm kasutajat
        const creator = await prisma.user.create({
            data: {
                name: "Ticket Creator",
                email: `creator-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        const admin = await prisma.user.create({
            data: {
                name: "Test Admin",
                email: `admin-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "ADMIN",
            },
        });

        const technician = await prisma.user.create({
            data: {
                name: "Test Technician",
                email: `technician-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "TECHNICIAN",
            },
        });

        let ticketId: string | undefined;

        try {
            // 2. Loome pileti ilma tehnikuta
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Printer not working",
                    description: "Office printer does not respond",
                    priority: "MEDIUM",
                    createdById: creator.id,
                },
            });

            ticketId = ticket.id;

            // 3. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. ADMIN määrab pileti tehnikule
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    assignedToId: technician.id,
                });

            // 5. Kontrollime HTTP staatust
            expect(response.status).toBe(200);

            // 6. Kontrollime API vastust
            expect(response.body.assignedToId).toBe(technician.id);

            expect(response.body.assignedTo).toMatchObject({
                id: technician.id,
                name: "Test Technician",
                role: "TECHNICIAN",
            });

            // 7. Kontrollime andmebaasi
            const updatedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(updatedTicket?.assignedToId).toBe(technician.id);

            // Teised väljad peavad jääma muutmata
            expect(updatedTicket?.title).toBe("Printer not working");
            expect(updatedTicket?.createdById).toBe(creator.id);

        } finally {

            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: {
                        id: ticketId,
                    },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: [creator.id, admin.id, technician.id],
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should reject assignment to USER", async () => {

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
        let ticketId: string | undefined;

        try {
            // 2. Loome tavakasutaja
            const regularUser = await prisma.user.create({
                data: {
                    name: "Regular User",
                    email: `user-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(regularUser.id);

            // 3. Loome pileti ilma määratud tehnikuta
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Computer not working",
                    description: "Computer does not start",
                    priority: "HIGH",
                    createdById: regularUser.id,
                },
            });

            ticketId = ticket.id;

            // 4. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. ADMIN proovib määrata pileti USER rolliga kasutajale
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    assignedToId: regularUser.id,
                });

            // 6. Kontrollime HTTP staatust
            expect(response.status).toBe(400);

            // 7. Kontrollime veateadet
            expect(response.body.message).toBe(
                "Ticket can only be assigned to a technician or admin"
            );

            // 8. Kontrollime, et pilet jäi muutmata
            const unchangedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(unchangedTicket).not.toBeNull();

            // Tehnikut ei tohi olla määratud
            expect(unchangedTicket?.assignedToId).toBeNull();

            // Muud andmed peavad jääma samaks
            expect(unchangedTicket?.title).toBe("Computer not working");
            expect(unchangedTicket?.priority).toBe("HIGH");

        } finally {

            // 9. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: {
                        id: ticketId,
                    },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should return 404 when assigned user does not exist", async () => {

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

        let ticketId: string | undefined;

        try {
            // 2. Loome pileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Network problem",
                    description: "Internet connection is unavailable",
                    priority: "HIGH",
                    createdById: admin.id,
                },
            });

            ticketId = ticket.id;

            // 3. Genereerime ADMIN tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Genereerime olematu kasutaja UUID
            const nonExistingUserId = crypto.randomUUID();

            // 5. Proovime määrata pileti olematule kasutajale
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    assignedToId: nonExistingUserId,
                });

            // 6. Kontrollime HTTP staatust
            expect(response.status).toBe(404);

            // 7. Kontrollime veateadet
            expect(response.body.message).toBe(
                "Assigned user not found"
            );

            // 8. Kontrollime andmebaasi
            const unchangedTicket = await prisma.ticket.findUnique({
                where: {
                    id: ticket.id,
                },
            });

            expect(unchangedTicket).not.toBeNull();

            // Piletile ei tohi olla tehnikut määratud
            expect(unchangedTicket?.assignedToId).toBeNull();

            // Pileti muud andmed peavad jääma samaks
            expect(unchangedTicket?.title).toBe("Network problem");
            expect(unchangedTicket?.priority).toBe("HIGH");

        } finally {

            // 9. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: {
                        id: ticketId,
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

    test("POST /api/tickets should prevent USER from assigning a technician", async () => {

        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        // 1. Loome tavakasutaja
        const user = await prisma.user.create({
            data: {
                name: "Test User",
                email: `user-${crypto.randomUUID()}@example.com`,
                password: passwordHash,
                role: "USER",
            },
        });

        const createdUserIds = [user.id];

        try {
            // 2. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `technician-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 3. Genereerime USER tokeni
            const token = jwt.sign(
                {
                    userId: user.id,
                    role: "USER",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 4. Tavakasutaja proovib määrata pileti tehnikule
            const response = await request(app)
                .post("/api/tickets")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    title: "Printer not working",
                    description: "Office printer does not respond",
                    priority: "MEDIUM",
                    assignedToId: technician.id,
                });

            // 5. Kontrollime vastust
            expect(response.status).toBe(403);

            expect(response.body.message).toBe(
                "Only admins can assign tickets during creation"
            );

            // 6. Kontrollime, et piletit ei loodud
            const ticket = await prisma.ticket.findFirst({
                where: {
                    createdById: user.id,
                    title: "Printer not working",
                },
            });

            expect(ticket).toBeNull();

        } finally {
            // 7. Kustutame testkasutajad
            await prisma.user.deleteMany({
                where: {
                    id: {
                        in: createdUserIds,
                    },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should prevent concurrent assignment", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // Loome kaks tehnikut
            const technicianA = await prisma.user.create({
                data: {
                    name: "Technician A",
                    email: `tech-a-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technicianA.id);

            const technicianB = await prisma.user.create({
                data: {
                    name: "Technician B",
                    email: `tech-b-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technicianB.id);

            // Loome pileti omaniku
            const owner = await prisma.user.create({
                data: {
                    name: "Ticket Owner",
                    email: `owner-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(owner.id);

            // Loome vaba pileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Network connection problem",
                    description: "Internet connection is unavailable",
                    priority: "HIGH",
                    createdById: owner.id,
                },
            });

            ticketId = ticket.id;

            // Loome tehnikutele JWT tokenid
            const tokenA = jwt.sign(
                { userId: technicianA.id, role: "TECHNICIAN" },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            const tokenB = jwt.sign(
                { userId: technicianB.id, role: "TECHNICIAN" },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // Mõlemad tehnikud proovivad korraga piletit võtta
            const [responseA, responseB] = await Promise.all([
                request(app)
                    .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                    .set("Authorization", `Bearer ${tokenA}`)
                    .send(),

                request(app)
                    .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                    .set("Authorization", `Bearer ${tokenB}`)
                    .send(),
            ]);

            // Üks päring peab õnnestuma, teine peab saama 409
            const statuses = [responseA.status, responseB.status].sort();

            expect(statuses).toEqual([200, 409]);

            // Leiame eduka päringu teinud tehniku
            const successfulTechnicianId =
                responseA.status === 200
                    ? technicianA.id
                    : technicianB.id;

            // Kontrollime andmebaasi lõplikku olekut
            const updatedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(updatedTicket).not.toBeNull();
            expect(updatedTicket?.assignedToId).toBe(successfulTechnicianId);
            expect(updatedTicket?.status).toBe("IN_PROGRESS");

        } finally {
            // Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

    
    test("PATCH /api/tickets/:id/assign-to-me should allow repeated assignment by same technician", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // 1. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `tech-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 2. Loome pileti omaniku
            const owner = await prisma.user.create({
                data: {
                    name: "Ticket Owner",
                    email: `owner-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(owner.id);

            // 3. Loome pileti, mis on juba tehnikule määratud
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Printer problem",
                    description: "Printer is not responding",
                    priority: "MEDIUM",
                    status: "IN_PROGRESS",
                    createdById: owner.id,
                    assignedToId: technician.id,
                },
            });

            ticketId = ticket.id;

            // 4. Genereerime tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. Tehnik proovib sama piletit uuesti endale määrata
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`)
                .send();

            // 6. Päring peab õnnestuma
            expect(response.status).toBe(200);

            expect(response.body.assignedToId).toBe(technician.id);
            expect(response.body.status).toBe("IN_PROGRESS");

            // 7. Kontrollime andmebaasi
            const updatedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(updatedTicket).not.toBeNull();
            expect(updatedTicket?.assignedToId).toBe(technician.id);
            expect(updatedTicket?.status).toBe("IN_PROGRESS");

        } finally {
            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should preserve RESOLVED status", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // 1. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `tech-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 2. Loome pileti omaniku
            const owner = await prisma.user.create({
                data: {
                    name: "Ticket Owner",
                    email: `owner-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(owner.id);

            // 3. Loome juba lahendatud pileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Resolved printer problem",
                    description: "Printer issue has been resolved",
                    priority: "MEDIUM",
                    status: "RESOLVED",
                    createdById: owner.id,
                    assignedToId: technician.id,
                },
            });

            ticketId = ticket.id;

            // 4. Loome tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. Tehnik saadab korduva assign-to-me päringu
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`)
                .send();

            // 6. Päring peab õnnestuma
            expect(response.status).toBe(200);

            // Staatus peab jääma RESOLVED
            expect(response.body.status).toBe("RESOLVED");
            expect(response.body.assignedToId).toBe(technician.id);

            // 7. Kontrollime ka andmebaasi
            const unchangedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(unchangedTicket).not.toBeNull();
            expect(unchangedTicket?.status).toBe("RESOLVED");
            expect(unchangedTicket?.assignedToId).toBe(technician.id);

        } finally {
            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id/assign-to-me should reject CLOSED ticket", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // 1. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `tech-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 2. Loome pileti omaniku
            const owner = await prisma.user.create({
                data: {
                    name: "Ticket Owner",
                    email: `owner-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "USER",
                },
            });

            createdUserIds.push(owner.id);

            // 3. Loome suletud pileti, millel puudub tehnik
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Closed network problem",
                    description: "Network issue was already resolved",
                    priority: "MEDIUM",
                    status: "CLOSED",
                    createdById: owner.id,
                    assignedToId: null,
                },
            });

            ticketId = ticket.id;

            // 4. Loome tehniku JWT tokeni
            const token = jwt.sign(
                {
                    userId: technician.id,
                    role: "TECHNICIAN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. Tehnik proovib suletud piletit endale määrata
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}/assign-to-me`)
                .set("Authorization", `Bearer ${token}`)
                .send();

            // 6. Kontrollime API vastust
            expect(response.status).toBe(409);

            expect(response.body.message).toBe(
                "Only OPEN tickets can be assigned"
            );

            // 7. Kontrollime andmebaasi
            const unchangedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(unchangedTicket).not.toBeNull();
            expect(unchangedTicket?.status).toBe("CLOSED");
            expect(unchangedTicket?.assignedToId).toBeNull();

        } finally {
            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should prevent ADMIN from assigning CLOSED ticket", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // 1. Loome administraatori
            const admin = await prisma.user.create({
                data: {
                    name: "Test Admin",
                    email: `admin-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "ADMIN",
                },
            });

            createdUserIds.push(admin.id);

            // 2. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `tech-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 3. Loome CLOSED staatusega pileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Closed printer problem",
                    description: "Printer issue has been resolved",
                    priority: "MEDIUM",
                    status: "CLOSED",
                    createdById: admin.id,
                    assignedToId: null,
                },
            });

            ticketId = ticket.id;

            // 4. Loome ADMIN JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. ADMIN proovib määrata suletud pileti tehnikule
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    assignedToId: technician.id,
                });

            // 6. Kontrollime API vastust
            expect(response.status).toBe(409);

            expect(response.body.message).toBe(
                "Closed ticket must be reopened before assignment"
            );

            // 7. Kontrollime, et andmebaasis midagi ei muutunud
            const unchangedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(unchangedTicket).not.toBeNull();
            expect(unchangedTicket?.status).toBe("CLOSED");
            expect(unchangedTicket?.assignedToId).toBeNull();

        } finally {
            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

    test("PATCH /api/tickets/:id should allow ADMIN to reopen and assign CLOSED ticket", async () => {
        const passwordHash = await bcrypt.hash("TestPassword123!", 12);

        const createdUserIds: string[] = [];
        let ticketId: string | undefined;

        try {
            // 1. Loome administraatori
            const admin = await prisma.user.create({
                data: {
                    name: "Test Admin",
                    email: `admin-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "ADMIN",
                },
            });

            createdUserIds.push(admin.id);

            // 2. Loome tehniku
            const technician = await prisma.user.create({
                data: {
                    name: "Test Technician",
                    email: `tech-${crypto.randomUUID()}@example.com`,
                    password: passwordHash,
                    role: "TECHNICIAN",
                },
            });

            createdUserIds.push(technician.id);

            // 3. Loome CLOSED staatusega pileti
            const ticket = await prisma.ticket.create({
                data: {
                    title: "Closed network problem",
                    description: "Network issue was previously resolved",
                    priority: "HIGH",
                    status: "CLOSED",
                    createdById: admin.id,
                    assignedToId: null,
                },
            });

            ticketId = ticket.id;

            // 4. Genereerime ADMIN JWT tokeni
            const token = jwt.sign(
                {
                    userId: admin.id,
                    role: "ADMIN",
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1h" }
            );

            // 5. ADMIN avab pileti ja määrab selle tehnikule
            const response = await request(app)
                .patch(`/api/tickets/${ticket.id}`)
                .set("Authorization", `Bearer ${token}`)
                .send({
                    status: "OPEN",
                    assignedToId: technician.id,
                });

            // 6. Kontrollime API vastust
            expect(response.status).toBe(200);

            expect(response.body.status).toBe("OPEN");
            expect(response.body.assignedToId).toBe(technician.id);

            // Kontrollime ka seotud tehniku andmeid
            expect(response.body.assignedTo.id).toBe(technician.id);
            expect(response.body.assignedTo.role).toBe("TECHNICIAN");

            // 7. Kontrollime andmebaasi
            const updatedTicket = await prisma.ticket.findUnique({
                where: { id: ticket.id },
            });

            expect(updatedTicket).not.toBeNull();
            expect(updatedTicket?.status).toBe("OPEN");
            expect(updatedTicket?.assignedToId).toBe(technician.id);

        } finally {
            // 8. Kustutame testandmed
            if (ticketId) {
                await prisma.ticket.deleteMany({
                    where: { id: ticketId },
                });
            }

            await prisma.user.deleteMany({
                where: {
                    id: { in: createdUserIds },
                },
            });
        }
    });

});