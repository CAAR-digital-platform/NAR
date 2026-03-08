const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const router = express.Router();

const SECRET_KEY = "SECRET_KEY_CAAR"; // ⚠️ À déplacer dans un fichier .env plus tard


// -------------------------------------------------------
// ROUTE INSCRIPTION  →  POST /api/auth/register
// Correspond à la table SQL : users (first_name, last_name, email, password_hash)
// + table clients (user_id) créée automatiquement après inscription
// -------------------------------------------------------
router.post("/register", async (req, res) => {
    try {
        const { first_name, last_name, email, password, phone } = req.body;

        // Vérification des champs obligatoires
        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                error: "Tous les champs sont obligatoires (first_name, last_name, email, password)"
            });
        }

        // Vérification si l'email existe déjà
        const [existingUsers] = await pool.query(
            "SELECT id FROM users WHERE email = ?",
            [email]
        );
        if (existingUsers.length > 0) {
            return res.status(400).json({ error: "Email déjà utilisé" });
        }

        // Hash du mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertion dans la table users
        const [result] = await pool.query(
            "INSERT INTO users (first_name, last_name, email, password_hash, phone) VALUES (?, ?, ?, ?, ?)",
            [first_name, last_name, email, hashedPassword, phone || null]
        );

        const newUserId = result.insertId;

        // Insertion automatique dans la table clients (rôle par défaut)
        await pool.query(
            "INSERT INTO clients (user_id) VALUES (?)",
            [newUserId]
        );

        res.status(201).json({
            message: "Utilisateur enregistré avec succès ✅"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// -------------------------------------------------------
// ROUTE CONNEXION  →  POST /api/auth/login
// -------------------------------------------------------
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Vérification des champs
        if (!email || !password) {
            return res.status(400).json({
                error: "Email et mot de passe obligatoires"
            });
        }

        // Recherche de l'utilisateur dans la table users
        const [users] = await pool.query(
            "SELECT * FROM users WHERE email = ?",
            [email]
        );
        if (users.length === 0) {
            return res.status(400).json({ error: "Utilisateur non trouvé" });
        }

        const user = users[0];

        // Vérification du mot de passe
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: "Mot de passe incorrect" });
        }

        // Détermination du rôle selon les tables admins / agents / experts / clients
        let role = "client"; // rôle par défaut

        const [admins] = await pool.query("SELECT id FROM admins WHERE user_id = ?", [user.id]);
        if (admins.length > 0) role = "admin";

        const [agents] = await pool.query("SELECT id FROM agents WHERE user_id = ?", [user.id]);
        if (agents.length > 0) role = "agent";

        const [experts] = await pool.query("SELECT id FROM experts WHERE user_id = ?", [user.id]);
        if (experts.length > 0) role = "expert";

        // Génération du token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: role
            },
            SECRET_KEY,
            { expiresIn: "1d" }
        );

        res.json({
            message: "Connexion réussie ✅",
            token,
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: role
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// -------------------------------------------------------
// ROUTE PROFIL  →  GET /api/auth/profile
// Protégée : tout utilisateur connecté (token valide)
// -------------------------------------------------------
router.get("/profile", authMiddleware, async (req, res) => {
    try {
        const [users] = await pool.query(
            "SELECT id, first_name, last_name, email, phone, created_at FROM users WHERE id = ?",
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: "Utilisateur non trouvé" });
        }

        res.json({
            message: "Accès autorisé ✅",
            user: { ...users[0], role: req.user.role }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erreur serveur" });
    }
});


// -------------------------------------------------------
// ROUTE ADMIN  →  GET /api/auth/admin
// Protégée : admin seulement
// -------------------------------------------------------
router.get("/admin", authMiddleware, roleMiddleware("admin"), (req, res) => {
    res.json({
        message: "Bienvenue Admin 👑",
        user: req.user
    });
});


// ✅ module.exports tout à la fin — toutes les routes sont bien exportées
module.exports = router;