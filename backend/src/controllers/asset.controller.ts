import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  getAllAssets,
  createAsset,
  getAssetById,
  deleteAsset,
  updateAsset,
} from "../services/asset.service.js";

const createAssetSchema = z.object({
  name: z.string().trim().min(1),
  type: z.enum(["server", "database", "virtual-machine"]),
  environment: z.enum(["development", "staging", "production"]).optional(),
  status: z.enum(["active", "inactive", "maintenance"]).optional(),
  ipAddress: z.string().trim().optional(),
});

const updateAssetSchema = createAssetSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function listAssets(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = paginationSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid pagination parameters",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const { page, limit } = result.data;
    const resultData = await getAllAssets(page, limit);

    res.status(200).json({
      data: resultData.assets,
      pagination: {
        page: resultData.page,
        limit: resultData.limit,
        total: resultData.total,
        totalPages: resultData.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function addAsset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const result = createAssetSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid asset data",
        errors: result.error.flatten().fieldErrors,
      });
      return;
    }

    const actorId = req.auth?.userId;

    if (!actorId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const asset = await createAsset(result.data, actorId);
    res.status(201).json({ data: asset });
  } catch (error) {
    next(error);
  }
}

export async function getAsset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);

    if (!idResult.success) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    const asset = await getAssetById(idResult.data);

    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    res.status(200).json({ data: asset });
  } catch (error) {
    next(error);
  }
}

export async function removeAsset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);

    if (!idResult.success) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    const asset = await getAssetById(idResult.data);

    if (!asset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    const actorId = req.auth?.userId;

    if (!actorId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    await deleteAsset(idResult.data, actorId);

    res.status(200).json({
      message: "Asset deleted successfully",
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

export async function editAsset(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const idResult = z.string().uuid().safeParse(req.params.id);

    if (!idResult.success) {
      res.status(400).json({ message: "Invalid asset ID" });
      return;
    }

    const bodyResult = updateAssetSchema.safeParse(req.body);

    if (!bodyResult.success) {
      res.status(400).json({
        message: "Invalid asset data",
        errors: bodyResult.error.flatten().fieldErrors,
      });
      return;
    }

    const existingAsset = await getAssetById(idResult.data);

    if (!existingAsset) {
      res.status(404).json({ message: "Asset not found" });
      return;
    }

    const actorId = req.auth?.userId;

    if (!actorId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    const updatedAsset = await updateAsset(
      idResult.data,
      bodyResult.data,
      actorId,
    );

    res.status(200).json({ data: updatedAsset });
  } catch (error) {
    next(error);
  }
}
