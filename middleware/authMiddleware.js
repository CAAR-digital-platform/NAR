const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: "Accès refusé" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, "SECRET_KEY_CAAR");
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: "Token invalide" });
    }
};

module.exports = authMiddleware;