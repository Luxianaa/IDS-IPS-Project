require("dotenv").config();
//esto es para que la sesion sea segura

module.exports = {
  secret: process.env.SESSION_SECRET || "clave-super-secreta-default",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000 
  }
};
