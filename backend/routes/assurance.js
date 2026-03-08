const express = require("express");
const router = express.Router();
const pool = require("../db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// -------------------------------------------------------
// VOIR TOUS LES PRODUITS D'ASSURANCE  →  GET /api/assurances
// Accessible à tous (pas besoin d'être connecté)
// Correspond à la table SQL : products
// -------------------------------------------------------
router.get("/", async (req, res) => {
    try {
        const [products] = await pool.query("SELECT * FROM products");
        res.json(products);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------
// VOIR UN SEUL PRODUIT  →  GET /api/assurances/:id
// Accessible à tous
// -------------------------------------------------------
router.get("/:id", async (req, res) => {
    try {
        const [products] = await pool.query(
            "SELECT * FROM products WHERE id = ?",
            [req.params.id]
        );

        if (products.length === 0) {
            return res.status(404).json({ error: "Produit non trouvé" });
        }

        res.json(products[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------
// AJOUTER UN PRODUIT  →  POST /api/assurances
// Protégé : admin seulement
// -------------------------------------------------------
router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
        const { name, description, insurance_type, base_price } = req.body;

        if (!name || !description) {
            return res.status(400).json({ error: "name et description sont obligatoires" });
        }

        const [result] = await pool.query(
            "INSERT INTO products (name, description, insurance_type, base_price) VALUES (?, ?, ?, ?)",
            [name, description, insurance_type || null, base_price || 0]
        );

        res.status(201).json({
            message: "Produit d'assurance ajouté ✅",
            product: {
                id: result.insertId,
                name,
                description,
                insurance_type,
                base_price
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------
// MODIFIER UN PRODUIT  →  PUT /api/assurances/:id
// Protégé : admin seulement
// -------------------------------------------------------
router.put("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
        const { name, description, insurance_type, base_price } = req.body;

        const [result] = await pool.query(
            "UPDATE products SET name = ?, description = ?, insurance_type = ?, base_price = ? WHERE id = ?",
            [name, description, insurance_type || null, base_price || 0, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produit non trouvé" });
        }

        res.json({ message: "Produit modifié ✅" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


// -------------------------------------------------------
// SUPPRIMER UN PRODUIT  →  DELETE /api/assurances/:id
// Protégé : admin seulement
// -------------------------------------------------------
router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
    try {
        const [result] = await pool.query(
            "DELETE FROM products WHERE id = ?",
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Produit non trouvé" });
        }

        res.json({ message: "Produit supprimé ✅" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


module.exports = router;