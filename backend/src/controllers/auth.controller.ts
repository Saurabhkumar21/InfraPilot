import type { Request, Response, NextFunction } from "express";
import { registerUser, loginUser } from "../services/auth.service.js";

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ data: user });
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await loginUser(req.body);

    if (!result) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}