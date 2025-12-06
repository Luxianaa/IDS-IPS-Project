require("dotenv").config();
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const compression = require("compression");
const path = require("path");

const sessionConfig = require("./config/session");
const checkBlockedIP = require("./middleware/ipFilter");
const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const apiRoutes = require("./routes/api.routes");
const { conectarArduino, testAlarma, activarAlarma } = require("./modules/arduino/buzzer");
const telegramNotifier = require("./modules/telegram/telegram-notifier");
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad y utilidades
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session(sessionConfig));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/login', checkBlockedIP);

// Rutas principales
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.use("/", authRoutes);
app.use("/", dashboardRoutes);
app.use("/api", apiRoutes);

// HONEYPOTS - Rutas trampa para detectar atacantes
const honeypotPaths = ['/admin', '/phpMyAdmin', '/.env', '/.git', '/wp-admin', '/config.php'];

honeypotPaths.forEach(path => {
  app.all(path, async (req, res) => {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent') || 'Unknown';
    
    console.log(`[HONEYPOT] Acceso detectado a ${path} desde ${ip}`);
    
    // Activar alarma crítica Arduino
    activarAlarma('critical');
    
    // Enviar notificación a Telegram
    telegramNotifier.enviarAlerta({
      ip,
      tipo: 'Honeypot Access',
      severity: 'critical',
      detalle: `Acceso a ruta trampa: ${path}`,
      userAgent,
      url: req.originalUrl
    });
    
    // Registrar en BD y bloquear IP
    try {
      await db.query(
        `INSERT INTO ataques (ip, tipo, detalle, severity, user_agent, url, fecha) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [ip, 'Honeypot Access', `Acceso a ruta: ${path}`, 'critical', userAgent, req.originalUrl]
      );
      
      const blocker = require('./modules/ips/blocker');
      await blocker.bloquearIP(ip, `Honeypot: ${path}`, true);
      
      console.log(`[HONEYPOT] IP ${ip} bloqueada permanentemente`);
    } catch (error) {
      console.error('[HONEYPOT] Error:', error.message);
    }
    
    res.status(404).send('Not Found');
  });
});

// Ruta de prueba para Arduino
app.get('/test-arduino', (req, res) => {
  console.log('[TEST] Ruta /test-arduino llamada');
  testAlarma();
  res.json({ ok: true, mensaje: 'Comando de prueba enviado a Arduino' });
});

// Ruta de prueba para Telegram
app.get('/test-telegram', async (req, res) => {
  console.log('[TEST] Ruta /test-telegram llamada');
  try {
    const resultado = await telegramNotifier.enviarMensajePrueba();
    if (resultado) {
      res.json({ ok: true, mensaje: '✓ Mensaje de prueba enviado a Telegram' });
    } else {
      res.json({ ok: false, mensaje: 'Bot no configurado o error al enviar' });
    }
  } catch (error) {
    res.json({ ok: false, mensaje: error.message });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor: http://localhost:3000`);
  console.log(`Dashboard: http://localhost:3000/dashboard`);
  console.log(`Auto-bloqueo: ${process.env.AUTO_BLOCK_ENABLED === 'true' ? 'Activado' : 'Desactivado'}`);
  
  const arduinoPort = process.env.ARDUINO_PORT || 'COM3';
  conectarArduino(arduinoPort);
});
