import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error);

  if (error instanceof ZodError) {
  res.status(400).json({
    message: "Invalid request data",
    errors: error.flatten().fieldErrors,
  });
  return;
}

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({
        message: "Resource not found",
      });
      return;
    }

    if (error.code === "P2002") {
      res.status(409).json({
        message: "A record with this unique value already exists",
      });
      return;
    }
  }

  res.status(500).json({
    message: "Internal server error",
  });
}