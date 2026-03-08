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

// Test de connexion au démarrage
pool.getConnection()
    .then((conn) => {
        console.log("✅ MySQL connecté");
        conn.release();
    })
    .catch((err) => {
        console.error("❌ Erreur connexion MySQL:", err.message);
    });

module.exports = pool;