const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {

        // S'assurer que authMiddleware a bien été appelé avant
        if (!req.user) {
            return res.status(401).json({ error: "Non autorisé : utilisateur non identifié" });
        }

        // Vérification du rôle
        if (req.user.role !== requiredRole) {
            return res.status(403).json({ error: `Accès interdit : rôle '${requiredRole}' requis` });
        }

        next();
    };
};

module.exports = roleMiddleware;