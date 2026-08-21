const printQueue = [];
const completedJobs = new Map();

function addPrintJob(job) {
  printQueue.push(job);

  // Keep a record so the webhook can find the job
  completedJobs.set(job.jobId, job);
}

function removeJob() {
  return printQueue.shift();
}

function getJob(jobId) {
  return completedJobs.get(jobId);
}

module.exports = {
  addPrintJob,
  removeJob,
  getJob
};