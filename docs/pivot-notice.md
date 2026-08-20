Day 4 Pivot Notice — Solstice Events Async Check-In

Pivot Event

Client: Solstice Events Co.
Project: Event Check-In Kiosk Service
Sprint: Day 4 — Meridian Pivot Simulation

Solstice Events Co. is running a multi-day technology conference and requires an event check-in kiosk service. Staff scan an attendee's QR code to initiate the badge-printing and check-in process.

Original Client Requirement

The original solution was based on a synchronous badge-printer REST API.

The expected workflow was:

QR Code Scan → Badge Printer REST API → Wait for Print Success → Show "Checked In"

The application had to wait for the printer's success response before completing the check-in process.

The solution also had to correctly handle at least three test attendees, including a duplicate-scan scenario where an attendee who had already been checked in must not receive a second badge.

Pivot Description

Solstice Events Co.'s badge-printer vendor is deprecating the synchronous printing API with no extension to the project deadline.

The kiosk service must therefore be rebuilt using an asynchronous architecture.

Instead of calling the printer and waiting for an immediate response, the application must:

1. Create a print request.
2. Publish the request to the vendor's message queue.
3. Keep the attendee in a pending state while printing is in progress.
4. Expose a webhook endpoint to receive the printer's completion callback.
5. Change the attendee's status to "CHECKED_IN" only after successful printer confirmation.

New Required Model

QR Scan → Check Duplicate → Print Request Queue → PENDING → Printer Processing → Webhook Confirmation → CHECKED_IN

The UI must no longer show "Checked In" immediately after the scan. It must display or represent a pending state until the webhook confirms that the badge-printing job has successfully completed.

Impact of the Pivot

Dropped

- Synchronous badge-printer REST API workflow.
- Waiting for an immediate printer response.
- Immediate "CHECKED_IN" status after scanning.

Modified

- Check-in processing is now asynchronous.
- Badge-print requests are placed on a queue.
- Attendee status changes from "NOT_CHECKED_IN" to "PENDING" while printing is in progress.
- Successful webhook confirmation changes the status from "PENDING" to "CHECKED_IN".

Added

- Asynchronous print-job queue.
- Unique print-job IDs.
- Printer completion webhook endpoint.
- Webhook authentication/secret validation.
- Job-to-attendee validation.
- Protection against duplicate webhook confirmations.
- Support for confirmations arriving out of order.

Unchanged

- QR-code-based attendee check-in.
- At least three test attendees.
- Duplicate-scan protection.
- Successful badge printing remains a prerequisite for final check-in.

Duplicate-Scan Requirement

Duplicate scanning must continue to be prevented under the asynchronous model.

An attendee who is already "PENDING" or "CHECKED_IN" must not receive another print request.

This ensures that an attendee cannot receive a second badge because of repeated scanning.

Out-of-Order Confirmation Requirement

Printer confirmations may arrive in a different order from the order in which attendees were scanned.

The application must therefore track each print job independently using a unique "jobId".

A successful webhook confirmation must update only the attendee associated with that specific print job.

Verification Requirements

The completed solution must verify that:

1. At least three attendees can be processed.
2. A scan creates an asynchronous print request.
3. The attendee enters the "PENDING" state.
4. The attendee does not become "CHECKED_IN" before printer confirmation.
5. Duplicate scans are rejected.
6. A valid printer webhook changes "PENDING" to "CHECKED_IN".
7. Invalid webhook authentication is rejected.
8. A webhook must match the correct attendee and print job.
9. Duplicate webhook confirmations are protected.
10. Webhook confirmations can arrive out of order without affecting other attendees.

Final Pivot Outcome

The synchronous badge-printing workflow has been replaced with an asynchronous queue-and-webhook model.

The new implementation preserves the core business rule:

An attendee is considered checked in only after successful badge printing has been confirmed.

The pivot allows Solstice Events Co. to continue meeting the original check-in requirements despite the deprecation of the synchronous printer API.