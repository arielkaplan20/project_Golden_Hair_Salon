// GOLDEN HAIR SALON - קובץ ההפעלה הראשי של השרת
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

app.use(cors());            // מאפשר לצד הלקוח (React) לפנות לשרת
app.use(express.json());    // קורא גוף בקשה בפורמט JSON

// נתיבי המערכת
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/schedule", require("./routes/scheduleRoutes"));
app.use("/api/shop", require("./routes/shopRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// בדיקה שהשרת חי
app.get("/", (req, res) => {
  res.json({ message: "GOLDEN HAIR SALON server is running" });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log("השרת עלה על פורט " + PORT));
});
