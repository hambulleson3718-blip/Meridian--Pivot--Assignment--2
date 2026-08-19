# Meridian Pivot - Assignment 2

## Day 3 Original Specification

Northstar Retail Co. requires an inventory synchronization service for its support tool.

### Original Architecture

Warehouse API → Poller → Stock Cache → Query Endpoint

### Original Requirements

- Poll the warehouse inventory every 5 minutes.
- Cache the latest stock information.
- Provide a query endpoint for support tools.
- Return stock availability for a requested SKU.

### Implemented Components

- `src/warehouse.js` - simulated warehouse inventory source.
- `src/poller.js` - polls the warehouse and updates the cache.
- `src/cache.js` - stores the latest stock values.
- `src/server.js` - exposes the inventory query endpoint.

### Query Endpoint

```text

GET /stock/:sku