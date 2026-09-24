const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const c = require("../controllers/shopController");

const router = express.Router();

// חנות הלקוח - SUC-7
router.get("/products", auth, c.getProducts);
router.get("/products/:id", auth, c.getProduct);
router.post("/orders", auth, c.createOrder);
router.get("/orders/my", auth, c.myOrders);

// ניהול החנות וההזמנות - SUC-12, למנהל הראשי בלבד
router.get("/orders", auth, requireRole("admin"), c.getAllOrders);
router.post("/products", auth, requireRole("admin"), c.addProduct);
router.put("/products/:id", auth, requireRole("admin"), c.updateProduct);
router.delete("/products/:id", auth, requireRole("admin"), c.deleteProduct);

module.exports = router;
