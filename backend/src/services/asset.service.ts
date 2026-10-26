import prisma from "../lib/prisma.js";
import { createAuditLog } from "./audit.service.js";

export interface CreateAssetInput {
  name: string;
  type: string;
  environment?: string;
  status?: string;
  ipAddress?: string;
}

export async function getAllAssets(
  page: number,
  limit: number
) {
  const skip = (page - 1) * limit;

  const [assets, total] = await prisma.$transaction([
    prisma.asset.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.asset.count(),
  ]);

  return {
    assets,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createAsset(
  data: CreateAssetInput,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const asset = await tx.asset.create({
      data,
    });

    await createAuditLog(tx, {
      action: "CREATE",
      entity: "Asset",
      entityId: asset.id,
      actorId,
      details: {
        name: asset.name,
        type: asset.type,
      },
    });

    return asset;
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
  });
}

export async function deleteAsset(
  id: string,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
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
}

export async function updateAsset(
  id: string,
  data: Partial<CreateAssetInput>,
  actorId: string
) {
  return prisma.$transaction(async (tx) => {
    const existingAsset = await tx.asset.findUnique({
      where: { id },
    });

    if (!existingAsset) {
      throw new Error("Asset not found");
    }

    const updatedAsset = await tx.asset.update({
      where: { id },
      data,
    });

    await createAuditLog(tx, {
      action: "UPDATE",
      entity: "Asset",
      entityId: id,
      actorId,
      details: {
        before: {
          name: existingAsset.name,
          status: existingAsset.status,
          environment: existingAsset.environment,
        },
        after: {
          name: updatedAsset.name,
          status: updatedAsset.status,
          environment: updatedAsset.environment,
        },
      },
    });

    return updatedAsset;
  });
}