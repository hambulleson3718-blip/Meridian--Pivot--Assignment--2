const attendees = {
  "ATT-001": {
    name: "Alice Johnson",
    status: "NOT_CHECKED_IN",
    jobId: null
  },

  "ATT-002": {
    name: "Brian Otieno",
    status: "NOT_CHECKED_IN",
    jobId: null
  },

  "ATT-003": {
    name: "Carol Wanjiku",
    status: "NOT_CHECKED_IN",
    jobId: null
  }
};

function getAttendee(attendeeId) {
  return attendees[attendeeId] || null;
}

function updateStatus(attendeeId, status) {
  if (attendees[attendeeId]) {
    attendees[attendeeId].status = status;
  }
}

function assignJob(attendeeId, jobId) {
  if (attendees[attendeeId]) {
    attendees[attendeeId].jobId = jobId;
  }
}

module.exports = {
  getAttendee,
  updateStatus,
  assignJob
};