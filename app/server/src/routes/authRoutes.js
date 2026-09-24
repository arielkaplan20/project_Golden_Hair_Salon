const express = require("express");
const { register, login, me, updateProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", register);   // SUC-1
router.post("/login", login);         // SUC-2
router.get("/me", auth, me);
router.put("/me", auth, updateProfile);   // SUC-8
router.post("/forgot-password", forgotPassword);   // סעיף 6.1.2
router.post("/reset-password", resetPassword);

module.exports = router;
