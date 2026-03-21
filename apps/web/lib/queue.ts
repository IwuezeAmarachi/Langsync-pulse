import { Queue } from "bullmq";
import IORedis from "ioredis";

let _connection: IORedis | null = null;
let _queue: Queue | null = null;

function getConnection(): IORedis {
  if (!_connection) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("REDIS_URL is not set");
    _connection = new IORedis(url, { maxRetriesPerRequest: null });
  }
  return _connection;
}

export function getAnalysisQueue(): Queue {
  if (!_queue) {
    _queue = new Queue("analyse_capture", { connection: getConnection() });
  }
  return _queue;
}
