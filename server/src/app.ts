import express from "express";
import cors from "cors";
import userRoutes from "./routers/userRoutes.js";
import ticketRoutes from "./routers/ticketRoutes.js"
import authRoutes from "./routers/authRoutes.js"

import { authenticate } from "./middleware/authMiddleware.js"

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173",
    })
)

app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "IT Service Desk API is running",
    });
});

app.use(
    "/api/users", 
    authenticate,
    userRoutes
);
app.use("/api/auth", authRoutes);
app.use(
    "/api/tickets",
    authenticate,
    ticketRoutes
);

export default app;