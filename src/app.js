const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger/config');

const express = require('express');
const dotenv = require('dotenv');

// 1. Importar TODOS los módulos de rutas
const authRoutes = require('./routes/auth'); 
const prestamosRoutes = require('./routes/prestamos'); 
const librosRoutes = require('./routes/libros'); // <-- Aquí estaba el cable suelto 🔌

dotenv.config();

const app = express();

// 2. Middlewares globales obligatorios (Siempre ARRIBA de las rutas)
app.use(express.json());
// Ruta para la Documentación de la API
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));
// 3. Enlazar las rutas con sus respectivos prefijos
app.use('/api/auth', authRoutes);
app.use('/api/prestamos', prestamosRoutes); 
app.use('/api/libros', librosRoutes); // <-- Aquí le decimos a Express que reconozca /api/libros 📚

// Ruta de prueba inicial de la raíz
app.get('/', (req, res) => {
    res.json({
        mensaje: "Bienvenido a la API de BiblioTrack 📚",
        estado: "Funcionando correctamente"
    });
});

// 4. Encender el servidor (Aseguramos el arranque en el puerto 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;