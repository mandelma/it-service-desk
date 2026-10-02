import { z } from "zod";

export const createUserSchema = z.object({
    name: z
        .string()
        .min(2, "Name must contain at least 2 characters"),

    email: z
        .email("Invalid email address"),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters"),

    role: z
        .enum(["USER", "TECHNICIAN", "ADMIN"])
        .optional(),
});

export type CreateUserBody =
    z.infer<typeof createUserSchema>;


export const userIdSchema = z.object({
    id: z.uuid("Invalid user ID")
});


export const updateUserSchema = z.object({
    name: z
        .string()
        .min(2, "Name must contain at least 2 characters")
        .optional(),

    email: z
        .email("Invalid email address")
        .optional(),

    password: z
        .string()
        .min(8, "Password must contain at least 8 characters")
        .optional(),

    role: z
        .enum(["USER", "TECHNICIAN", "ADMIN"])
        .optional(),
});

export type UpdateUserBody =
    z.infer<typeof updateUserSchema>;