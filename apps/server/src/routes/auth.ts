import { Hono } from "hono";
import { prisma } from "@repo/db";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import type { LogInRequest, RegisterRequest } from "@repo/shared";

const auth = new Hono();

auth.post("/register", async (c) => {
  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.username?.trim() || !body.email?.trim() || !body.password) {
    return c.json({ error: "All fields are required" }, 400);
  }

  if (body.password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters" }, 400);
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: body.email.trim().toLowerCase() },
        { username: body.username.trim() },
      ],
    },
  });

  if (existing) {
    return c.json({ error: "Email or username already taken" }, 409);
  }

  const passwordHash = await hashPassword(body.password);

  const user = await prisma.user.create({
    data: {
      username: body.username.trim(),
      email: body.email.trim().toLowerCase(),
      passwordHash,
    },
  });

  const token = signToken({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  }, 201);
});

auth.post("/login", async (c) => {
  let body: LogInRequest;
  try {
    body = await c.req.json<LogInRequest>();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.email?.trim() || !body.password) {
    return c.json({ error: "Email and password are required" }, 400);
  }

  const user = await prisma.user.findUnique({
    where: { email: body.email.trim().toLowerCase() },
  });

  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(body.password, user.passwordHash);

  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = signToken({
    userId: user.id,
    username: user.username,
    email: user.email,
  });

  return c.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

export default auth;