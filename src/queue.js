const printQueue = [];

function publishPrintRequest(job) {
  printQueue.push(job);

  console.log(
    "Print request queued: " +
      job.jobId +
      " for " +
      job.attendeeId
  );
}

function getNextPrintJob() {
  return printQueue.shift() || null;
}

module.exports = {
  publishPrintRequest,
  getNextPrintJob
};