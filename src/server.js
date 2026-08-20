const http = require("node:http");
const crypto = require("node:crypto");

const {
  getAttendee,
  updateStatus,
  assignJob
} = require("./attendees");

const {
  publishPrintRequest,
  getNextPrintJob
} = require("./queue");

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET || "solstice-demo-secret";

function createJobId() {
  return crypto.randomUUID();
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json"
  });

  res.end(JSON.stringify(data));
}

function readJsonBody(req, callback) {
  let body = "";

  req.on("data", function (chunk) {
    body += chunk.toString();
  });

  req.on("end", function () {
    try {
      callback(null, JSON.parse(body));
    } catch (error) {
      callback(error);
    }
  });
}

const server = http.createServer(function (req, res) {
  console.log("Request:", req.method, req.url);

  // 1. ATTENDEE CHECK-IN
  if (req.method === "POST" && req.url.startsWith("/checkin/")) {
    const attendeeId = req.url.split("/")[2];
    const attendee = getAttendee(attendeeId);

    if (!attendee) {
      return sendJson(res, 404, {
        error: "Attendee not found"
      });
    }

    // Prevent duplicate scans
    if (attendee.status !== "NOT_CHECKED_IN") {
      return sendJson(res, 409, {
        error:
          "Duplicate scan: attendee is already pending or checked in",
        attendeeId: attendeeId,
        status: attendee.status
      });
    }

    const jobId = createJobId();

    // Save the job against the attendee
    assignJob(attendeeId, jobId);

    // Mark attendee pending BEFORE publishing the print request
    updateStatus(attendeeId, "PENDING");

    publishPrintRequest({
      jobId: jobId,
      attendeeId: attendeeId
    });

    return sendJson(res, 202, {
      message: "Check-in accepted; badge printing is pending",
      attendeeId: attendeeId,
      status: "PENDING",
      jobId: jobId
    });
  }

  // 2. PROCESS NEXT QUEUED PRINT JOB
  if (req.method === "POST" && req.url === "/queue/process") {
    const job = getNextPrintJob();

    if (!job) {
      return sendJson(res, 404, {
        error: "No print jobs waiting"
      });
    }

    console.log(
      "Processing print job " +
        job.jobId +
        " for " +
        job.attendeeId
    );

    return sendJson(res, 202, {
      message: "Print job handed to asynchronous worker",
      jobId: job.jobId,
      attendeeId: job.attendeeId
    });
  }

  // 3. PRINTER VENDOR WEBHOOK
  if (
    req.method === "POST" &&
    req.url === "/webhook/print-complete"
  ) {
    const receivedSecret = req.headers["x-webhook-secret"];

    if (receivedSecret !== WEBHOOK_SECRET) {
      return sendJson(res, 401, {
        error: "Unauthorized: invalid webhook secret"
      });
    }

    return readJsonBody(req, function (error, data) {
      if (error) {
        return sendJson(res, 400, {
          error: "Invalid JSON payload"
        });
      }

      const jobId = data.jobId;
      const attendeeId = data.attendeeId;
      const success = data.success;

      if (!jobId || !attendeeId || success !== true) {
        return sendJson(res, 400, {
          error: "Invalid print completion payload"
        });
      }

      const attendee = getAttendee(attendeeId);

      if (!attendee) {
        return sendJson(res, 404, {
          error: "Attendee not found"
        });
      }

      // Prevent duplicate webhook confirmations
      if (attendee.status === "CHECKED_IN") {
        return sendJson(res, 409, {
          error: "Attendee is already checked in",
          attendeeId: attendeeId,
          status: attendee.status
        });
      }

      // Webhook must match the job assigned to this attendee
      if (attendee.jobId !== jobId) {
        return sendJson(res, 409, {
          error: "Job does not match attendee's active print job",
          attendeeId: attendeeId,
          expectedJobId: attendee.jobId,
          receivedJobId: jobId
        });
      }

      // Only a PENDING attendee can become CHECKED_IN
      if (attendee.status !== "PENDING") {
        return sendJson(res, 409, {
          error: "Attendee is not waiting for print confirmation",
          attendeeId: attendeeId,
          status: attendee.status
        });
      }

      // Successful printer confirmation
      updateStatus(attendeeId, "CHECKED_IN");

      return sendJson(res, 200, {
        message: "Print completion received",
        attendeeId: attendeeId,
        status: "CHECKED_IN",
        jobId: jobId
      });
    });
  }

  // 4. CHECK ATTENDEE STATUS
  if (
    req.method === "GET" &&
    req.url.startsWith("/attendee/")
  ) {
    const attendeeId = req.url.split("/")[2];
    const attendee = getAttendee(attendeeId);

    if (!attendee) {
      return sendJson(res, 404, {
        error: "Attendee not found"
      });
    }

    return sendJson(res, 200, {
      attendeeId: attendeeId,
      name: attendee.name,
      status: attendee.status,
      jobId: attendee.jobId
    });
  }

  // 5. UNKNOWN ROUTE
  sendJson(res, 404, {
    error: "Not Found"
  });
});

server.listen(PORT, function () {
  console.log(
    "Solstice check-in service running at http://localhost:" +
      PORT
  );
});
