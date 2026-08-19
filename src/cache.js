const stockCache = {};

function updateStock(sku, stock) {
  stockCache[sku] = {
    stock: stock,
    updatedAt: new Date()
  };
}

function getStock(sku) {
  return stockCache[sku] || null;
}

module.exports = {
  updateStock,
  getStock
};
