import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../lib/prisma.js";

import {
    loginSchema,
    type LoginBody,
} from "../schemas/authSchema.js";

export const login = async (
    req: Request<{}, {}, LoginBody>,
    res: Response
): Promise<void> => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            res.status(400).json({
                message: "Invalid login data",
                errors: result.error.issues,
            });

            return;
        }

        const { email, password } = result.data;

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if (!user) {
            res.status(401).json({
                message: "Invalid email or password",
            });

            return;
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatches) {
            res.status(401).json({
                message: "Invalid email or password",
            });

            return;
        }

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined")
        }

        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role
            },
            jwtSecret,
            {
                expiresIn: "1h"
            }
        )

        res.status(200).json({
            message: "Login successful",

            token,
            
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);

        res.status(500).json({
            message: "Login failed",
        });
    }
};