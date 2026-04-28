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
        // Check is_active
        const [activeCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'is_active'
        `);

        if (Number(activeCheck[0].cnt) === 0) {
            await conn.query(`
                ALTER TABLE users
                ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
            `);
            console.log("✅ users.is_active added");
        }

        // Check must_change_password
        const [passCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'users'
              AND COLUMN_NAME = 'must_change_password'
        `);

        if (Number(passCheck[0].cnt) === 0) {
            await conn.query(`
                ALTER TABLE users
                ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0
            `);
            console.log("✅ users.must_change_password added");
        }

    } finally {
        conn.release();
    }
}

async function ensureClientIntegrity() {
    const conn = await pool.getConnection();

    try {
        const [tableCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'clients'
        `);

        if (Number(tableCheck[0].cnt) === 0) {
            return;
        }

        const [indexCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'clients'
              AND INDEX_NAME = 'uq_clients_user_id'
        `);

        if (Number(indexCheck[0].cnt) > 0) {
            return;
        }

        const [dupRows] = await conn.query(`
            SELECT user_id, COUNT(*) AS cnt
            FROM clients
            WHERE user_id IS NOT NULL
            GROUP BY user_id
            HAVING COUNT(*) > 1
            LIMIT 1
        `);

        if (dupRows.length > 0) {
            console.warn(
                "⚠️ Cannot add unique index uq_clients_user_id: duplicate clients detected for at least one user_id"
            );
            return;
        }

        await conn.query(`
            ALTER TABLE clients
            ADD UNIQUE INDEX uq_clients_user_id (user_id)
        `);
        console.log("✅ clients.user_id unique index added (uq_clients_user_id)");
    } finally {
        conn.release();
    }
}

async function ensureProductSchema() {
    const conn = await pool.getConnection();

    try {
        const [tableCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.TABLES
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'products'
        `);

        if (Number(tableCheck[0].cnt) === 0) {
            return;
        }

        const [activeCheck] = await conn.query(`
            SELECT COUNT(*) AS cnt
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'products'
              AND COLUMN_NAME = 'is_active'
        `);

        if (Number(activeCheck[0].cnt) === 0) {
            await conn.query(`
                ALTER TABLE products
                ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1
                AFTER base_price
            `);
            console.log("✅ products.is_active added");
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

        try {
            await ensureClientIntegrity();
        } catch (integrityErr) {
            console.error("❌ Erreur migration clients.user_id unique:", integrityErr.message);
        }

        try {
            await ensureProductSchema();
        } catch (productSchemaErr) {
            console.error("❌ Erreur migration products.is_active:", productSchemaErr.message);
        }
    })
    .catch((err) => {
        console.error("❌ Erreur connexion MySQL:", err.message);
    });

module.exports = pool;