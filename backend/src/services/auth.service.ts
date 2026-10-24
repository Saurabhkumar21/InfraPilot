import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma.js";

const registerSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(72),
});

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters");
  }

  return secret;
}

export async function registerUser(input: unknown) {
  const data = registerSchema.parse(input);
  const passwordHash = await bcrypt.hash(data.password, 12);

  return prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      role: "VIEWER",
    },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
}

export async function loginUser(input: unknown) {
  const data = registerSchema.parse(input);

  const user = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) {
    return null;
  }

  const token = jwt.sign(
    { role: user.role },
    getJwtSecret(),
    {
      subject: user.id,
      expiresIn: "1h",
      issuer: "infrapilot",
      audience: "infrapilot-api",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
    },
  };
}