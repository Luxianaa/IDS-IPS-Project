const blocker = require('./blocker');

// Acciones automáticas basadas en severidad
async function procesarAtaque(ataque) {
  if (!blocker.config.autoBlockEnabled) {
    return null;
  }
  
  const { ip, tipo, severity } = ataque;
  
  switch (severity) {
    case 'critical':
      await blocker.bloquearIP(ip, `Ataque ${tipo}`, true);
      console.log(`CRITICO: IP ${ip} bloqueada permanentemente`);
      break;
      
    case 'high':
      await blocker.bloquearIP(ip, `Ataque ${tipo}`, false);
      console.log(`ALTO: IP ${ip} bloqueada temporalmente`);
      break;
  }
  
  return { accion: 'procesado', severity };
}

module.exports = { procesarAtaque };
