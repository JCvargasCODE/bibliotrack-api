const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'BiblioTrack API',
            version: '1.0.0',
            description: 'Sistema Distribuido de Seguimiento de Préstamos de Biblioteca - UPDS 2026',
        },
        servers: [
            {
                url: 'https://bibliotrack-api.onrender.com',
                description: 'Servidor de Producción (Render)',
            },
            {
                url: 'http://localhost:3000',
                description: 'Servidor Local',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Introduce tu token JWT en el formato: Bearer <token>',
                },
            },
        },
    },
    apis: ['./src/routes/*.js'], // Va a leer la documentación directamente desde tus archivos de rutas
};

const specs = swaggerJsdoc(options);
module.exports = specs;