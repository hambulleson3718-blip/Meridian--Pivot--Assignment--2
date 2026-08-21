const attendees = {
  "ATT-001": {
    attendeeId: "ATT-001",
    name: "Attendee 001",
    status: "NOT_CHECKED_IN",
    jobId: null
  },

  "ATT-002": {
    attendeeId: "ATT-002",
    name: "Attendee 002",
    status: "NOT_CHECKED_IN",
    jobId: null
  },

  "ATT-003": {
    attendeeId: "ATT-003",
    name: "Attendee 003",
    status: "NOT_CHECKED_IN",
    jobId: null
  }
};

function getAttendee(attendeeId) {
  return attendees[attendeeId];
}

function setPending(attendeeId, jobId) {
  if (!attendees[attendeeId]) {
    return false;
  }

  attendees[attendeeId].status = "PENDING";
  attendees[attendeeId].jobId = jobId;

  return true;
}

function setCheckedIn(attendeeId) {
  if (!attendees[attendeeId]) {
    return false;
  }

  attendees[attendeeId].status = "CHECKED_IN";

  return true;
}

module.exports = {
  getAttendee,
  setPending,
  setCheckedIn
};