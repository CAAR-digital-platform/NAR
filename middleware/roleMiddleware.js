const roleMiddleware = (requiredRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Non autorisé" });
        }

        if (req.user.role !== requiredRole) {
            return res.status(403).json({ error: "Accès interdit" });
        }

        next();
    };
};

module.exports = roleMiddleware;