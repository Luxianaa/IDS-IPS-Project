const form = document.getElementById("form-login");
const mensaje = document.getElementById("mensaje");
const btnSubmit = document.getElementById("btn-submit");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  // Deshabilitar botón durante el envío
  btnSubmit.disabled = true;
  btnSubmit.textContent = "Validando...";
  
  // Ocultar mensaje anterior
  mensaje.classList.remove("show", "alert-error", "alert-success");
  
  try {
    const formData = new URLSearchParams(new FormData(form));
    
    const response = await fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (data.ok) {
      // Login exitoso
      mensaje.textContent = "✓ " + data.mensaje;
      mensaje.classList.add("alert-success", "show");
      
      // Redirigir después de 500ms
      setTimeout(() => {
        window.location.href = data.redirect || "/dashboard";
      }, 500);
      
    } else {
      // Error de login o ataque detectado
      mensaje.textContent = "✗ " + data.mensaje;
      mensaje.classList.add("alert-error", "show");
      
      // Re-habilitar botón
      btnSubmit.disabled = false;
      btnSubmit.textContent = "Iniciar Sesión";
    }
    
  } catch (error) {
    console.error("Error:", error);
    mensaje.textContent = "✗ Error de conexión con el servidor";
    mensaje.classList.add("alert-error", "show");
    
    btnSubmit.disabled = false;
    btnSubmit.textContent = "Iniciar Sesión";
  }
});

// Limpiar mensaje de error al escribir
const inputs = form.querySelectorAll("input");
inputs.forEach(input => {
  input.addEventListener("input", () => {
    mensaje.classList.remove("show");
  });
});
