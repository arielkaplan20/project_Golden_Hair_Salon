// רכיב Users Manager - הרשמה והתחברות (SUC-1, SUC-2)
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// יוצר טוקן שמכיל את מזהה המשתמש ואת ההרשאה שלו
function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

// SUC-1: הרשמה לאפליקציה
async function register(req, res) {
  try {
    const { firstName, lastName, email, address, birthDate, password, confirmPassword } = req.body;

    // צעד 3: בדיקה שהפרטים מלאים
    if (!firstName || !lastName || !email || !address || !birthDate || !password || !confirmPassword) {
      return res.status(400).json({ message: "יש למלא את כל השדות" });
    }
    // הסתעפות א': הסיסמאות אינן תואמות
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "הסיסמאות אינן תואמות" });
    }
    // הסתעפות א': הדוא\"ל כבר קיים במערכת
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "כתובת הדוא\"ל כבר קיימת במערכת" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ firstName, lastName, email, address, birthDate, passwordHash });

    // צעד 4: הודעת אישור, והלקוח יועבר לדף הכניסה
    res.status(201).json({ message: "ההרשמה בוצעה בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// SUC-2: התחברות לאפליקציה
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "יש להזין דוא\"ל וסיסמה" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "דוא\"ל או סיסמה שגויים" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(400).json({ message: "דוא\"ל או סיסמה שגויים" });
    }

    // צעד 4: מעבר לממשק המותאם לפי ההרשאה
    res.json({
      token: createToken(user),
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

// פרטי המשתמש המחובר
async function me(req, res) {
  const user = await User.findById(req.user.id).select("-passwordHash");
  res.json(user);
}

// SUC-8: עדכון פרופיל אישי
async function updateProfile(req, res) {
  try {
    const { firstName, lastName, address, birthDate, password, confirmPassword } = req.body;

    // הסתעפות א': שדות חובה חסרים
    if (!firstName || !lastName || !address || !birthDate) {
      return res.status(400).json({ message: "יש למלא את כל השדות" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "המשתמש לא נמצא" });

    user.firstName = firstName;
    user.lastName = lastName;
    user.address = address;
    user.birthDate = birthDate;

    // הסיסמה מתעדכנת רק אם המשתמש הזין סיסמה חדשה
    if (password) {
      if (password !== confirmPassword) {
        return res.status(400).json({ message: "הסיסמאות אינן תואמות" });
      }
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    await user.save();
    res.json({
      message: "הפרטים עודכנו בהצלחה",
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
}

module.exports = { register, login, me, updateProfile };
