const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');

// 1. Forzar un puerto por defecto (3000) si el archivo .env no se lee bien
const PORT = process.env.PORT || 3000;

// 2. Crear el servidor HTTP vinculando nuestra app de Express
const server = http.createServer(app);

// 3. Inicializar Socket.io acoplado al servidor
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Compartir la instancia de io de forma global
app.set('io', io);

// Escuchar conexiones de sockets
io.on('connection', (socket) => {
    console.log(`⚡ Cliente conectado via WebSockets: ${socket.id}`);
    
    socket.on('disconnect', () => {
        console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
});

// 4. Forzar el encendido del servidor y mantener el proceso de Node activo
server.listen(PORT, '0.0.0.0', () => {
    console.log(`==================================================`);
    console.log(`📚 BIBLIOTRACK API LEVANTADA CON ÉXITO`);
    console.log(`🚀 Servidor escuchando en: http://localhost:${PORT}`);
    console.log(`==================================================`);
});

// Capturar errores si el puerto está ocupado
server.on('error', (error) => {
    console.error("🔴 Error crítico al iniciar el servidor HTTP:", error.message);
});