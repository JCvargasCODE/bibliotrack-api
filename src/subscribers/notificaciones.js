const { subClient } = require('../redis/client');

function iniciarSuscriptor(io) {
    // Nos suscribimos a los canales obligatorios de tu proyecto BiblioTrack
    subClient.subscribe('biblio:prestamo:creado', 'biblio:devolucion', (err, count) => {
        if (err) {
            console.error('🔴 Error al suscribirse a los canales de Redis:', err.message);
            return;
        }
        console.log(`📡 Suscriptor Redis activo escuchando ${count} canales.`);
    });

    // Captura los mensajes que llegan desde Upstash
    subClient.on('message', (channel, message) => {
        console.log(`📩 Evento recibido en canal Redis [${channel}]:`, message);
        const data = JSON.parse(message);

        // Reenviar al cliente web por WebSockets sin recargar la página
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

module.exports = { iniciarSuscriptor };