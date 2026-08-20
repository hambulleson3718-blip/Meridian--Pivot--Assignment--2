const http = require("node:http");
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

  // --------------------------------------------------
  // Homepage
  // --------------------------------------------------
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });

    res.end(
      JSON.stringify(
        {
          service: "Solstice Events Check-In Service",
          status: "Live",
          message: "Asynchronous badge printing service is running.",
          endpoints: {
            checkIn: "POST /checkin/:attendeeId",
            processQueue: "POST /queue/process",
            printWebhook: "POST /webhook/print-complete",
            attendeeStatus: "GET /attendee/:attendeeId"
          }
        },
        null,
        2
      )
    );

    return;
  }

  // --------------------------------------------------
  // Get attendee status
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Start check-in
  // --------------------------------------------------
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

    // Prevent duplicate scans
    if (
      attendee.status === "PENDING" ||
      attendee.status === "CHECKED_IN"
    ) {
      res.writeHead(409, {
        "Content-Type": "application/json"
      });

      res.end(
        JSON.stringify({
          error: "Attendee has already been checked in or is pending",
          attendeeId: attendeeId,
          status: attendee.status
        })
      );

      return;
    }

    const jobId = randomUUID();

    setPending(attendeeId, jobId);

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

  // --------------------------------------------------
  // Process queue
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Printer completion webhook
  // --------------------------------------------------
  if (
    req.method === "POST" &&
    req.url === "/webhook/print-complete"
  ) {
    const receivedSecret =
      req.headers["x-webhook-secret"];

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

        setCheckedIn(attendeeId);

        console.log(
          `Solstice check-in completed for ${attendeeId}`
        );
        res.writeHead(200, {
          "Content-Type": "application/json"
        });

        res.end(
          JSON.stringify({
            message: "Print completion received",
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

  // --------------------------------------------------
  // Unknown route
  // --------------------------------------------------
  res.writeHead(404, {
    "Content-Type": "application/json"
  });

  res.end(
    JSON.stringify({
      error: "Not Found"
    })
  );
});

// --------------------------------------------------
// Start server
// --------------------------------------------------
server.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Solstice check-in service running on port ${PORT}`
  );
});