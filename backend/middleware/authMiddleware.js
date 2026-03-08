const jwt = require("jsonwebtoken");

const SECRET_KEY = "SECRET_KEY_CAAR"; // ⚠️ À déplacer dans un .env plus tard

const authMiddleware = (req, res, next) => {

    // Vérification de la présence du header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Accès refusé : token manquant" });
    }

    // Extraction du token (format attendu : "Bearer TOKEN")
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ error: "Accès refusé : format token invalide" });
    }

    // Vérification et décodage du token
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded; // { id, email, role }
        next();
    } catch (error) {
        res.status(401).json({ error: "Token invalide ou expiré" });
    }
};

module.exports = authMiddleware;