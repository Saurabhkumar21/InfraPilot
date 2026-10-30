import prisma from "../lib/prisma.js";
import { provisioningQueue } from "../queues/provisioning.queue.js";

interface CreateProvisioningInput {
  resourceName: string;
  resourceType: string;
  environment: string;
}

export async function createProvisioningJob(
  data: CreateProvisioningInput,
  actorId: string
) {
  const job = await prisma.provisioningJob.create({
    data: {
      ...data,
      requestedById: actorId,
    },
  });

  try {
    await provisioningQueue.add(
      "provision-server",
      {
        provisioningJobId: job.id,
      },
      {
        jobId: job.id,
      }
    );
  } catch (error) {
    await prisma.provisioningJob.update({
      where: { id: job.id },
      data: {
        status: "FAILED",
        errorMessage: "Unable to add job to the queue",
        completedAt: new Date(),
      },
    });

    throw error;
  }

  return job;
}

export async function getProvisioningJob(id: string) {
  return prisma.provisioningJob.findUnique({
    where: { id },
  });
}
