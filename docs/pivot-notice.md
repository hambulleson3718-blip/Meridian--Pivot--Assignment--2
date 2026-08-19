# Day 4 Pivot Notice

## Client Requirement Change

Northstar Retail Co. has announced that the inventory polling method will be
discontinued within 48 hours.

The existing implementation polls the warehouse every five minutes. This method is no
longer acceptable under the revised requirement.

## Original Model

Warehouse API → Poller → Stock Cache → Query Endpoint

## New Required Model

Warehouse → Webhook → Webhook Endpoint → Stock Cache → Query Endpoint

## Impact of the Pivot

The existing polling mechanism must no longer be the active method of synchronizing
inventory.

### Dropped

- Five-minute warehouse polling.
- Active use of `poller.js`.

### Modified

- Inventory updates will now be received through a webhook.
- The existing stock cache will receive updates from webhook events.

### Added

- Webhook endpoint.
- Webhook request handling.
- Validation of incoming inventory update data.

### Unchanged

- Stock cache concept.
- `GET /stock/:sku` query endpoint.
- Stock availability response.

## Deadline

The new webhook-based implementation must be completed within the same sprint
deadline. No extension or return to the polling model is assumed.

## Refactoring Requirement

The obsolete polling implementation must be removed or explicitly deprecated. The
application must not continue running polling in parallel with the webhook model.

## Verification

After refactoring, the following must be verified:

1. A webhook can update stock in the cache.
2. The query endpoint returns the updated stock.
3. An invalid webhook request is rejected.
4. The old polling process is no longer active.
5. Existing query behavior continues to work after the pivot.