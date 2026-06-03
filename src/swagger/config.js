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
        // 🔥 DECLARAMOS LAS RUTAS DIRECTAMENTE AQUÍ PARA EVITAR ERRORES DE ESCANEO
        paths: {
            '/api/auth/login': {
                post: {
                    summary: 'Iniciar sesión de usuario',
                    tags: ['Autenticación'],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['email', 'password'],
                                    properties: {
                                        email: { type: 'string', example: 'admin@bibliotrack.com' },
                                        password: { type: 'string', example: '123456' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        200: { description: 'Login exitoso, devuelve el token JWT' },
                        401: { description: 'Credenciales incorrectas' }
                    }
                }
            },
            '/api/prestamos': {
                get: {
                    summary: 'Obtener todos los préstamos (Admin/Bibliotecario)',
                    tags: ['Préstamos'],
                    security: [{ bearerAuth: [] }],
                    responses: {
                        200: { description: 'Lista global obtenida con éxito' },
                        401: { description: 'No autorizado' }
                    }
                },
                post: {
                    summary: 'Registrar un nuevo préstamo de libro',
                    tags: ['Préstamos'],
                    security: [{ bearerAuth: [] }],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    required: ['libroId'],
                                    properties: {
                                        libroId: { type: 'string', example: 'id-de-un-libro-aqui' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        201: { description: 'Préstamo registrado y notificado por Redis' },
                        400: { description: 'Error en la solicitud o límite excedido' }
                    }
                }
            }
        }
    },
    apis: [], // Dejamos esto vacío ya que lo definimos arriba de forma segura
};

const specs = swaggerJsdoc(options);
module.exports = specs;