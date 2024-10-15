import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 3000;

// Solución para reemplazar __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir la página principal con 'index.html'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener noticias y devolverlas como JSON
app.get('/api/noticias', async (req, res) => {
    try {
        // Llamar a la API para obtener las noticias más recientes
        const response = await fetch('https://newsapi.org/v2/everything?q=Sabinas+Hidalgo&pageSize=10&sortBy=publishedAt&apiKey=e5c8da781cff4f74b63bbe36b4363d8c');
        const data = await response.json();
        res.json(data.articles); // Devolver solo las noticias como JSON
    } catch (error) {
        console.error('Error al obtener las noticias:', error);
        res.status(500).json({ error: 'Hubo un error al cargar las noticias.' });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
