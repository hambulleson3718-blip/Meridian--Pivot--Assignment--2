const jobs = {};

function showMessage(message) {
  document.getElementById("message").textContent = message;
}

async function checkIn(attendeeId) {
  try {
    const response = await fetch(`/checkin/${attendeeId}`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Check-in failed");
      return;
    }

    jobs[attendeeId] = data.jobId;

    document.getElementById(
      `status-${attendeeId}`
    ).textContent = "PENDING";

    showMessage(
      `${attendeeId} is pending. Print Job: ${data.jobId}`
    );
  } catch (error) {
    showMessage("Server connection error");
  }
}

async function refreshStatus(attendeeId) {
  try {
    const response = await fetch(`/attendee/${attendeeId}`);

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Unable to get attendee status");
      return;
    }

    document.getElementById(
      `status-${attendeeId}`
    ).textContent = data.status;

    showMessage(
      `${attendeeId}: ${data.status}`
    );
  } catch (error) {
    showMessage("Server connection error");
  }
}

async function processQueue() {
  try {
    const response = await fetch("/queue/process", {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Queue processing failed");
      return;
    }

    if (!data.jobId) {
      showMessage(data.message);
      return;
    }

    showMessage(
      `Processing badge for ${data.attendeeId}. Waiting for printer confirmation...`
    );

    // Simulate asynchronous printer completion
    setTimeout(async () => {
      await confirmPrint(
        data.jobId,
        data.attendeeId
      );
    }, 1500);

  } catch (error) {
    showMessage("Server connection error");
  }
}

async function confirmPrint(jobId, attendeeId) {
  try {
    const response = await fetch(
      "/webhook/print-complete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-secret": "solstice-demo-secret"
        },
        body: JSON.stringify({
          jobId: jobId,
          attendeeId: attendeeId,
          success: true
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.error || "Print confirmation failed");
      return;
    }

    document.getElementById(
      `status-${attendeeId}`
    ).textContent = "CHECKED_IN";

    showMessage(
      `${attendeeId} badge printed successfully. CHECKED IN.`
    );

  } catch (error) {
    showMessage("Webhook confirmation error");
  }
}