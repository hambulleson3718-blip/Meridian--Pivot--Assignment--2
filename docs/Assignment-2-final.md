  Assignment 2 Final Deliverable — The Meridian Pivot

## 1. Project Overview

*Client:* Northstar Retail Co.  
*Project:* Inventory Sync Service  
*Assignment:* The Meridian Pivot — Assignment 2

The objective was to build an inventory synchronization service and then adapt the implementation to a mandatory client requirement change during the sprint.

---

## 2. Original Day 3 Specification

The original requirement was to:

- Poll the warehouse API every five minutes.
- Cache inventory stock.
- Expose an endpoint for support staff to query stock availability.

### Original Architecture

Warehouse API → Poller → Stock Cache → Query Endpoint

The Day 3 implementation successfully provided the polling, caching, and stock query functionality.

---

## 3. Day 4 Pivot

On Day 4, the client announced that the polling method would be discontinued within 48 hours.

The deadline could not be extended and the original polling approach could not remain as the active solution.

The implementation therefore had to change from polling to webhook-based inventory updates.

Supporting documentation:

- docs/pivot-notice.md
- docs/scope-delta.md

---

## 4. New Architecture

The new implementation uses a webhook to receive inventory updates.

### New Architecture

Warehouse → Webhook Endpoint → Stock Cache → Query Endpoint

The webhook endpoint is:

POST /webhook/inventory

The existing query endpoint remains:

GET /stock/:sku

---

## 5. Implementation Changes

### Removed

- src/poller.js
- Five-minute polling using setInterval()
- Automatic warehouse polling on server startup

### Modified

- src/server.js
- Added webhook request handling
- Added JSON request-body processing
- Added inventory update validation

### Preserved

- src/cache.js
- Stock cache functionality
- GET /stock/:sku
- Stock availability calculation
- Existing inventory SKU structure

---

## 6. Testing and Regression Checks

The new webhook implementation was tested using inventory updates.

### Test 1 — Stock Update

Inventory update:

NS-001 → 40 units

Result:

- Webhook accepted the update.
- Cache was updated.
- GET /stock/NS-001 returned 40 units.
- Product was reported as available.

### Test 2 — Out-of-Stock Product

Inventory update:

NS-003 → 0 units

Result:

- Webhook accepted the update.
- Cache was updated.
- GET /stock/NS-003 returned 0 units.
- Product was reported as unavailable.

### Test 3 — Invalid Stock

Inventory update:

NS-004 → -10 units

Result:

- Request was rejected.
- HTTP 400 response was returned.
- Invalid inventory data was not added to the cache.

### Regression Result

The existing GET /stock/:sku functionality continued to work after the polling-to-webhook refactor.

---

## 7. Scope Delta

### Dropped

- Five-minute warehouse polling.
- src/poller.js.
- Automatic polling schedule.

### Added

- POST /webhook/inventory
- Webhook JSON processing.
- Webhook payload validation.

### Modified

- src/server.js
- Inventory update flow.

### Reprioritized

The priority changed from maintaining periodic polling to implementing and validating webhook-based inventory updates within the same deadline.

---

## 8. Architectural Integrity

The stock cache and query interface were preserved while the inventory update mechanism was replaced.

This limited the impact of the pivot and avoided unnecessary changes to the existing query functionality.

The obsolete polling component was removed rather than left running alongside the new webhook implementation.

---

## 9. Trade-offs

### Benefits

- Removes dependency on five-minute polling.
- Allows inventory updates to be received through events.
- Eliminates unnecessary repeated polling.
- Preserves the existing stock query interface.

### Costs and Limitations

- The prototype does not implement webhook signature authentication.
- The stock cache is stored in memory.
- Cached data is lost when the Node.js process stops.
- Production deployment would require additional reliability, security, persistence, and monitoring.

---

## 10. Production Gaps

Before production deployment, the following would need further implementation:

- Webhook authentication/signature verification.
- Persistent inventory storage.
- Retry and failure handling.
- Webhook event logging.
- Monitoring and alerting.
- Duplicate-event handling/idempotency.
- Production deployment configuration.

These items were outside the immediate sprint scope.

---

## 11. GitHub Evidence

The implementation was developed using a dedicated Day 4 pivot branch and reviewed through a pull request.

The Git history demonstrates:

1. Original Day 3 polling implementation.
2. Day 4 pivot documentation.
3. Webhook implementation.
4. Removal of obsolete polling code.
5. Scope Delta documentation.
6. Pull request review and merge.

---

## 12. Final Outcome

The original polling-based inventory synchronization service was successfully adapted to the new webhook-based requirement without extending the deadline.

The revised implementation:

- Receives inventory updates through a webhook.
- Updates the stock cache.
- Continues to provide stock queries.
- Rejects invalid inventory values.
- Removes the obsolete polling implementation.
- Documents the scope changes and production limitations.
