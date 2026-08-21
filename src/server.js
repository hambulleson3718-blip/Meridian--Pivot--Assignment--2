const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const {
  getAttendee,
  setPending,
  setCheckedIn
} = require("./attendees");

const {
  addPrintJob,
  getJob,
  removeJob
} = require("./queue");

const PORT = process.env.PORT || 3000;
const WEBHOOK_SECRET =
  process.env.WEBHOOK_SECRET || "solstice-demo-secret";

const server = http.createServer((req, res) => {
  console.log("Request:", req.method, req.url);

  // ==========================================
  // SERVE DEMO WEB APP
  // ==========================================

  if (req.method === "GET" && req.url === "/") {
    const filePath = path.join(
      __dirname,
      "../public/index.html"
    );

    fs.readFile(filePath, (error, data) => {
      if (error) {
        console.error(error);

        res.writeHead(500, {
          "Content-Type": "text/plain"
        });

        res.end("Unable to load demo application");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "text/html"
      });

      res.end(data);
    });

    return;
  }

  // ==========================================
  // SERVE FRONTEND JAVASCRIPT
  // ==========================================

  if (req.method === "GET" && req.url === "/app.js") {
    const filePath = path.join(
      __dirname,
      "../public/app.js"
    );

    fs.readFile(filePath, (error, data) => {
      if (error) {
        console.error(error);

        res.writeHead(500, {
          "Content-Type": "text/plain"
        });

        res.end("Unable to load application JavaScript");
        return;
      }

      res.writeHead(200, {
        "Content-Type": "application/javascript"
      });

      res.end(data);
    });

    return;
  }

  // ==========================================
  // GET ATTENDEE STATUS
  // GET /attendee/:attendeeId
  // ==========================================

  if (
    req.method === "GET" &&
    req.url.startsWith("/attendee/")
  ) {
    const attendeeId = req.url.split("/")[2];

    const attendee = getAttendee(attendeeId);

    if (!attendee) {
      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          error: "Attendee not found"
        })
      );

      return;
    }

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(JSON.stringify(attendee));

    return;
  }

  // ==========================================
  // START CHECK-IN
  // POST /checkin/:attendeeId
  // ==========================================

  if (
    req.method === "POST" &&
    req.url.startsWith("/checkin/")
  ) {
    const attendeeId = req.url.split("/")[2];

    const attendee = getAttendee(attendeeId);

    if (!attendee) {
      res.writeHead(404, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          error: "Attendee not found"
        })
      );

      return;
    }

    // Prevent duplicate badge requests
    if (
      attendee.status === "PENDING" ||
      attendee.status === "CHECKED_IN"
    ) {
      res.writeHead(409, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          error: "Attendee is already pending or checked in",
          attendeeId: attendeeId,
          status: attendee.status
        })
      );

      return;
    }

    // Create a unique print job
    const jobId = randomUUID();

    // Change attendee status to pending
    setPending(attendeeId, jobId);

    // Add job to print queue
    addPrintJob({
      jobId,
      attendeeId
    });

    console.log(
      `Print job ${jobId} created for ${attendeeId}`
    );

    res.writeHead(202, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        message: "Check-in request accepted",
        attendeeId,
        jobId,
        status: "PENDING"
      })
    );

    return;
  }

  // ==========================================
  // PROCESS PRINT QUEUE
  // POST /queue/process
  // ==========================================

  if (
    req.method === "POST" &&
    req.url === "/queue/process"
  ) {
    const job = removeJob();

    if (!job) {
      res.writeHead(200, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          message: "No pending print jobs"
        })
      );

      return;
    }

    console.log(
      `Processing print job ${job.jobId} for ${job.attendeeId}`
    );

    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify({
        message: "Print job processed",
        jobId: job.jobId,
        attendeeId: job.attendeeId
      })
    );

    return;
  }

  // ==========================================
  // PRINTER COMPLETION WEBHOOK
  // POST /webhook/print-complete
  // ==========================================

  if (
    req.method === "POST" &&
    req.url === "/webhook/print-complete"
  ) {
    const receivedSecret =
      req.headers["x-webhook-secret"];

    // Verify webhook secret
    if (receivedSecret !== WEBHOOK_SECRET) {
      console.log("Webhook verification failed");

      res.writeHead(401, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          error: "Unauthorized: invalid webhook secret"
        })
      );

      return;
    }

    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const data = JSON.parse(body);

        const {
          jobId,
          attendeeId,
          success
        } = data;

        // Validate payload
        if (!jobId || !attendeeId || success !== true) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Invalid webhook payload"
            })
          );

          return;
        }

        // Find the print job
        const job = getJob(jobId);

        if (!job) {
          res.writeHead(404, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Print job not found"
            })
          );

          return;
        }

        // Verify that the job belongs to the attendee
        if (job.attendeeId !== attendeeId) {
          res.writeHead(400, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Job does not belong to attendee"
            })
          );

          return;
        }

        const attendee = getAttendee(attendeeId);

        if (!attendee) {
          res.writeHead(404, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Attendee not found"
            })
          );

          return;
        }

        // Safely handle duplicate webhook confirmations
        if (attendee.status === "CHECKED_IN") {
          res.writeHead(200, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              message: "Attendee already checked in",
              attendeeId,
              status: "CHECKED_IN"
            })
          );

          return;
        }

        // Reject stale or incorrect jobs
        if (
          attendee.status !== "PENDING" ||
          attendee.jobId !== jobId
        ) {
          res.writeHead(409, {
            "Content-Type": "application/json"
          });

          res.end(
            JSON.stringify({
              error: "Invalid or stale print job",
              attendeeId,
              status: attendee.status
            })
          );

          return;
        }

        // Printer has confirmed successful completion
        setCheckedIn(attendeeId);

        console.log(
          `Solstice check-in completed for ${attendeeId}`
        );

        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(
          JSON.stringify({
            message: "Print completion received successfully",
            attendeeId,
            jobId,
            status: "CHECKED_IN"
          })
        );
      } catch (error) {
        console.error(error);

        res.writeHead(400, {
          "Content-Type": "application/json"
        });

        res.end(
          JSON.stringify({
            error: "Invalid JSON payload"
          })
        );
      }
    });

    return;
  }

  // ==========================================
  // UNKNOWN ROUTE
  // ==========================================

  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify({
      error: "Not Found"
    })
  );
});

// ==========================================
// START SERVER
// ==========================================

server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Solstice check-in service running on port ${PORT}`
  );
});