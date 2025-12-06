const db = require('../../config/database');
require('dotenv').config();

const config = {
  autoBlockEnabled: process.env.AUTO_BLOCK_ENABLED === 'true',
  blockDurationMinutes: parseInt(process.env.BLOCK_DURATION_MINUTES) || 30
};

// Bloquear IP
async function bloquearIP(ip, razon = 'Actividad sospechosa', permanente = false) {
  try {
    const bloqueadoHasta = permanente ? null : new Date(Date.now() + config.blockDurationMinutes * 60 * 1000);
    
    const [existing] = await db.query('SELECT * FROM ips_bloqueadas WHERE ip = ?', [ip]);
    
    if (existing.length > 0) {
      await db.query(
        `UPDATE ips_bloqueadas SET intentos = intentos + 1, bloqueado_hasta = ?, permanente = ?, razon = ? WHERE ip = ?`,
        [bloqueadoHasta, permanente, razon, ip]
      );
    } else {
      await db.query(
        `INSERT INTO ips_bloqueadas (ip, razon, bloqueado_hasta, permanente) VALUES (?, ?, ?, ?)`,
        [ip, razon, bloqueadoHasta, permanente]
      );
    }
    
    console.log(`IP ${ip} bloqueada`);
    return { bloqueado: true, ip, razon };
  } catch (error) {
    console.error('Error al bloquear IP:', error);
    throw error;
  }
}

// Desbloquear IP
async function desbloquearIP(ip) {
  try {
    await db.query('DELETE FROM ips_bloqueadas WHERE ip = ?', [ip]);
    console.log(`IP ${ip} desbloqueada`);
    return { desbloqueado: true, ip };
  } catch (error) {
    console.error('Error al desbloquear IP:', error);
    throw error;
  }
}

// Obtener IPs bloqueadas
async function getBlockedIPs() {
  try {
    const [rows] = await db.query(
      `SELECT * FROM ips_bloqueadas WHERE permanente = TRUE OR bloqueado_hasta > NOW() ORDER BY fecha DESC`
    );
    return rows;
  } catch (error) {
    return [];
  }
}

module.exports = { bloquearIP, desbloquearIP, getBlockedIPs, config };
