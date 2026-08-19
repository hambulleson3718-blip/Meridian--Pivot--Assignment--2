const express = require("express");
const { updateStock, getStock } = require("./cache");

const app = express();
const PORT = 3000;

app.use(express.json());

// Webhook endpoint
app.post("/webhook/inventory", (req, res) => {
  const { sku, stock } = req.body;

  // Validate webhook payload
  if (
    typeof sku !== "string" ||
    sku.trim() === "" ||
    typeof stock !== "number" ||
    stock < 0
  ) {
    return res.status(400).json({
      error: "Invalid inventory update"
    });
  }

  // Update the stock cache
  updateStock(sku, stock);

  res.status(200).json({
    message: "Inventory updated",
    sku: sku,
    stock: stock
  });
});

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
