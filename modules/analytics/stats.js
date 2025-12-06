const db = require('../../config/database');

// Estadísticas generales
async function getStats() {
  try {
    const [totalResult] = await db.query('SELECT COUNT(*) as total FROM ataques');
    const totalAtaques = totalResult[0].total;
    
    const [hoyResult] = await db.query(
      'SELECT COUNT(*) as total FROM ataques WHERE DATE(fecha) = CURDATE()'
    );
    const ataquesHoy = hoyResult[0].total;
    
    const [bloqueadasResult] = await db.query(
      `SELECT COUNT(*) as total FROM ips_bloqueadas WHERE permanente = TRUE OR bloqueado_hasta > NOW()`
    );
    const ipsBloqueadas = bloqueadasResult[0].total;
    
    const [porTipo] = await db.query(
      `SELECT tipo, COUNT(*) as cantidad FROM ataques GROUP BY tipo ORDER BY cantidad DESC`
    );
    
    return { totalAtaques, ataquesHoy, ipsBloqueadas, porTipo };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    throw error;
  }
}

// Ataques recientes
async function getAtaquesRecientes(limit = 100) {
  try {
    const [rows] = await db.query('SELECT * FROM ataques ORDER BY id DESC LIMIT ?', [limit]);
    return rows;
  } catch (error) {
    return [];
  }
}

// Ataques por hora
async function getAtaquesPorHora() {
  try {
    const [rows] = await db.query(
      `SELECT DATE_FORMAT(fecha, '%Y-%m-%d %H:00:00') as hora, COUNT(*) as cantidad
       FROM ataques
       WHERE fecha >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
       GROUP BY DATE_FORMAT(fecha, '%Y-%m-%d %H:00:00')
       ORDER BY hora`
    );
    
    const horasCompletas = [];
    for (let i = 0; i < 24; i++) {
      const hora = new Date(Date.now() - (24 - i) * 60 * 60 * 1000);
      const horaStr = hora.getHours() + ':00';
      const registro = rows.find(r => new Date(r.hora).getHours() === hora.getHours());
      horasCompletas.push({ hora: horaStr, cantidad: registro ? registro.cantidad : 0 });
    }
    
    return horasCompletas;
  } catch (error) {
    return [];
  }
}

module.exports = { getStats, getAtaquesRecientes, getAtaquesPorHora };
