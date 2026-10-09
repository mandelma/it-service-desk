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
router.post("/", authorize(UserRole.ADMIN), createUser);
router.patch("/:id", authorize(UserRole.ADMIN), updateUser);
router.delete("/:id", authorize(UserRole.ADMIN), deleteUser);

export default router;