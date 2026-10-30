import "dotenv/config";
import { Worker, Job } from "bullmq";
import redis from "../lib/redis.js";
import prisma from "../lib/prisma.js";
import type { ProvisioningJobData } from "../queues/provisioning.queue.js";

const worker = new Worker<ProvisioningJobData>(
  "provisioning",
  async (job: Job<ProvisioningJobData>) => {
    const { provisioningJobId } = job.data;

    console.log(`Starting provisioning job: ${provisioningJobId}`);

    await prisma.provisioningJob.update({
      where: { id: provisioningJobId },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
        errorMessage: null,
      },
    });

    // Simulate infrastructure provisioning.
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const completedJob = await prisma.provisioningJob.update({
      where: { id: provisioningJobId },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });

    console.log(`Provisioning completed: ${provisioningJobId}`);

    return {
      success: true,
      resourceName: completedJob.resourceName,
    };
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, error) => {
  console.error(`Job ${job?.id} failed:`, error.message);

  if (!job) return;

  const finalAttempt =
    job.attemptsMade >= (job.opts.attempts ?? 1);

  if (finalAttempt) {
    await prisma.provisioningJob.update({
      where: { id: job.data.provisioningJobId },
      data: {
        status: "FAILED",
        errorMessage: error.message,
        completedAt: new Date(),
      },
    }).catch((dbError) => {
      console.error("Could not update failed job:", dbError);
    });
  }
});

worker.on("error", (error) => {
  console.error("Worker error:", error);
});

console.log("InfraPilot provisioning worker started");

async function shutdown() {
  console.log("Shutting down provisioning worker...");

  await worker.close();
  await redis.quit();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);