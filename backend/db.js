const mysql = require("mysql2/promise");

// Pool de connexions MySQL
const pool = mysql.createPool({
    host: "localhost",       // ⚠️ à changer si base hébergée en ligne
    user: "root",            // ⚠️ ton utilisateur MySQL (XAMPP = root)
    password: "",            // ⚠️ ton mot de passe MySQL (XAMPP = vide)
    database: "caar_assurance", // nom de la base de ta collègue
    waitForConnections: true,
    connectionLimit: 10,
});

async function ensureAuthSchema() {
    const conn = await pool.getConnection();

    try {
        const [rows] = await conn.query(
            `SELECT COUNT(*) AS cnt
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'users'
               AND COLUMN_NAME = 'must_change_password'`
        );

        if (!rows[0] || Number(rows[0].cnt) === 0) {
            await conn.query(
                `ALTER TABLE users
                 ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
                 AFTER is_active`
            );
            console.log("✅ users.must_change_password column added");
        }
    } finally {
        conn.release();
    }
}

// Test de connexion au démarrage
pool.getConnection()
    .then(async (conn) => {
        console.log("✅ MySQL connecté");
        conn.release();

        try {
            await ensureAuthSchema();
        } catch (schemaErr) {
            console.error("❌ Erreur migration users.must_change_password:", schemaErr.message);
        }
    })
    .catch((err) => {
        console.error("❌ Erreur connexion MySQL:", err.message);
    });

module.exports = pool;