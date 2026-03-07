const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// 🔹 ROUTE INSCRIPTION
router.post("/register", async (req, res) => {
    try {
        const { nom, email, password } = req.body;

        if (!nom || !email || !password) {
            return res.status(400).json({
                error: "Tous les champs sont obligatoires"
            });
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({
                error: "Email déjà utilisé"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            nom,
            email,
            password: hashedPassword,
            role: "client" // par défaut
        });

        await newUser.save();

        res.status(201).json({
            message: "Utilisateur enregistré avec succès"
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// 🔹 ROUTE CONNEXION
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: "Email et mot de passe obligatoires"
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                error: "Utilisateur non trouvé"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                error: "Mot de passe incorrect"
            });
        }

        // 🔐 Génération du token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            "SECRET_KEY_CAAR",
            { expiresIn: "1d" }
        );

        res.json({
            message: "Connexion réussie",
            token,
            user: {
                nom: user.nom,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// 🔹 ROUTE PROTÉGÉE TEST
router.get("/profile", authMiddleware, async (req, res) => {
    res.json({
        message: "Accès autorisé",
        user: req.user
    });
});

module.exports = router;

const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("admin"),
    (req, res) => {
        res.json({
            message: "Bienvenue Admin 👑",
            user: req.user
        });
    }
);