const express = require("express");
const { pollWarehouse } = require("./poller");
const { getStock } = require("./cache");

const app = express();
const PORT = 3000;

// Run the first warehouse poll immediately
pollWarehouse();

// Poll the warehouse every 5 minutes
setInterval(pollWarehouse, 5 * 60 * 1000);

// Query endpoint
app.get("/stock/:sku", (req, res) => {
  const sku = req.params.sku;
  const result = getStock(sku);

  if (!result) {
    return res.status(404).json({
      error: "Product not found in cache"
    });
  }

  res.json({
    sku: sku,
    stock: result.stock,
    available: result.stock > 0,
    updatedAt: result.updatedAt
  });
});

app.listen(PORT, () => {
  console.log(`Inventory service running at http://localhost:${PORT}`);
});
