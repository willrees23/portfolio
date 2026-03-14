const jobs = new Map();

export function createJob(jobId, data) {
  jobs.set(jobId, {
    ...data,
    status: "processing",
    progress: 0,
    error: null,
    outputUrl: null,
    createdAt: Date.now(),
  });
}

export function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function cleanupJobs() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (job.createdAt < oneHourAgo) {
      jobs.delete(id);
    }
  }
}
