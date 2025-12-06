// Variables globales para gráficos
let chartTimeline = null;
let chartTipos = null;

// Colores para gráficos
const chartColors = {
  primary: 'rgba(0, 212, 255, 1)',
  secondary: 'rgba(124, 58, 237, 1)',
  success: 'rgba(0, 217, 126, 1)',
  warning: 'rgba(255, 217, 61, 1)',
  danger: 'rgba(255, 71, 87, 1)',
  gradient: {
    primary: null, // Se inicializará con el contexto del canvas
    danger: null
  }
};

// ============================
// INICIALIZACIÓN
// ============================

document.addEventListener('DOMContentLoaded', () => {
  cargarEstadisticas();
  cargarAtaques();
  cargarIPsBloqueadas();
  inicializarGraficos();
  
  // Auto-refresh cada 10 segundos
  setInterval(() => {
    cargarEstadisticas();
    cargarAtaques();
    cargarIPsBloqueadas();
  }, 10000);
});

// ============================
// ESTADÍSTICAS
// ============================

async function cargarEstadisticas() {
  try {
    const response = await fetch('/api/stats');
    const result = await response.json();
    
    if (result.ok) {
      const stats = result.data;
      
      // Actualizar tarjetas de estadísticas
      document.getElementById('total-ataques').textContent = stats.totalAtaques;
      document.getElementById('ataques-hoy').textContent = stats.ataquesHoy;
      document.getElementById('ips-bloqueadas').textContent = stats.ipsBloqueadas;
      
      // Actualizar gráficos
      actualizarGraficoTipos(stats.porTipo);
      actualizarGraficoTimeline();
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
  }
}

// ============================
// GRÁFICOS
// ============================

function inicializarGraficos() {
  // Gráfico de línea temporal
  const ctxTimeline = document.getElementById('chart-timeline');
  if (ctxTimeline) {
    const gradientPrimary = ctxTimeline.getContext('2d').createLinearGradient(0, 0, 0, 300);
    gradientPrimary.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
    gradientPrimary.addColorStop(1, 'rgba(0, 212, 255, 0.0)');
    
    chartTimeline = new Chart(ctxTimeline, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Ataques',
          data: [],
          borderColor: chartColors.primary,
          backgroundColor: gradientPrimary,
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: chartColors.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#00d4ff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(0, 212, 255, 0.3)',
            borderWidth: 1,
            padding: 12,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#6b7280',
              stepSize: 1
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          x: {
            ticks: {
              color: '#6b7280'
            },
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
  
  // Gráfico de dona
  const ctxTipos = document.getElementById('chart-tipos');
  if (ctxTipos) {
    chartTipos = new Chart(ctxTipos, {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [
            'rgba(255, 71, 87, 0.8)',
            'rgba(0, 212, 255, 0.8)',
            'rgba(124, 58, 237, 0.8)',
            'rgba(255, 217, 61, 0.8)',
            'rgba(0, 217, 126, 0.8)',
            'rgba(255, 140, 66, 0.8)'
          ],
          borderColor: '#1a1f2e',
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#a8b2d1',
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(26, 31, 46, 0.95)',
            titleColor: '#00d4ff',
            bodyColor: '#ffffff',
            borderColor: 'rgba(0, 212, 255, 0.3)',
            borderWidth: 1,
            padding: 12
          }
        }
      }
    });
  }
}

async function actualizarGraficoTimeline() {
  try {
    const response = await fetch('/api/chart/ataques-hora');
    const result = await response.json();
    
    if (result.ok && chartTimeline) {
      const datos = result.data;
      chartTimeline.data.labels = datos.map(d => d.hora);
      chartTimeline.data.datasets[0].data = datos.map(d => d.cantidad);
      chartTimeline.update('none'); // Sin animación para updates en tiempo real
    }
  } catch (error) {
    console.error('Error actualizando gráfico timeline:', error);
  }
}

function actualizarGraficoTipos(porTipo) {
  if (chartTipos && porTipo && porTipo.length > 0) {
    chartTipos.data.labels = porTipo.map(t => t.tipo);
    chartTipos.data.datasets[0].data = porTipo.map(t => t.cantidad);
    chartTipos.update('none');
  }
}

// ============================
// TABLA DE ATAQUES
// ============================

async function cargarAtaques() {
  try {
    const response = await fetch('/api/ataques');
    const result = await response.json();
    
    if (result.ok) {
      const ataques = result.data;
      const tbody = document.getElementById('tabla-ataques');
      
      if (ataques.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="empty-state">
              <div class="empty-state-icon">OK</div>
              <p>No se han detectado ataques aún</p>
            </td>
          </tr>
        `;
        return;
      }
      
      tbody.innerHTML = ataques.map(ataque => `
        <tr>
          <td>#${ataque.id}</td>
          <td class="ip-cell">${ataque.ip}</td>
          <td>${ataque.tipo}</td>
          <td><span class="badge badge-${ataque.severity || 'medium'}">${ataque.severity || 'medium'}</span></td>
          <td class="detail-cell" title="${ataque.detalle || 'N/A'}">${ataque.detalle || 'N/A'}</td>
          <td>${formatearFecha(ataque.fecha)}</td>
        </tr>
      `).join('');
      
    }
  } catch (error) {
    console.error('Error cargando ataques:', error);
    document.getElementById('tabla-ataques').innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          <p style="color: #ff4757;">Error al cargar los ataques</p>
        </td>
      </tr>
    `;
  }
}

// ============================
// IPS BLOQUEADAS
// ============================

async function cargarIPsBloqueadas() {
  try {
    const response = await fetch('/api/ips-bloqueadas');
    const result = await response.json();
    
    if (result.ok) {
      const ips = result.data;
      const container = document.getElementById('lista-ips-bloqueadas');
      
      if (ips.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">OK</div>
            <p>No hay IPs bloqueadas en este momento</p>
          </div>
        `;
        return;
      }
      
      container.innerHTML = ips.map(ip => `
        <div class="blocked-ip-item">
          <div class="blocked-ip-info">
            <div class="blocked-ip">${ip.ip}</div>
            <div class="blocked-reason">${ip.razon || 'Sin razón especificada'} • ${ip.permanente ? 'Permanente' : 'Temporal'}</div>
          </div>
          <button class="btn-unblock" onclick="desbloquearIP('${ip.ip}')">
            Desbloquear
          </button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error cargando IPs bloqueadas:', error);
  }
}

async function desbloquearIP(ip) {
  if (!confirm(`¿Estás seguro de desbloquear la IP ${ip}?`)) {
    return;
  }
  
  try {
    const response = await fetch(`/api/desbloquear/${ip}`, {
      method: 'POST'
    });
    
    const result = await response.json();
    
    if (result.ok) {
      alert(`✓ IP ${ip} desbloqueada correctamente`);
      cargarIPsBloqueadas();
      cargarEstadisticas();
    } else {
      alert(`✗ Error: ${result.mensaje}`);
    }
  } catch (error) {
    console.error('Error desbloqueando IP:', error);
    alert('✗ Error al desbloquear la IP');
  }
}

// ============================
// UTILIDADES
// ============================

function formatearFecha(fecha) {
  const date = new Date(fecha);
  const ahora = new Date();
  const diff = Math.floor((ahora - date) / 1000); // diferencia en segundos
  
  if (diff < 60) return 'Hace unos segundos';
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} hrs`;
  
  return date.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function logout() {
  try {
    const response = await fetch('/logout', { method: 'POST' });
    const result = await response.json();
    
    if (result.ok) {
      window.location.href = result.redirect || '/';
    }
  } catch (error) {
    console.error('Error cerrando sesión:', error);
    window.location.href = '/';
  }
}
