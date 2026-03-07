const express = require("express");
const router = express.Router();
const Assurance = require("../models/Assurance");
const auth = require("../middleware/auth");


// voir toutes les assurances
router.get("/", async (req, res) => {
  try {
    const assurances = await Assurance.find();
    res.json(assurances);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ajouter assurance (admin)
router.post("/", auth, async (req, res) => {

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès interdit" });
  }

  try {
    const assurance = new Assurance(req.body);
    await assurance.save();

    res.json({
      message: "Assurance ajoutée",
      assurance
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});

module.exports = router;