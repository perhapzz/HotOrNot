import { BatchAnalysis, IBatchAnalysis } from "@hotornot/database";

const MAX_CONCURRENCY = 3;

/**
 * Process batch analysis items with concurrency control.
 * Calls the provided analyzer function for each item, max 3 in parallel.
 */
export async function processBatchJob(
  jobId: string,
  analyzer: (input: string, platform?: string) => Promise<{ resultId: string }>
) {
  const job = await BatchAnalysis.findOne({ jobId });
  if (!job) throw new Error(`Job ${jobId} not found`);

  job.status = "processing";
  await job.save();

  const pending = [...job.items].filter((item) => item.status === "pending");
  let activeCount = 0;
  let itemIndex = 0;

  await new Promise<void>((resolve) => {
    function processNext() {
      while (activeCount < MAX_CONCURRENCY && itemIndex < pending.length) {
        const item = pending[itemIndex++];
        activeCount++;

        (async () => {
          try {
            // Update item status to processing
            await BatchAnalysis.updateOne(
              { jobId, "items.index": item.index },
              {
                $set: {
                  "items.$.status": "processing",
                  "items.$.startedAt": new Date(),
                },
              }
            );

            const result = await analyzer(item.input, item.platform);

            await BatchAnalysis.updateOne(
              { jobId, "items.index": item.index },
              {
                $set: {
                  "items.$.status": "completed",
                  "items.$.resultId": result.resultId,
                  "items.$.completedAt": new Date(),
                },
                $inc: { completedItems: 1 },
              }
            );
          } catch (err: any) {
            await BatchAnalysis.updateOne(
              { jobId, "items.index": item.index },
              {
                $set: {
                  "items.$.status": "failed",
                  "items.$.error": err.message || "Unknown error",
                  "items.$.completedAt": new Date(),
                },
                $inc: { failedItems: 1 },
              }
            );
          } finally {
            activeCount--;
            if (activeCount === 0 && itemIndex >= pending.length) {
              resolve();
            } else {
              processNext();
            }
          }
        })();
      }

      // Edge case: no pending items
      if (pending.length === 0) resolve();
    }

    processNext();
  });

  // Finalize job
  const finalJob = await BatchAnalysis.findOne({ jobId });
  if (finalJob) {
    finalJob.status =
      finalJob.failedItems === finalJob.totalItems ? "failed" : "completed";
    finalJob.completedAt = new Date();
    await finalJob.save();
  }
}

/**
 * Generate a unique job ID
 */
export function generateJobId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
