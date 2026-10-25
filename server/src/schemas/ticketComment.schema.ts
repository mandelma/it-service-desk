import { z } from "zod";

export const createTicketCommentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Comment cannot be empty")
        .max(2000, "Comment cannot exceed 2000 characters"),
});

export type CreateTicketCommentBody = z.infer<
    typeof createTicketCommentSchema
>;