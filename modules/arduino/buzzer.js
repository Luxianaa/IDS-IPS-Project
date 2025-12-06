const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

let port = null;
let isConnected = false;

// Conectar Arduino
async function conectarArduino(portName = 'COM3') {
  try {
    port = new SerialPort({
      path: portName,
      baudRate: 9600
    });

    const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));
    
    parser.on('data', (data) => {
      console.log('[Arduino]', data);
    });

    port.on('open', () => {
      isConnected = true;
      console.log(`Arduino conectado en ${portName} - Alarma lista`);
      
      // Test inicial después de 2 segundos
      setTimeout(() => {
        if (isConnected) {
          port.write('TEST\n');
        }
      }, 2000);
    });

    port.on('error', (err) => {
      console.error('Error Arduino:', err.message);
      isConnected = false;
    });

    port.on('close', () => {
      isConnected = false;
      console.log('Arduino desconectado');
    });

  } catch (error) {
    console.error('No se pudo conectar Arduino:', error.message);
    console.log('Tip: Verifica el puerto COM en Arduino IDE > Herramientas > Puerto');
  }
}

// Activar alarma según severidad
function activarAlarma(severity = 'high') {
  console.log(`[DEBUG] activarAlarma llamada con severity: ${severity}`);
  console.log(`[DEBUG] Arduino conectado: ${isConnected}`);
  
  if (!isConnected || !port) {
    console.log('[DEBUG] No se puede activar alarma - Arduino no conectado');
    return;
  }

  try {
    if (severity === 'critical') {
      port.write('CRITICAL\n');
      console.log('[ARDUINO] Alarma CRÍTICA activada');
    } else {
      port.write('ATTACK\n');
      console.log('[ARDUINO] Alarma de ataque activada');
    }
  } catch (error) {
    console.error('[ARDUINO] Error al activar alarma:', error.message);
  }
}

// Función de prueba manual
function testAlarma() {
  console.log('[TEST] Probando alarma...');
  if (!isConnected || !port) {
    console.log('[TEST] Arduino no conectado');
    return;
  }
  port.write('TEST\n');
  console.log('[TEST] Comando TEST enviado');
}

module.exports = { conectarArduino, activarAlarma, testAlarma };
