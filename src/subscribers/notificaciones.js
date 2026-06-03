const Redis = require('ioredis');

// 1. Configurar las conexiones de Upstash directamente aquí para evitar errores de rutas
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("🔴 ERROR: La variable REDIS_URL no está configurada en Render.");
}

// Creamos los dos clientes requeridos por la consigna
const pubClient = new Redis(redisUrl);
const subClient = new Redis(redisUrl);

pubClient.on('connect', () => console.log('🛑 Redis Publicador conectado a Upstash'));
subClient.on('connect', () => console.log('📥 Redis Suscriptor conectado a Upstash'));

function iniciarSuscriptor(io) {
    // Escuchar los canales obligatorios de tu BiblioTrack
    subClient.subscribe('biblio:prestamo:creado', 'biblio:devolucion', (err, count) => {
        if (err) {
            console.error('🔴 Error al suscribirse a los canales de Redis:', err.message);
            return;
        }
        console.log(`📡 Suscriptor Redis activo escuchando ${count} canales.`);
    });

    subClient.on('message', (channel, message) => {
        console.log(`📩 Evento recibido en canal Redis [${channel}]:`, message);
        const data = JSON.parse(message);

        if (channel === 'biblio:prestamo:creado') {
            io.emit('notificacion:prestamo', {
                texto: `📚 ¡Nuevo préstamo! El libro "${data.titulo}" fue entregado a ${data.usuario}.`
            });
        }
        if (channel === 'biblio:devolucion') {
            io.emit('notificacion:devolucion', {
                texto: `✅ ¡Devolución registrada! El libro "${data.titulo}" ya está disponible en stock.`
            });
        }
    });
}

// Exportamos tanto el publicador (para las rutas) como la función de arranque
module.exports = { iniciarSuscriptor, pubClient };