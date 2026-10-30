import { Queue } from "bullmq";
import redis from "../lib/redis.js";

export interface ProvisioningJobData {
  provisioningJobId: string;
}

export const provisioningQueue =
  new Queue<ProvisioningJobData>("provisioning", {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 100,
    },
  });