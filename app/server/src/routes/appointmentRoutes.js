const express = require("express");
const { auth } = require("../middleware/auth");
const c = require("../controllers/appointmentController");

const router = express.Router();

router.get("/barbers", auth, c.getBarbers);          // SUC-3 צעד 1
router.get("/slots", auth, c.getFreeSlots);          // SUC-3 צעדים 2-3
router.post("/", auth, c.bookAppointment);           // SUC-3 צעדים 4-5
router.get("/my", auth, c.myAppointments);           // SUC-4
router.put("/:id", auth, c.changeAppointment);       // SUC-5
router.delete("/:id", auth, c.cancelAppointment);    // SUC-6

module.exports = router;
