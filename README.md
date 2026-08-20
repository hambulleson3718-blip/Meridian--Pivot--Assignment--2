Solstice Events — Async Check-In Service

Project Overview

This project is a prototype event check-in kiosk service developed for Solstice Events Co., a company running a multi-day technology conference.

The service handles attendee check-in and badge printing using an asynchronous queue-and-webhook architecture.

Day 4 Pivot

The original solution depended on a synchronous badge-printer REST API.

The printer vendor deprecated that API, requiring the solution to be redesigned around asynchronous processing.

Original Model

QR Scan
   ↓
Synchronous Printer API
   ↓
Wait for Print Success
   ↓
CHECKED_IN

New Model

QR Scan
   ↓
Duplicate Check
   ↓
Print Request
   ↓
Message Queue
   ↓
PENDING
   ↓
Printer Completion Webhook
   ↓
CHECKED_IN

The attendee is only marked as "CHECKED_IN" after successful printer confirmation.

Main Features

- QR-code-based attendee check-in simulation.
- Asynchronous print-job queue.
- Unique print-job IDs.
- "PENDING" attendee state.
- "CHECKED_IN" attendee state.
- Duplicate-scan protection.
- Printer completion webhook.
- Webhook secret validation.
- Job-to-attendee validation.
- Protection against duplicate webhook confirmations.
- Support for out-of-order print confirmations.
- Public deployment using Render.

Project Structure

assignment-2/
│
├── docs/
│   ├── pivot-notice.md
│   ├── scope-delta.md
│   └── assignment-2-final.md
│
├── src/
│   ├── attendees.js
│   ├── queue.js
│   └── server.js
│
├── tests/
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md

API Endpoints

Service Health

GET /

Returns the service status and available endpoints.

Start Check-In

POST /checkin/:attendeeId

Creates an asynchronous print job and changes the attendee to "PENDING".

Example:

POST /checkin/ATT-001

Process Print Queue

POST /queue/process

Processes a pending print job in the prototype queue.

Printer Completion Webhook

POST /webhook/print-complete

Receives confirmation that a badge-printing job has completed.

The request requires the configured webhook secret.

Get Attendee Status

GET /attendee/:attendeeId

Returns the current attendee status.

Attendee States

The prototype uses the following states:

NOT_CHECKED_IN
       ↓
    PENDING
       ↓
  CHECKED_IN

An attendee cannot receive another print request while "PENDING" or "CHECKED_IN".

Testing

The implementation was tested with at least three attendees:

- "ATT-001"
- "ATT-002"
- "ATT-003"

Testing verified:

- Successful check-in request.
- Transition to "PENDING".
- Successful print completion webhook.
- Transition to "CHECKED_IN".
- Duplicate-scan protection.
- Webhook authentication.
- Job-to-attendee matching.
- Out-of-order webhook confirmations.

Running Locally

Install dependencies:

npm install

Start the service:

npm start

The local service runs on:

http://localhost:3000/

The service homepage displays the current service status.

Deployment

The prototype is deployed as a Node.js web service on Render.

Live service:

https://meridian-pivot-assignment-2.onrender.com/

Environment Variables

The webhook secret should be configured as an environment variable:

WEBHOOK_SECRET

For local development, the prototype has a demo fallback secret.

Production deployments should use a securely configured environment variable rather than storing secrets in source code.

Production Considerations

This prototype uses in-memory attendee and queue data for demonstration purposes.

A production implementation should use:

- Persistent database storage.
- A production message broker.
- Retry handling.
- Dead-letter queues.
- Persistent idempotency records.
- Strong webhook signature verification.
- Monitoring and alerting.
- Secure environment-variable management.

Final Outcome

The Day 4 pivot successfully replaces the deprecated synchronous printer integration with an asynchronous queue-and-webhook architecture.

The core business rule remains unchanged:

«An attendee is considered checked in only after successful badge printing has been confirmed.»

The prototype demonstrates the required asynchronous workflow while maintaining duplicate-scan protection and handling webhook confirmations that may arrive out of order.