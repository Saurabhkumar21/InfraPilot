import prisma from "../lib/prisma.js";
import { provisioningQueue } from "../queues/provisioning.queue.js";

interface CreateProvisioningInput {
  resourceName: string;
  resourceType: string;
  environment: string;
}

export async function createProvisioningJob(
  data: CreateProvisioningInput,
  actorId: string,
  idempotencyKey: string
) {
  const existing = await prisma.provisioningJob.findUnique({
    where: { idempotencyKey },
  });

  if (existing) {
    if (existing.requestedById !== actorId) {
      throw new Error("Idempotency key already used");
    }

    return existing;
  }

  const job = await prisma.provisioningJob.create({
    data: {
      ...data,
      requestedById: actorId,
      idempotencyKey,
    },
  });

  await provisioningQueue.add(
    "provision",
    { provisioningJobId: job.id },
    { jobId: job.id }
  );

  return job;
}

export async function getProvisioningJob(id: string) {
  return prisma.provisioningJob.findUnique({
    where: { id },
  });
}
