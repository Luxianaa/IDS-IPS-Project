const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const stats = require('../modules/analytics/stats');
const blocker = require('../modules/ips/blocker');

// API para obtener ataques
router.get('/ataques', requireAdmin, async (req, res) => {
  try {
    const ataques = await stats.getAtaquesRecientes(100);
    res.json({ ok: true, data: ataques });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener ataques' });
  }
});

// API para estadísticas
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const estadisticas = await stats.getStats();
    res.json({ ok: true, data: estadisticas });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener estadísticas' });
  }
});

// API para IPs bloqueadas
router.get('/ips-bloqueadas', requireAdmin, async (req, res) => {
  try {
    const ips = await blocker.getBlockedIPs();
    res.json({ ok: true, data: ips });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener IPs' });
  }
});

// Desbloquear IP
router.post('/desbloquear/:ip', requireAdmin, async (req, res) => {
  try {
    await blocker.desbloquearIP(req.params.ip);
    res.json({ ok: true, mensaje: `IP ${req.params.ip} desbloqueada` });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al desbloquear IP' });
  }
});

// Datos para gráfico
router.get('/chart/ataques-hora', requireAdmin, async (req, res) => {
  try {
    const datos = await stats.getAtaquesPorHora();
    res.json({ ok: true, data: datos });
  } catch (error) {
    res.status(500).json({ ok: false, mensaje: 'Error al obtener datos' });
  }
});

module.exports = router;
