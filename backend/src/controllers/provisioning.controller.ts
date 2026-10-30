import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createProvisioningJob,
  getProvisioningJob,
} from "../services/provisioning.service.js";

const createSchema = z.object({
  resourceName: z.string().trim().min(1),
  resourceType: z.enum(["server", "virtual-machine"]),
  environment: z.enum(["development", "staging", "production"]),
});

export async function createProvisioning(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = createSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid provisioning request",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const actorId = req.auth?.userId;

    if (!actorId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const idempotencyKey = z.string().trim().min(1).safeParse(
      req.get("Idempotency-Key")
    );

    if (!idempotencyKey.success) {
      res.status(400).json({ message: "Idempotency-Key header is required" });
      return;
    }

    const job = await createProvisioningJob(
      result.data,
      actorId,
      idempotencyKey.data
    );

    res.status(202).json({
      message: "Provisioning request accepted",
      data: job,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProvisioningStatus(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);

    if (!idResult.success) {
      res.status(400).json({ message: "Invalid job ID" });
      return;
    }

    const job = await getProvisioningJob(idResult.data);

    if (!job) {
      res.status(404).json({ message: "Provisioning job not found" });
      return;
    }

    res.status(200).json({ data: job });
  } catch (error) {
    next(error);
  }
}