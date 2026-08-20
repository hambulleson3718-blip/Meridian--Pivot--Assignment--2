# Scope Delta — Solstice Events Async Check-In Pivot

## Original Scope

The original kiosk requirement used a synchronous badge-printer REST API.

The intended flow was:

QR Scan → REST Printer API → Wait for Print Success → Show "Checked In"

The kiosk had to support at least three test attendees and prevent duplicate badge printing.

## Pivot Event

Solstice Events Co. announced that the synchronous badge-printer API was being deprecated with no deadline extension.

The solution therefore had to move to an asynchronous architecture.

## Dropped Scope

- Synchronous badge-printer REST API.
- Waiting for an immediate printer response.
- Showing "Checked In" immediately after the scan.
- Original inventory polling implementation from the earlier prototype.

## Added Scope

- Asynchronous print-request queue.
- POST /checkin/:attendeeId endpoint.
- PENDING attendee state.
- POST /webhook/print-complete callback endpoint.
- Webhook secret verification.
- Print-job IDs.
- Job-to-attendee matching.
- Duplicate-scan protection.
- Out-of-order webhook confirmation handling.

## Modified Scope

The attendee check-in workflow was changed from a synchronous process to an asynchronous process.

The new flow is:

QR Scan → Duplicate Check → Queue Print Request → PENDING → Printer Completion Webhook → CHECKED_IN

## Acceptance Criteria

The implementation demonstrates:

1. At least three test attendees.
2. Successful initial check-in requests.
3. Pending status before printer confirmation.
4. Duplicate scan rejection.
5. Asynchronous queue processing.
6. Successful webhook confirmation.
7. Checked-in status only after successful confirmation.
8. Protection against incorrect job-to-attendee matching.
9. Handling of webhook confirmations arriving out of order.

## Trade-offs

The prototype uses an in-memory queue and attendee store rather than production infrastructure.

This keeps the demonstration simple while showing the required asynchronous architecture.

## Production Gaps

Before production deployment, the service would require:

- A production message broker such as RabbitMQ or a managed queue.
- Persistent attendee storage.
- Strong webhook authentication/signature verification.
- Retry and dead-letter handling.
- Idempotency persistence.
- Monitoring and alerting.
- Production deployment configuration.

## Final Outcome

The mandatory pivot was implemented without changing the core business requirement: an attendee receives a badge only after the printer confirms successful completion.

The implementation now supports asynchronous processing while maintaining duplicate-scan protection.