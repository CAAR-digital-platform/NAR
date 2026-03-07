const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const assuranceRoutes = require("./routes/assurance");

const app = express();

app.use(express.json());

// 🔥 AJOUTE TA CONNEXION ICI
mongoose.connect("mongodb+srv://nawal_dbuser:informatique03@nawal.unigkdj.mongodb.net/nawal?retryWrites=true&w=majority")
.then(() => {
    console.log("MongoDB connected");
})
.catch((err) => {
    console.log("Erreur connexion MongoDB:", err);
});

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({ message: "Backend running" });
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});

app.use("/api/assurances", assuranceRoutes);