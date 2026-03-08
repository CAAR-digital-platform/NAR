const express = require("express");
const authRoutes = require("./routes/auth");
const assuranceRoutes = require("./routes/assurance");

// Connexion MySQL (importée ici pour être initialisée au démarrage)
require("./db");

const app = express();

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/assurances", assuranceRoutes); // ✅ DÉPLACÉ ici, avant app.listen()

app.get("/", (req, res) => {
    res.json({ message: "Backend running ✅" });
});

// Démarrage du serveur
app.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});