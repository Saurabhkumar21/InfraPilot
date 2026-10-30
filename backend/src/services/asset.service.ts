import prisma from "../lib/prisma.js";
import { createAuditLog } from "./audit.service.js";
import {
  getOrSetCache,
  getCacheVersion,
  invalidateCache,
} from "../lib/cache.js";
import { Prisma } from "@prisma/client";

// Get all assets with pagination and Redis caching
export async function getAllAssets(page = 1, limit = 10) {
  const skip = (page - 1) * limit;

  const cacheVersion = await getCacheVersion("assets");
  const cacheKey = `assets:list:${cacheVersion}:${page}:${limit}`;

  return getOrSetCache(cacheKey, 60, async () => {
    const [assets, total] = await prisma.$transaction([
      prisma.asset.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.asset.count(),
    ]);

    return {
      assets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  });
}

// Get a single asset by ID
export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
  });
}

// Create an asset and record the audit log
export async function createAsset(
  data: Prisma.AssetCreateInput,
  actorId: string
) {
  const asset = await prisma.$transaction(async (tx) => {
    const newAsset = await tx.asset.create({
      data,
    });

    await createAuditLog(tx, {
      action: "CREATE",
      entity: "Asset",
      entityId: newAsset.id,
      actorId,
      details: {
        name: newAsset.name,
        type: newAsset.type,
        environment: newAsset.environment,
      },
    });

    return newAsset;
  });

  // Invalidate cached asset lists
  await invalidateCache("assets");

  return asset;
}

// Update an asset and record the audit log
export async function updateAsset(
  id: string,
  data: Prisma.AssetUpdateInput,
  actorId: string
) {
  const updatedAsset = await prisma.$transaction(async (tx) => {
    const existingAsset = await tx.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      throw new Error("Asset not found");
    }

    const updated = await tx.asset.update({
      where: { id },
      data,
    });

    await createAuditLog(tx, {
      action: "UPDATE",
      entity: "Asset",
      entityId: id,
      actorId,
      details: {
        before: existingAsset,
        after: updated,
      },
    });

    return updated;
  });

  // Invalidate cached asset lists
  await invalidateCache("assets");

  return updatedAsset;
}

// Delete an asset and record the audit log
export async function deleteAsset(id: string, actorId: string) {
  const deletedAsset = await prisma.$transaction(async (tx) => {
    const existingAsset = await tx.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      throw new Error("Asset not found");
    }

    await tx.asset.delete({
      where: { id },
    });

    await createAuditLog(tx, {
      action: "DELETE",
      entity: "Asset",
      entityId: id,
      actorId,
      details: {
        name: existingAsset.name,
        type: existingAsset.type,
        environment: existingAsset.environment,
      },
    });

    return existingAsset;
  });

  // Invalidate cached asset lists
  await invalidateCache("assets");

  return deletedAsset;
}
