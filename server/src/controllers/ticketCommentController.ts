import type { Request, Response } from "express";
import prisma  from "../lib/prisma.js";
import {
    createTicketCommentSchema,
    type CreateTicketCommentBody,
} from "../schemas/ticketComment.schema.js";
import { ticketIdSchema } from "../schemas/ticketSchema.js";

export const getTicketComments = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        // 1. Kontrollime pileti ID-d
        const idResult = ticketIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: idResult.error.issues,
            });
            return;
        }

        // 2. Kontrollime autentitud kasutajat
        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        const { id } = idResult.data;

        // 3. Kontrollime, kas kasutajal on õigus piletit vaadata
        const ticket = await prisma.ticket.findFirst({
            where: {
                id,
                ...(user.role === "USER" && {
                    createdById: user.id,
                }),
                ...(user.role === "TECHNICIAN" && {
                    assignedToId: user.id,
                }),
            },
        });

        if (!ticket) {
            res.status(404).json({
                message: "Ticket not found",
            });
            return;
        }

        // 4. Laadime pileti kommentaarid
        const comments = await prisma.ticketComment.findMany({
            where: {
                ticketId: id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        // 5. Tagastame kommentaarid
        res.status(200).json(comments);

    } catch (error) {
        console.error("GET COMMENTS ERROR:", error);

        res.status(500).json({
            message: "Failed to get comments",
        });
    }
};

export const createTicketComment = async (
    req: Request<{ id: string }, {}, CreateTicketCommentBody>,
    res: Response
): Promise<void> => {
    try {
        // 1. Kontrollime pileti UUID-d
        const idResult = ticketIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: idResult.error.issues,
            });
            return;
        }

        // 2. Kontrollime kommentaari sisu
        const bodyResult = createTicketCommentSchema.safeParse(req.body);

        if (!bodyResult.success) {
            res.status(400).json({
                message: "Invalid comment data",
                errors: bodyResult.error.issues,
            });
            return;
        }

        // 3. Kontrollime autentimist
        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        const { id } = idResult.data;
        const { content } = bodyResult.data;

        // 4. Kontrollime pileti olemasolu ja ligipääsu
        const ticket = await prisma.ticket.findFirst({
            where: {
                id,
                ...(user.role === "USER" && {
                    createdById: user.id,
                }),
                ...(user.role === "TECHNICIAN" && {
                    assignedToId: user.id,
                }),
            },
        });

        if (!ticket) {
            res.status(404).json({
                message: "Ticket not found",
            });
            return;
        }

        // 5. Salvestame kommentaari
        const comment = await prisma.ticketComment.create({
            data: {
                content,
                ticketId: id,
                authorId: user.id,
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        role: true,
                    },
                },
            },
        });

        // 6. Tagastame loodud kommentaari
        res.status(201).json(comment);

    } catch (error) {
        console.error("CREATE COMMENT ERROR:", error);

        res.status(500).json({
            message: "Failed to create comment",
        });
    }
};