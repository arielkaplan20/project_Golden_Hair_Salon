// הכנסת נתוני פתיחה: מנהל ראשי ושני ספרים
require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User");
const ServiceProvider = require("./models/ServiceProvider");
const Product = require("./models/Product");

async function createUser(data, password) {
  let user = await User.findOne({ email: data.email });
  if (user) return user;
  const passwordHash = await bcrypt.hash(password, 10);
  return User.create({ ...data, passwordHash });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  // מנהל ראשי - משמש גם כנותן שירות, ולכן נוצר לו גם לוח עבודה
  const admin = await createUser({
    firstName: "מנהל", lastName: "ראשי", email: "admin@golden.com",
    address: "אשקלון", birthDate: new Date("1990-01-01"), role: "admin"
  }, "123456");

  const adminProvider = await ServiceProvider.findOne({ userId: admin._id });
  if (!adminProvider) {
    await ServiceProvider.create({ userId: admin._id });
  }

  // שני ספרים
  const barbers = [
    { firstName: "יוסי", lastName: "כהן", email: "yossi@golden.com" },
    { firstName: "דוד", lastName: "לוי", email: "david@golden.com" },
  ];

  for (const b of barbers) {
    const user = await createUser({
      ...b, address: "אשקלון", birthDate: new Date("1992-01-01"), role: "barber"
    }, "123456");

    const exists = await ServiceProvider.findOne({ userId: user._id });
    if (!exists) {
      await ServiceProvider.create({
        userId: user._id,
        workDays: [0, 1, 2, 3, 4],     // ראשון עד חמישי
        startHour: "09:00",
        endHour: "19:00",
        slotMinutes: 30
      });
    }
  }

  // מוצרי פתיחה לחנות
  const products = [
    { name: "שמפו לשיער יבש", description: "שמפו מקצועי בנפח 500 מ\"ל", price: 45, stock: 20 },
    { name: "מרכך שיער", description: "מרכך להזנה ולחות בנפח 500 מ\"ל", price: 39, stock: 15 },
    { name: "ווקס לעיצוב", description: "ווקס בגימור מאט לאחיזה חזקה", price: 55, stock: 25 },
    { name: "ג'ל לשיער", description: "ג'ל לאחיזה ממושכת", price: 32, stock: 30 },
    { name: "שמן זקן", description: "שמן להזנת הזקן ולריכוך", price: 60, stock: 12 },
    { name: "מברשת עיצוב", description: "מברשת מקצועית לייבוש ועיצוב", price: 75, stock: 10 },
  ];

  for (const p of products) {
    const exists = await Product.findOne({ name: p.name });
    if (!exists) {
      await Product.create(p);
    }
  }

  console.log("נתוני הפתיחה הוכנסו: מנהל ראשי, שני ספרים ומוצרי החנות (סיסמה לכולם: 123456)");
  await mongoose.disconnect();
}

run();
