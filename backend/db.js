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
            ADD CONSTRAINT uq_clients_user_id UNIQUE (user_id)
        `);
        console.log("✅ clients.user_id unique constraint added");
    } finally {
        conn.release();
    }
}

async function ensureRoadsideStatusSchema() {
    const conn = await pool.getConnection();
    try {
        await conn.query(`
            ALTER TABLE roadside_requests 
            MODIFY COLUMN status ENUM('pending','dispatched','on_site','resolved','closed') 
            NOT NULL DEFAULT 'pending'
        `);
        console.log("✅ roadside_requests.status enum updated");
    } catch (err) {
        console.error("❌ Failed to update roadside_requests.status enum:", err.message);
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

/**
 * Create the homepage_products table if it doesn't exist, then seed
 * the two default rows (CATNAT + Roadside Assistance) using INSERT IGNORE
 * so re-runs are safe.
 */
async function ensureHomepageProductsSchema() {
    const conn = await pool.getConnection();

    try {
        // 1. Create table
        await conn.query(`
            CREATE TABLE IF NOT EXISTS \`homepage_products\` (
              \`id\`            int UNSIGNED     NOT NULL AUTO_INCREMENT,
              \`name\`          varchar(120)     COLLATE utf8mb4_unicode_ci NOT NULL,
              \`description\`   text             COLLATE utf8mb4_unicode_ci,
              \`image_url\`     varchar(512)     COLLATE utf8mb4_unicode_ci DEFAULT NULL,
              \`cta_label\`     varchar(80)      COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Subscribe',
              \`is_active\`     tinyint(1)       NOT NULL DEFAULT 1,
              \`display_order\` int              NOT NULL DEFAULT 0,
              \`created_at\`    timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP,
              \`updated_at\`    timestamp        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              PRIMARY KEY (\`id\`),
              KEY \`idx_hp_active_order\` (\`is_active\`, \`display_order\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
              COMMENT='Controls the Online Products section on the homepage'
        `);

        // 2. Seed default rows (INSERT IGNORE = safe on re-run)
        await conn.query(`
            INSERT IGNORE INTO \`homepage_products\`
              (\`id\`, \`name\`, \`description\`, \`image_url\`, \`cta_label\`, \`is_active\`, \`display_order\`)
            VALUES
              (1,
               'Natural Disaster (CATNAT)',
               'Mandatory coverage by Algerian law (Ordonnance 03-12) protecting your property against earthquakes, floods, storms, landslides and ground movements.',
               NULL,
               'Get a Quote',
               1,
               1),
              (2,
               'Roadside Assistance',
               'Emergency vehicle assistance available 24/7 across all 48 wilayas — towing, on-site repair, replacement vehicle, and hotel coverage.',
               NULL,
               'Subscribe Now',
               1,
               2)
        `);

        // Check if any rows exist (to log the right message)
        const [[countRow]] = await conn.query(
            'SELECT COUNT(*) AS cnt FROM homepage_products'
        );
        console.log(
            `✅ homepage_products ready (${countRow.cnt} row${countRow.cnt !== 1 ? 's' : ''})`
        );

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

        try {
            await ensureHomepageProductsSchema();
        } catch (hpErr) {
            console.error("❌ Erreur migration homepage_products:", hpErr.message);
        }

        try {
            await ensureRoadsideStatusSchema();
        } catch (roadsideErr) {
            console.error("❌ Erreur migration roadside_requests.status:", roadsideErr.message);
        }
    })
    .catch((err) => {
        console.error("❌ Erreur connexion MySQL:", err.message);
    });

module.exports = pool;