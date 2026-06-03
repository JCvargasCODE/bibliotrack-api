const Redis = require('ioredis');

// Lee la URL de tu base de datos Upstash desde las variables de entorno de Render
const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
    console.error("🔴 ERROR: La variable REDIS_URL no está configurada.");
}

// Requisito de la Consigna: DOS conexiones separadas (Pub y Sub)
const pubClient = new Redis(redisUrl);
const subClient = new Redis(redisUrl);

pubClient.on('connect', () => console.log('🛑 Redis Publicador conectado a Upstash'));
subClient.on('connect', () => console.log('📥 Redis Suscriptor conectado a Upstash'));

module.exports = { pubClient, subClient };