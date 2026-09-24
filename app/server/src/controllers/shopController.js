// רכיב Shop & Orders Manager - חנות המוצרים וההזמנות (SUC-7, SUC-12)
const Product = require("../models/Product");
const Order = require("../models/Order");

// רשימת המוצרים בחנות - צעד 1 ב-SUC-7 וצעד 2 ב-SUC-12
async function getProducts(req, res) {
  const products = await Product.find().sort({ name: 1 });
  res.json(products);
}

// מוצר בודד - דף המוצר בחנות
async function getProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "המוצר לא נמצא" });
  res.json(product);
}

// בודק שפרטי האשראי מלאים ותקינים. הסתעפות ב' ב-SUC-7
function validCard(card) {
  if (!card) return false;
  const number = (card.number || "").replace(/\s/g, "");
  if (!/^\d{16}$/.test(number)) return false;
  if (!/^\d{2}\/\d{2}$/.test(card.expiry || "")) return false;
  if (!/^\d{3}$/.test(card.cvv || "")) return false;
  return true;
}

// יוצר מספר הזמנה: השנה ואחריה מספר רץ
async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const count = await Order.countDocuments();
  return year + "-" + String(count + 1).padStart(4, "0");
}

// ביצוע הזמנה - צעדים 2 עד 6 ב-SUC-7
async function createOrder(req, res) {
  try {
    const { items, deliveryType, fullName, phone, email, pickupPoint, address, notes, card } = req.body;

    // הסתעפות א': הסל ריק
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "הסל שלך ריק" });
    }
    if (!deliveryType || !fullName || !phone || !email) {
      return res.status(400).json({ message: "יש למלא את כל פרטי ההזמנה" });
    }
    if (deliveryType === "delivery" && !address) {
      return res.status(400).json({ message: "יש להזין כתובת למשלוח" });
    }
    if (deliveryType === "pickup" && !pickupPoint) {
      return res.status(400).json({ message: "יש לבחור נקודת איסוף" });
    }
    // הסתעפות ב': אימות האשראי נכשל
    if (!validCard(card)) {
      return res.status(400).json({ message: "תשלום נכשל, אנא נסה שנית" });
    }

    // בונים את שורות ההזמנה לפי המחירים שבמסד הנתונים, לא לפי מה שהגיע מהדפדפן
    const orderItems = [];
    let totalPrice = 0;
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: "אחד המוצרים אינו קיים בחנות" });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: "המוצר " + product.name + " אינו במלאי בכמות המבוקשת" });
      }
      orderItems.push({ productId: product._id, name: product.name, price: product.price, quantity: item.quantity });
      totalPrice += product.price * item.quantity;
    }

    const order = await Order.create({
      orderNumber: await nextOrderNumber(),
      clientId: req.user.id,
      items: orderItems, deliveryType, fullName, phone, email,
      pickupPoint: pickupPoint || "", address: address || "", notes: notes || "",
      totalPrice
    });

    // עדכון המלאי אחרי שההזמנה נשמרה
    for (const item of orderItems) {
      await Product.updateOne({ _id: item.productId }, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json({ message: "ההזמנה בוצעה בהצלחה", orderNumber: order.orderNumber, totalPrice });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// ההזמנות הקודמות של הלקוח המחובר
async function myOrders(req, res) {
  const list = await Order.find({ clientId: req.user.id }).sort({ createdAt: -1 });
  res.json(list);
}

// כלל ההזמנות במערכת - צעד 2 ב-SUC-12
async function getAllOrders(req, res) {
  const list = await Order.find().populate("clientId", "firstName lastName").sort({ createdAt: -1 });
  res.json(list.map((o) => ({
    id: o._id,
    orderNumber: o.orderNumber,
    clientName: o.clientId ? o.clientId.firstName + " " + o.clientId.lastName : "לקוח",
    items: o.items,
    deliveryType: o.deliveryType,
    totalPrice: o.totalPrice,
    status: o.status
  })));
}

// בדיקת תקינות פרטי מוצר. הסתעפות ב' ב-SUC-12
function invalidProduct(body) {
  if (!body.name || body.price === undefined || body.price === "" || body.stock === undefined || body.stock === "") {
    return "יש למלא שם מוצר, מחיר וכמות במלאי";
  }
  if (Number(body.price) < 0 || Number(body.stock) < 0) {
    return "המחיר והכמות במלאי חייבים להיות מספרים חיוביים";
  }
  return null;
}

// הוספת מוצר חדש - SUC-12 צעדים 4-8
async function addProduct(req, res) {
  const problem = invalidProduct(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const { name, description, price, stock, image } = req.body;
  await Product.create({ name, description, price, stock, image });
  res.status(201).json({ message: "המוצר נוסף בהצלחה" });
}

// עדכון מוצר קיים
async function updateProduct(req, res) {
  const problem = invalidProduct(req.body);
  if (problem) return res.status(400).json({ message: problem });

  const { name, description, price, stock, image } = req.body;
  const product = await Product.findByIdAndUpdate(req.params.id, { name, description, price, stock, image });
  if (!product) return res.status(404).json({ message: "המוצר לא נמצא" });
  res.json({ message: "המוצר עודכן בהצלחה" });
}

// מחיקת מוצר
async function deleteProduct(req, res) {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "המוצר לא נמצא" });
  res.json({ message: "המוצר נמחק בהצלחה" });
}

module.exports = { getProducts, getProduct, createOrder, myOrders, getAllOrders, addProduct, updateProduct, deleteProduct };
