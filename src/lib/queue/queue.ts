import { Job, Queue } from "bullmq";
import IORedis from "ioredis";

export const initializeQueue = async (name: string) => {
  const redisURL = process.env.VALQUERYQUEUE_URL || "";
  const rateLimitQueue = new Queue(name, {
    connection: new IORedis(redisURL, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      tls: {},
    }),
  });

  await rateLimitQueue.drain();

  rateLimitQueue.on("progress", (job) => {
    console.log(`Job ${job.id} is ${job.progress}% done`);
  });

  rateLimitQueue.on("error", (error) => {
    console.error(`Queue error: ${error}`);
  });

  rateLimitQueue.on("waiting", (job) => {
    console.log(`Job ${job.id} added`);
  });
  return rateLimitQueue;
};

export const removeJob = async (job?: Job) => {
  console.log(`Removing job for ${job?.id}..`);
  await job?.remove();
  console.log("Job removed!");
};
