const express = require('express');
const router = express.Router();
const db = require('../config/database');
const detector = require('../modules/ids/detector');
const ipsActions = require('../modules/ips/actions');
const { activarAlarma } = require('../modules/arduino/buzzer');
const telegramNotifier = require('../modules/telegram/telegram-notifier');

// Ruta de login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`Login desde ${ip} - Usuario: ${username}`);
    console.log(`[DEBUG] Intentando detectar ataque...`);
    
    // Analizar con IDS
    try {
      const ataque = detector.analizarRequest(req, username, password);
      console.log(`[DEBUG] Resultado detector:`, ataque);
      
      if (ataque) {
        console.log(`[DEBUG] ¡ATAQUE DETECTADO! Tipo: ${ataque.tipo}, Severity: ${ataque.severity}`);
        console.log(`Ataque: ${ataque.tipo}`);
        
        // ACTIVAR ALARMA ARDUINO
        console.log(`[DEBUG] Llamando a activarAlarma...`);
        activarAlarma(ataque.severity);
        console.log(`[DEBUG] activarAlarma llamada completada`);
        
        // ENVIAR NOTIFICACIÓN A TELEGRAM
        telegramNotifier.enviarAlerta({
          ip: ataque.ip,
          tipo: ataque.tipo,
          severity: ataque.severity,
          detalle: ataque.detalle,
          userAgent: ataque.user_agent,
          url: ataque.url
        });
        
        try {
          await db.query(
            `INSERT INTO ataques (ip, tipo, detalle, severity, user_agent, url, fecha) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [ataque.ip, ataque.tipo, ataque.detalle, ataque.severity, ataque.user_agent, ataque.url, ataque.fecha]
          );
          await ipsActions.procesarAtaque(ataque);
        } catch (dbError) {
          console.warn('No se pudo registrar ataque:', dbError.message);
        }
        
        return res.json({ ok: false, mensaje: `Ataque detectado: ${ataque.tipo}` });
      }
    } catch (idsError) {
      console.warn('Error en IDS:', idsError.message);
    }
    
    // Buscar usuario en BD
    try {
      const [rows] = await db.query(
        'SELECT * FROM usuarios WHERE username = ? AND password = ?',
        [username, password]
      );
      
      if (rows.length === 0) {
        return res.json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
      }
      
      req.session.user = rows[0];
      console.log(`Login exitoso: ${username}`);
      
      res.json({ ok: true, mensaje: 'Login exitoso', redirect: '/dashboard' });
      
    } catch (dbError) {
      console.error('Error de BD:', dbError.message);
      return res.json({ 
        ok: false, 
        mensaje: 'Base de datos no configurada. Importa database/schema.sql en phpMyAdmin.' 
      });
    }
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ ok: false, mensaje: 'Error interno: ' + error.message });
  }
});

// Ruta de logout
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ ok: true, redirect: '/' });
});

module.exports = router;
