import express from "express";

import { 
    createTicket,
    updateTicket,
    assignTicketToMe,
    getTicketById,
    getTickets,
    deleteTicket
} from "../controllers/ticketController.js";

import { authorize } from "../middleware/authMiddleware.js";
import { UserRole } from "../../generated/prisma/enums.js";

const router = express.Router();

router.get("/", getTickets);
router.get("/:id", getTicketById);
router.post("/", createTicket);
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