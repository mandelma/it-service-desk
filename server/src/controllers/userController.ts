import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../lib/prisma.js";

import {
    createUserSchema,
    userIdSchema,
    updateUserSchema,
    type CreateUserBody,
    type UpdateUserBody
} from "../schemas/userSchema.js";

/* type CreateUserBody = {
    name: string;
    email: string;
    password: string;
    role?: string;
}; */

export const getUsers = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        res.status(200).json(users);
    } catch (error) {
        console.error("GET USERS ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch users",
        });
    }
};

export const getUserById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const result = userIdSchema.safeParse(req.params);

        if (!result.success) {
            res.status(400).json({
                message: "Invalid user ID",
                errors: result.error.issues,
            });

            return;
        }

        const { id } = result.data;

        const user = await prisma.user.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            res.status(404).json({
                message: "User not found",
            });

            return;
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);

        res.status(500).json({
            message: "Failed to fetch user",
        });
    }
};

export const createUser = async (
    req: Request<{}, {}, CreateUserBody>,
    res: Response
): Promise<void> => {
    try {
        //throw new Error("Test server error");
        const result = createUserSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                message: "Invalid user data",
                errors: result.error.issues,
            });

            return;
        }


        const {
            name,
            email,
            password,
            role
        } = result.data;

        

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (existingUser) {
            res.status(409).json({
                message: "User with this email already exists",
            });

            return;
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: passwordHash,
                role: role ?? "USER",
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("CREATE USER ERROR:", error);

        res.status(500).json({
            message: "Failed to create user",
        });
    }
};


export const updateUser = async (
    req: Request<{ id: string }, {}, UpdateUserBody>,
    res: Response
): Promise<void> => {
    try {
        const idResult = userIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid user ID",
                errors: idResult.error.issues,
            });

            return;
        }

        const bodyResult = updateUserSchema.safeParse(req.body);

        if (!bodyResult.success) {
            res.status(400).json({
                message: "Invalid user data",
                errors: bodyResult.error.issues,
            });

            return;
        }

        if (Object.keys(bodyResult.data).length === 0) {
            res.status(400).json({
                message: "No fields provided for update",
            });

            return;
        }

        const { id } = idResult.data;

        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            res.status(404).json({
                message: "User not found",
            });

            return;
        }

        const data = { ...bodyResult.data };

        if (data.password) {
            data.password = await bcrypt.hash(data.password, 12);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error("UPDATE USER ERROR:", error);

        res.status(500).json({
            message: "Failed to update user",
        });
    }
};


export const deleteUser = async (
    req: Request<{ id: string }>,
    res: Response
): Promise<void> => {
    try {
        const idResult = userIdSchema.safeParse(req.params);

        if (!idResult.success) {
            res.status(400).json({
                message: "Invalid user ID",
                errors: idResult.error.issues,
            });

            return;
        }

        const { id } = idResult.data;

        const existingUser = await prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!existingUser) {
            res.status(404).json({
                message: "User not found",
            });

            return;
        }

        await prisma.user.delete({
            where: {
                id,
            },
        });

        res.status(204).send();
    } catch (error) {
        console.error("DELETE USER ERROR:", error);

        res.status(500).json({
            message: "Failed to delete user",
        });
    }
};