import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { UserRole } from "../../generated/prisma/client.js";

type JwtPayload = {
    userId: string;
    role: "USER" | "TECHNICIAN" | "ADMIN";
};

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({
            message: "Authentication required",
        });
        return;
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        res.status(401).json({
            message: "Invalid authorization header",
        });
        return;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
        throw new Error("JWT_SECRET is not defined");
    }

    try {
        const decoded = jwt.verify(
            token,
            jwtSecret
        ) as JwtPayload;

        console.log("Authenticated user:", decoded);

        req.user = {
            id: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch {
        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
};

export const authorize = (...allowedRoles: UserRole[]) => {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ): void => {

        console.log("REQ USER:", req.user);
        console.log("ALLOWED ROLES:", allowedRoles);

        
        if (!req.user) {
            res.status(401).json({
                message: "Authentication required",
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: "Forbidden",
            });
            return;
        }

        next();
    };
};