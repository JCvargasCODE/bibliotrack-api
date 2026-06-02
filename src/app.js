const express = require('express');
const dotenv = require('dotenv');

// Configurar variables de entorno
dotenv.config();

const app = express();

// Middlewares globales obligatorios
app.use(express.json()); // Para procesar respuestas JSON consistentes [cite: 42]

// Ruta de prueba inicial para verificar que la API responde
app.get('/', (req, res) => {
    res.json({
        mensaje: "Bienvenido a la API de BiblioTrack 📚",
        estado: "Funcionando correctamente"
    });
});

module.exports = app;