const express = require("express");
const { auth, requireRole } = require("../middleware/auth");
const c = require("../controllers/scheduleController");

const router = express.Router();

// המסכים האלה פתוחים לספר ולמנהל הראשי, שמשמש גם הוא כנותן שירות
router.get("/diary", auth, requireRole("barber", "admin"), c.getDiary);        // SUC-9 צעדים 2-3
router.get("/me", auth, requireRole("barber", "admin"), c.getMySchedule);      // SUC-9 צעד 5
router.put("/me", auth, requireRole("barber", "admin"), c.updateMySchedule);   // SUC-9 צעדים 6-8
router.post("/me/exceptions", auth, requireRole("barber", "admin"), c.saveException);           // הסתעפות ג'
router.delete("/me/exceptions/:date", auth, requireRole("barber", "admin"), c.deleteException);

module.exports = router;
