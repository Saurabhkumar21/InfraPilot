import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

type UserRole = "ADMIN" | "VIEWER";

type AuthenticatedRequest = Request & {
  auth?: {
    userId: string;
    role: UserRole;
  };
};

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authReq = req as AuthenticatedRequest;
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const token = authorization.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    next(new Error("JWT_SECRET is not configured correctly"));
    return;
  }

  try {
    const payload = jwt.verify(token, secret, {
      issuer: "infrapilot",
      audience: "infrapilot-api",
    });

    if (
      typeof payload === "string" ||
      !payload.sub ||
      (payload.role !== "ADMIN" && payload.role !== "VIEWER")
    ) {
      res.status(401).json({ message: "Invalid authentication token" });
      return;
    }

    authReq.auth = {
      userId: payload.sub,
      role: payload.role,
    };

    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const authReq = req as AuthenticatedRequest;

    if (!authReq.auth) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(authReq.auth.role)) {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    next();
  };
}