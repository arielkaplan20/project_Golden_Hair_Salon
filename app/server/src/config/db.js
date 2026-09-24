// חיבור למסד הנתונים MongoDB (Atlas)
const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("מחובר למסד הנתונים");
  } catch (err) {
    console.log("שגיאה בחיבור למסד הנתונים:", err.message);
    process.exit(1); // עוצרים את השרת, אין טעם להמשיך בלי מסד נתונים
  }
}

module.exports = connectDB;
