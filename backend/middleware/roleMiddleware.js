/**
 * Factory that returns a middleware enforcing a required role.
 * Must be used AFTER authMiddleware (req.user must exist).
 *
 * Usage:
 *   router.get('/admin', authMiddleware, requireRole('admin'), handler)
 *   router.get('/agents', authMiddleware, requireRole('admin', 'agent'), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: user not identified' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: requires role '${roles.join(' or ')}'`,
      });
    }

    next();
  };
}

module.exports = requireRole;