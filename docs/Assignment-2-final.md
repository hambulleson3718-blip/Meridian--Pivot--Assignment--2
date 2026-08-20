 Assignment 2 Final Deliverable — Solstice Events Async Check-In Pivot

## 1. Project Overview

*Client:* Solstice Events Co.  
*Project:* Event Check-In Kiosk Service  
*Assignment:* The Meridian Pivot — Assignment 2

The objective was to build a kiosk service for checking conference attendees in and coordinating badge printing.

The service was required to support at least three attendees and prevent duplicate badge printing.

---

## 2. Original Requirement

The original requirement used a synchronous badge-printer REST API.

The original flow was:

QR Scan → Printer REST API → Wait for Success → Checked In

The kiosk could only display "Checked In" after the badge printer confirmed successful printing.

---

## 3. Day 4 Pivot

The badge-printer vendor announced that the synchronous printing API was being deprecated.

There was no extension to the deadline.

The solution therefore had to be rebuilt around an asynchronous model.

The new requirement was to:

- Publish print requests to a message queue.
- Expose a webhook endpoint.
- Receive printer completion callbacks.
- Keep the attendee in a pending state until confirmation.
- Continue preventing duplicate badge printing.
- Handle confirmations arriving out of order.

---

## 4. New Architecture

The implemented flow is:

QR Scan
↓
Duplicate Check
↓
Create Print Job
↓
Publish to Queue
↓
PENDING
↓
Printer Processes Job
↓
Webhook Confirmation
↓
CHECKED_IN

The kiosk no longer waits for an immediate printer response.

---

## 5. Implementation

### Attendee Management

src/attendees.js

The attendee store maintains:

- Attendee ID
- Attendee name
- Check-in status
- Active print-job ID

Supported states include:

- NOT_CHECKED_IN
- PENDING
- CHECKED_IN

### Message Queue

src/queue.js

The queue stores print requests asynchronously.

Each print request contains:

- jobId
- attendeeId

### Server

src/server.js

The server provides:

- POST /checkin/:attendeeId
- POST /queue/process
- POST /webhook/print-complete
- GET /attendee/:attendeeId

---

## 6. Duplicate Scan Protection

When an attendee is scanned, the service checks the current state.

If the attendee is already PENDING or CHECKED_IN, the service rejects the duplicate request.

This prevents a second badge-print request from being created.

---

## 7. Webhook Protection

The webhook requires a secret header.

The service also validates:

- Attendee existence.
- Print-job existence.
- Job ID matches the attendee's active job.
- Attendee is currently PENDING.
- Print completion reports success.
- Already checked-in attendees cannot be checked in again.

---

## 8. Testing

### Test Attendees

The prototype includes:

- ATT-001 — Alice Johnson
- ATT-002 — Brian Otieno
- ATT-003 — Carol Wanjiku

### Test Results

#### ATT-001

Initial scan:

NOT_CHECKED_IN → PENDING

Duplicate scan:

409 Conflict

After successful printer webhook:

PENDING → CHECKED_IN

#### ATT-002

Initial scan:

NOT_CHECKED_IN → PENDING

After successful webhook:

PENDING → CHECKED_IN

#### ATT-003

Initial scan:

NOT_CHECKED_IN → PENDING

After successful webhook:

PENDING → CHECKED_IN

---

## 9. Out-of-Order Confirmation Test

The implementation was tested with multiple pending attendees.

The printer completion confirmations were deliberately received out of order.

ATT-003 was confirmed before ATT-002.

Both attendees were independently updated to:

CHECKED_IN

This demonstrates that confirmation order does not incorrectly affect another attendee's state.

---

## 10. Final Acceptance Criteria

| Requirement | Result |
|---|---|
| At least 3 test attendees | Passed |
| Asynchronous print requests | Passed |
| Pending state | Passed |
| Checked In only after confirmation | Passed |
| Duplicate-scan protection | Passed |
| Webhook callback | Passed |
| Job-to-attendee validation | Passed |
| Out-of-order confirmation…