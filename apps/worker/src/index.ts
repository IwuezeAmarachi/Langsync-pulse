import { Worker } from "bullmq";
import IORedis from "ioredis";
import { processAnalyseCapture, type AnalyseCaptureJobData } from "./jobs/analyse-capture";

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn("REDIS_URL is not set. Worker will not start.");
  process.exit(0);
}

const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

const worker = new Worker<AnalyseCaptureJobData>(
  "analyse_capture",
  async (job) => {
    return processAnalyseCapture(job.data);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job completed: ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job failed: ${job?.id}`, err.message);
});

console.log("LangSync worker started");
