const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const c = require("../controllers/adminController");

const router = express.Router();

// כל המסכים האלה פתוחים למנהל הראשי בלבד
router.get("/users", auth, requireRole("admin"), c.getUsers);                  // SUC-10
router.put("/users/:id/role", auth, requireRole("admin"), c.updateRole);      // SUC-10
router.get("/appointments", auth, requireRole("admin"), c.getAllAppointments); // SUC-11

module.exports = router;
