import prisma from "../lib/prisma.js";

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

export async function createAsset(data: CreateAssetInput) {
  return prisma.asset.create({
    data,
  });
}

export async function getAssetById(id: string) {
  return prisma.asset.findUnique({
    where: { id },
  });
}

export async function deleteAsset(id: string) {
  return prisma.asset.delete({
    where: { id },
  });
}

export async function updateAsset(
  id: string,
  data: Partial<CreateAssetInput>
) {
  return prisma.asset.update({
    where: { id },
    data,
  });
}