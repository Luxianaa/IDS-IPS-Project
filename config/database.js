const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "ids_sistema",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});


pool.getConnection()
  .then(connection => {
    console.log("Conexión a MySQL establecida correctamente");
    connection.release();
  })
  .catch(err => {
    console.error("Error al conectar con MySQL:", err.message);
    console.warn(" El servidor continuará, pero necesitas configurar la BD para que funcione correctamente");
    console.warn(" Lee SETUP_XAMPP.md para instrucciones de configuración");
  });

module.exports = pool;
