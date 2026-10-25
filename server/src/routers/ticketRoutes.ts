import express from "express";

import { 
    createTicket,
    updateTicket,
    assignTicketToMe,
    getTicketById,
    getTickets,
    deleteTicket,
    getTicketActivities
} from "../controllers/ticketController.js";

import {
    createTicketComment,
    getTicketComments
} from "../controllers/ticketCommentController.js";

import { authorize } from "../middleware/authMiddleware.js";
import { UserRole } from "../../generated/prisma/enums.js";

const router = express.Router();

router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/", createTicket);
router.post(
    "/:id/comments",
    createTicketComment
);

// Kommentaaride laadimine
router.get(
    "/:id/comments",
    getTicketComments
);


// Kommentaari lisamine
router.post(
    "/:id/comments",
    createTicketComment
);

router.get("/:id/activities", getTicketActivities);

router.patch("/:id", updateTicket);
router.patch(
    "/:id/assign-to-me",
    authorize(UserRole.TECHNICIAN),
    assignTicketToMe
);
router.delete(
    "/:id",
    authorize(UserRole.ADMIN),
    deleteTicket
);

export default router;