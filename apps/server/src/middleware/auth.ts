import type { Context, Next } from "hono";
import { verifyToken } from "../lib/jwt";
import type { JwtPayload } from "../lib/jwt.js";

type Variables = {user: JwtPayload};

export async function authMiddleware(c: Context<{ Variables: Variables }>, next: Next) {
    const authHeader = c.req.header("Authorization");

    if(!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({
            error : "Missing or invalid authorization header"
        }, 401);
    }

    const token = authHeader.split(" ")[1];

    if(!token) {
        return c.json({
            error : "Token not found"
        }, 401);
    }

    try {
        const payload = verifyToken(token);

        c.set("user", payload);

        return await next();

    } catch (error) {
        return c.json({
            error : "Invalid or expired token"
        }, 401);
    }
}