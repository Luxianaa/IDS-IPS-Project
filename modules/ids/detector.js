const rules = require('./rules');

let intentosPorIP = {};

// Detectar SQL Injection
function detectSQLInjection(input) {
  for (const pattern of rules.sqlInjection.patterns) {
    if (input.toLowerCase().includes(pattern.toLowerCase())) {
      return {
        detectado: true,
        tipo: rules.sqlInjection.tipo,
        severity: rules.sqlInjection.severity,
        detalle: `Patrón: "${pattern}"`
      };
    }
  }
  return null;
}

// Detectar fuerza bruta
function detectBruteForce(ip) {
  const ahora = Date.now();
  const threshold = parseInt(process.env.BRUTE_FORCE_THRESHOLD) || 5;
  const window = parseInt(process.env.BRUTE_FORCE_WINDOW_SECONDS) * 1000 || 10000;
  
  if (!intentosPorIP[ip]) intentosPorIP[ip] = [];
  intentosPorIP[ip].push(ahora);
  intentosPorIP[ip] = intentosPorIP[ip].filter(t => ahora - t < window);
  
  if (intentosPorIP[ip].length > threshold) {
    return {
      detectado: true,
      tipo: 'Fuerza Bruta',
      severity: 'high',
      detalle: `${intentosPorIP[ip].length} intentos en ${window/1000}s`
    };
  }
  
  return null;
}

// Análisis principal
function analizarRequest(req, username = '', password = '') {
  const ip = req.ip || req.connection.remoteAddress;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('user-agent') || '';
  
  // SQL Injection
  if (username) {
    const sql = detectSQLInjection(username);
    if (sql) {
      return {
        ip,
        tipo: sql.tipo,
        detalle: sql.detalle,
        severity: sql.severity,
        user_agent: userAgent,
        url: url,
        fecha: new Date()
      };
    }
  }
  
  if (password) {
    const sql = detectSQLInjection(password);
    if (sql) {
      return {
        ip,
        tipo: sql.tipo,
        detalle: sql.detalle,
        severity: sql.severity,
        user_agent: userAgent,
        url: url,
        fecha: new Date()
      };
    }
  }
  
  // Fuerza Bruta
  const bruteForce = detectBruteForce(ip);
  if (bruteForce) {
    return {
      ip,
      tipo: bruteForce.tipo,
      detalle: bruteForce.detalle,
      severity: bruteForce.severity,
      user_agent: userAgent,
      url: url,
      fecha: new Date()
    };
  }
  
  return null;
}

module.exports = { analizarRequest };
