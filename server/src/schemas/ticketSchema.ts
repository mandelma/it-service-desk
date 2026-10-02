import { z } from "zod";

export const createTicketSchema = z.object({
  title: z
    .string()
    .min(3, "Title must contain at least 3 characters"),

  description: z
    .string()
    .min(5, "Description must contain at least 5 characters"),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  assignedToId: z
    .uuid("Invalid assigned user ID")
    .nullable()
    .optional(),
});

export type CreateTicketBody =
  z.infer<typeof createTicketSchema>;

export const ticketIdSchema = z.object({
  id: z.uuid("Invalid ticket ID"),
});

export const updateTicketSchema = z.object({
  title: z
    .string()
    .min(3, "Title must contain at least 3 characters")
    .optional(),

  description: z
    .string()
    .min(5, "Description must contain at least 5 characters")
    .optional(),

  status: z
    .enum([
      "OPEN",
      "IN_PROGRESS",
      "WAITING",
      "RESOLVED",
      "CLOSED",
    ])
    .optional(),

  priority: z
    .enum([
      "LOW",
      "MEDIUM",
      "HIGH",
      "CRITICAL",
    ])
    .optional(),

  assignedToId: z
    .uuid("Invalid assigned user ID")
    .nullable()
    .optional(),
});

export type UpdateTicketBody =
  z.infer<typeof updateTicketSchema>;

