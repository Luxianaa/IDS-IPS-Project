const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

let bot = null;
let isEnabled = false;
let lastNotification = {};

// Inicializar bot
function inicializarBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const enabled = process.env.TELEGRAM_ENABLED !== 'false';
  
  if (!enabled) {
    console.log('[Telegram] Notificaciones deshabilitadas');
    return;
  }
  
  if (!token || !chatId) {
    console.warn('[Telegram] Token o Chat ID no configurado. Notificaciones deshabilitadas.');
    return;
  }
  
  try {
    bot = new TelegramBot(token, { polling: false });
    isEnabled = true;
    console.log('[Telegram] Bot inicializado correctamente ✓');
  } catch (error) {
    console.error('[Telegram] Error al inicializar bot:', error.message);
    isEnabled = false;
  }
}

// Obtener emoji según severidad
function getSeverityEmoji(severity) {
  const emojis = {
    'critical': '🔴',
    'high': '🟠',
    'medium': '🟡',
    'low': '🟢'
  };
  return emojis[severity] || '⚠️';
}

// Rate limiting - evitar spam
function shouldSendNotification(tipo) {
  const rateLimitSeconds = parseInt(process.env.TELEGRAM_RATE_LIMIT_SECONDS) || 10;
  const now = Date.now();
  
  if (!lastNotification[tipo]) {
    lastNotification[tipo] = now;
    return true;
  }
  
  const timeSinceLastNotification = (now - lastNotification[tipo]) / 1000;
  
  if (timeSinceLastNotification >= rateLimitSeconds) {
    lastNotification[tipo] = now;
    return true;
  }
  
  console.log(`[Telegram] Rate limit activo para "${tipo}" (${Math.round(timeSinceLastNotification)}s desde última notificación)`);
  return false;
}

// Enviar alerta
async function enviarAlerta(attackData) {
  if (!isEnabled || !bot) {
    return;
  }
  
  const { ip, tipo, severity, detalle, userAgent, url } = attackData;
  
  // Rate limiting
  if (!shouldSendNotification(tipo)) {
    return;
  }
  
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const emoji = getSeverityEmoji(severity);
  const timestamp = new Date().toLocaleString('es-ES', { 
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  // Formatear mensaje
  const mensaje = `${emoji} *ALERTA DE SEGURIDAD*\n\n` +
    `*Tipo:* ${tipo}\n` +
    `*Severidad:* ${severity.toUpperCase()}\n` +
    `*IP Atacante:* \`${ip}\`\n` +
    `*Detalle:* ${detalle}\n` +
    `*URL:* ${url || 'N/A'}\n` +
    `*User Agent:* ${userAgent ? userAgent.substring(0, 50) + '...' : 'N/A'}\n` +
    `*Timestamp:* ${timestamp}`;
  
  try {
    await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    console.log(`[Telegram] ✓ Notificación enviada: ${tipo} desde ${ip}`);
  } catch (error) {
    console.error('[Telegram] Error al enviar mensaje:', error.message);
  }
}

// Enviar mensaje de prueba
async function enviarMensajePrueba() {
  if (!isEnabled || !bot) {
    console.log('[Telegram] Bot no está habilitado o inicializado');
    return false;
  }
  
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const mensaje = '*Sistema IDS/IPS Activo*\n\nBot de notificaciones funcionando correctamente.';
  
  try {
    await bot.sendMessage(chatId, mensaje, { parse_mode: 'Markdown' });
    console.log('[Telegram] ✓ Mensaje de prueba enviado correctamente');
    return true;
  } catch (error) {
    console.error('[Telegram] Error al enviar mensaje de prueba:', error.message);
    return false;
  }
}

// Inicializar al importar
inicializarBot();

module.exports = { enviarAlerta, enviarMensajePrueba, inicializarBot };
