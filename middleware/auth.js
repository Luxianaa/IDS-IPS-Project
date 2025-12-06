
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({ ok: false, mensaje: "No autorizado" });
}


function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.rol === "admin") {
    return next();
  }
  
  if (req.xhr || req.headers.accept.indexOf('json') > -1) {
    return res.status(403).json({ ok: false, mensaje: "Acceso denegado" });
  }
  
  res.redirect("/");
}

module.exports = { requireAuth, requireAdmin };
