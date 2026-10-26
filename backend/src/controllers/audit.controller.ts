import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getAuditLogs } from "../services/audit.service.js";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function listAuditLogs(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = querySchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid pagination parameters",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const logs = await getAuditLogs(
      result.data.page,
      result.data.limit
    );

    res.status(200).json({
      data: logs.logs,
      pagination: {
        page: logs.page,
        limit: logs.limit,
        total: logs.total,
        totalPages: logs.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}