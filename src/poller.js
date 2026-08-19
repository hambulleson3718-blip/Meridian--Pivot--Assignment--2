const { getStockFromWarehouse } = require("./warehouse");
const { updateStock } = require("./cache");

const products = ["NS-001", "NS-002", "NS-003", "NS-004"];

function pollWarehouse() {
  console.log("Polling warehouse...");

  products.forEach((sku) => {
    const stock = getStockFromWarehouse(sku);

    if (stock !== null) {
      updateStock(sku, stock);
      console.log(`${sku}: ${stock} units`);
    } else {
      console.log(`${sku}: product not found`);
    }
  });

  console.log("Polling completed.");
}

module.exports = {
  pollWarehouse
};
