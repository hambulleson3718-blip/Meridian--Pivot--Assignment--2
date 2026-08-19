 Scope Delta Analysis

## Project

Meridian Pivot — Northstar Retail Co. Inventory Sync Service

## Pivot Summary

The original Day 3 specification required the service to poll the warehouse API every five minutes, cache inventory data, and expose a stock query endpoint.

On Day 4, the client announced that the polling method would be discontinued within 48 hours. The implementation was therefore changed to a webhook-based inventory update model without extending the sprint deadline.

## Original Architecture

Warehouse API → Poller → Stock Cache → Query Endpoint

## New Architecture

Warehouse → Webhook Endpoint → Stock Cache → Query Endpoint

## Scope Changes

### Dropped

- Five-minute warehouse polling.
- src/poller.js.
- Automatic polling using setInterval().

### Modified

- src/server.js.
- Inventory updates are now received through POST /webhook/inventory.
- The cache is updated using updateStock().

### Added

- POST /webhook/inventory.
- JSON request parsing.
- Webhook payload validation.
- Rejection of invalid stock values.

### Unchanged

- src/cache.js.
- Stock cache behavior.
- GET /stock/:sku.
- Stock availability calculation.
- Inventory SKU structure.

## Reprioritized Backlog

| Priority | Item | Status |
|---|---|---|
| High | Replace polling with webhook updates | Completed |
| High | Keep stock query endpoint working | Completed |
| High | Remove obsolete polling code | Completed |
| High | Validate webhook payloads | Completed |
| Medium | Regression testing | Completed |
| Medium | Document scope delta | In progress |
| Low | Future persistent cache | Not part of current scope |

## Trade-offs

### Benefits

- Removes dependence on periodic polling.
- Inventory updates can be received immediately when an event is delivered.
- Eliminates the five-minute polling interval.
- Simplifies the active server flow.

### Costs

- The service now depends on the warehouse system delivering webhook events.
- Webhook authentication/signature verification is not implemented in this prototype.
- The cache remains in memory and is lost when the Node.js process stops.
- Additional production reliability and security work would be required before deployment.

## Regression Check

The existing GET /stock/:sku endpoint was tested after the webhook refactor.

Webhook update:

NS-001 → 40 units

Query result confirmed:

- SKU: NS-001
- Stock: 40
- Available: true

An out-of-stock update was also tested:

NS-003 → 0 units

The query endpoint returned:

- Stock: 0
- Available: false

Invalid negative stock input was rejected with a 400 response.

## Obsolete Code Removal

The previous polling implementation in src/poller.js was removed.

The server no longer starts an immediate warehouse poll and no longer schedules a five-minute polling interval.

## Final Assessment

The pivot was implemented without extending the original deadline. The new webhook-based approach meets the revised synchronization model while preserving the existing stock query interface.