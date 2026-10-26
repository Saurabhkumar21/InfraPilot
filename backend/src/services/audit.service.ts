import type { Prisma } from "@prisma/client";
import type { AuditAction } from "@prisma/client";
import prisma from "../lib/prisma.js";

interface CreateAuditLogInput {
  action: AuditAction;
  entity: string;
  entityId: string;
  actorId: string;
  details?: Prisma.InputJsonValue;
}

export async function createAuditLog(
  tx: Prisma.TransactionClient,
  data: CreateAuditLogInput
) {
  return tx.auditLog.create({
    data: {
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      actorId: data.actorId,
      details: data.details,
    },
  });
}


export async function getAuditLogs(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    logs,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}