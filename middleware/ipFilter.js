const db = require("../config/database");
//muestra de ips bloqueadas
async function checkBlockedIP(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  try {
    const [rows] = await db.query(
      `SELECT * FROM ips_bloqueadas 
       WHERE ip = ? 
       AND (permanente = TRUE OR bloqueado_hasta > NOW())`,
      [ip]
    );
    
    if (rows.length > 0) {
      const bloqueo = rows[0];
      return res.status(403).json({
        ok: false,
        mensaje: "IP Bloqueada",
        razon: bloqueo.razon
      });
    }
    
    next();
  } catch (error) {
    console.warn("Error verificando IP bloqueada:", error.message);
    next();
  }
}

module.exports = checkBlockedIP;
