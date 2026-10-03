import express from "express";

import { UserRole } from "../../generated/prisma/enums.js";

import { authorize } from "../middleware/authMiddleware.js";
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
} from "../controllers/userController.js";

const router = express.Router();

router.get("/", authorize(UserRole.ADMIN), getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.patch("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;