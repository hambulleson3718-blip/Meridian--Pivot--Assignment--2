const warehouseStock = {
  "NS-001": 25,
  "NS-002": 10,
  "NS-003": 0,
  "NS-004": 50
};

function getStockFromWarehouse(sku) {
  return warehouseStock[sku] ?? null;
}

module.exports = {
  getStockFromWarehouse
};
