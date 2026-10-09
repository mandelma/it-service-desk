import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

import {
    createTicketSchema,
    updateTicketSchema,
    ticketIdSchema,
    type CreateTicketBody,
    type UpdateTicketBody
} from "../schemas/ticketSchema.js";

export const getTickets = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        console.log("REQ USER - ", user);

        const where =
            user.role === "USER"
                ? { createdById: user.id }
                : {};

        const tickets = await prisma.ticket.findMany({

            where,

            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },

                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json(tickets);
    } catch (error) {
        console.error("GET TICKETS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch tickets",
        });
    }
};

export const getTicketById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const result = ticketIdSchema.safeParse(req.params);

        if (!result.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: result.error.issues,
            });

            return;
        }

        const { id } = result.data;

        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });

            return;
        }

        const where =
            user.role === "USER"
                ? {
                    id,
                    createdById: user.id,
                }
                : {
                    id,
                };

        const ticket = await prisma.ticket.findUnique({

            where,

            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },

                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        if (!ticket) {
            res.status(404).json({
                message: "Ticket not found",
            });

            return;
        }

        res.status(200).json(ticket);
    } catch (error) {
        console.error("GET TICKET BY ID ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch ticket",
        });
    }
};

export const createTicket = async (
    req: Request<{}, {}, CreateTicketBody>,
    res: Response
): Promise<void> => {
    try {
        const result = createTicketSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                message: "Invalid ticket data",
                errors: result.error.issues,
            });

            return;
        }

        const {
            title,
            description,
            priority,
            assignedToId,
        } = result.data;

        const createdById = req.user?.id;

        if (!createdById) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        // Ainult ADMIN võib pileti loomisel tehniku määrata
        if (assignedToId != null && req.user?.role !== "ADMIN") {
            res.status(403).json({
                message: "Only admins can assign tickets during creation",
            });
            return;
        }

        if (assignedToId) {
            const assignedUser = await prisma.user.findUnique({
                where: {
                    id: assignedToId,
                },
            });

            if (!assignedUser) {
                res.status(404).json({
                    message: "Assigned user not found",
                });

                return;
            }

            if (
                assignedUser.role !== "TECHNICIAN" &&
                assignedUser.role !== "ADMIN"
            ) {
                res.status(400).json({
                    message: "Ticket can only be assigned to a technician or admin",
                });

                return;
            }
        }


        const ticket = await prisma.ticket.create({
            data: {
                title,
                description,
                priority,
                createdById,
                assignedToId,
            },

            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },

                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(201).json(ticket);
    } catch (error) {
        console.error("CREATE TICKET ERROR:", error);

        res.status(500).json({
            message: "Failed to create ticket",
        });
    }
};

export const updateTicket = async (
    req: Request<{ id: string }, {}, UpdateTicketBody>,
    res: Response
): Promise<void> => {
    try {
        // 1. Kontrolli Ticketi UUID-d
        const idResult = ticketIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: idResult.error.issues,
            });

            return;
        }

        // 2. Kontrolli request body't
        const bodyResult = updateTicketSchema.safeParse(req.body);

        if (!bodyResult.success) {
            res.status(400).json({
                message: "Invalid ticket data",
                errors: bodyResult.error.issues,
            });

            return;
        }

        // 3. PATCH peab sisaldama vähemalt ühte muudetavat välja
        if (Object.keys(bodyResult.data).length === 0) {
            res.status(400).json({
                message: "No fields provided for update",
            });

            return;
        }

        const { id } = idResult.data;
        const data = bodyResult.data;

        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });

            return;
        }

        // 4. Kontrolli, kas Ticket eksisteerib
        const existingTicket = await prisma.ticket.findUnique({
            where: {
                id,
                ...(user.role === "USER" && {
                    createdById: user.id,
                }),
            },
        });

        if (!existingTicket) {
            res.status(404).json({
                message: "Ticket not found",
            });

            return;
        }

        // CLOSED piletile ei saa uut tehnikut määrata,
        // kui piletit sama päringuga uuesti ei avata.
        if (
            existingTicket.status === "CLOSED" &&
            data.assignedToId != null &&
            data.assignedToId !== existingTicket.assignedToId &&
            data.status !== "OPEN"
        ) {
            res.status(409).json({
                message: "Closed ticket must be reopened before assignment",
            });
            return;
        }

        if (
            user.role === "TECHNICIAN" &&
            existingTicket.assignedToId !== user.id
        ) {
            res.status(403).json({
                message: "You can only update tickets assigned to you",
            });

            return;
        }

        if (
            user.role === "TECHNICIAN" &&
            (
                data.title !== undefined ||
                data.description !== undefined ||
                data.priority !== undefined ||
                data.assignedToId !== undefined
            )
        ) {
            res.status(403).json({
                message: "Technicians can only update ticket status",
            });

            return;
        }

        if (
            user.role === "USER" &&
            (data.status !== undefined || data.assignedToId !== undefined)
        ) {
            res.status(403).json({
                message: "You are not allowed to update status or assignment",
            });

            return;
        }

        // 5. Kui assignedToId saadeti ja see pole null,
        // kontrolli kasutajat ja tema rolli
        if (data.assignedToId) {
            const assignedUser = await prisma.user.findUnique({
                where: {
                    id: data.assignedToId,
                },
            });

            if (!assignedUser) {
                res.status(404).json({
                    message: "Assigned user not found",
                });

                return;
            }

            if (
                assignedUser.role !== "TECHNICIAN" &&
                assignedUser.role !== "ADMIN"
            ) {
                res.status(400).json({
                    message:
                        "Ticket can only be assigned to a technician or admin",
                });

                return;
            }
        }

        // 6. Uuenda Ticket
        const updatedTicket = await prisma.ticket.update({
            where: {
                id,
            },

            data,

            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },

                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error("UPDATE TICKET ERROR:", error);

        res.status(500).json({
            message: "Failed to update ticket",
        });
    }
};

export const assignTicketToMe = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        // 1. Kontrollime pileti ID korrektsust
        const idResult = ticketIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: idResult.error.issues,
            });
            return;
        }

        // 2. Kontrollime autentimist
        const user = req.user;

        if (!user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        const { id } = idResult.data;

        // 3. Otsime pileti andmebaasist
        const existingTicket = await prisma.ticket.findUnique({
            where: { id },
        });

        if (!existingTicket) {
            res.status(404).json({
                message: "Ticket not found",
            });
            return;
        }

        // 4. Kui pilet on määratud teisele tehnikule,
        // ei saa praegune tehnik seda endale võtta.
        if (
            existingTicket.assignedToId !== null &&
            existingTicket.assignedToId !== user.id
        ) {
            res.status(409).json({
                message: "Ticket is already assigned to another technician",
            });
            return;
        }

        // 5. Kui pilet on juba samale tehnikule määratud,
        // tagastame pileti ilma selle staatust muutmata.
        if (existingTicket.assignedToId === user.id) {
            const ticket = await prisma.ticket.findUnique({
                where: { id },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        },
                    },
                },
            });

            res.status(200).json(ticket);
            return;
        }

        // 6. Pilet on vaba.
        // Kasutame tingimuslikku updateMany() operatsiooni,
        // et vältida kahe tehniku samaaegset määramist.
        const result = await prisma.ticket.updateMany({
            where: {
                id,
                assignedToId: null,
                status: "OPEN",
            },
            data: {
                assignedToId: user.id,
                status: "IN_PROGRESS",
            },
        });

        // 7. Kui count === 0, jõudis keegi teine
        // pileti vahepeal endale määrata.
        if (result.count === 0) {
            const currentTicket = await prisma.ticket.findUnique({
                where: { id },
            });

            if (!currentTicket) {
                res.status(404).json({
                    message: "Ticket not found",
                });
                return;
            }

            if (currentTicket.assignedToId !== null) {
                res.status(409).json({
                    message: "Ticket is already assigned to another technician",
                });
                return;
            }

            res.status(409).json({
                message: "Only OPEN tickets can be assigned",
            });
            return;
        }

        // 8. Loeme uuendatud pileti koos seotud kasutajatega
        const updatedTicket = await prisma.ticket.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
                assignedTo: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                    },
                },
            },
        });

        // 9. Tagastame uuendatud pileti
        res.status(200).json(updatedTicket);

    } catch (error) {
        console.error("ASSIGN TICKET ERROR:", error);

        res.status(500).json({
            message: "Failed to assign ticket",
        });
    }
};

export const deleteTicket = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        // 1. Valideeri URL-ist saadud Ticket ID
        const idResult = ticketIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid ticket ID",
                errors: idResult.error.issues,
            });

            return;
        }

        const { id } = idResult.data;

        // 2. Kontrolli, kas Ticket eksisteerib
        const existingTicket = await prisma.ticket.findUnique({
            where: {
                id,
            },
        });

        if (!existingTicket) {
            res.status(404).json({
                message: "Ticket not found",
            });

            return;
        }

        // 3. Kustuta Ticket
        await prisma.ticket.delete({
            where: {
                id,
            },
        });

        // 4. Eduka DELETE puhul pole response body't vaja
        res.status(204).send();
    } catch (error) {
        console.error("DELETE TICKET ERROR:", error);

        res.status(500).json({
            message: "Failed to delete ticket",
        });
    }
};