// Función para obtener el clima actual usando la API de Netlify
function getCurrentWeather() {
    const weatherInfoDiv = document.getElementById('weatherInfo');
    const weatherUrl = '/.netlify/functions/getWeather';

    fetch(weatherUrl)
        .then(response => response.json())
        .then(data => {
            if (data.cod === 200) {
                const lat = data.coord.lat;
                const lon = data.coord.lon;
                initMap(lat, lon); // Mostrar mapa

                const iconUrl = `http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
                const weather = `
                    <p><strong>Clima en ${data.name}, ${data.sys.country}:</strong></p>
                    <p><img src="${iconUrl}" alt="${data.weather[0].description}"></p>
                    <p>Temperatura actual: ${data.main.temp} °C</p>
                    <p>Sensación térmica: ${data.main.feels_like} °C</p>
                    <p>Humedad: ${data.main.humidity}%</p>
                    <p>Presión atmosférica: ${data.main.pressure} hPa</p>
                    <p>Viento: ${data.wind.speed} m/s</p>
                    <p>Descripción: ${data.weather[0].description}</p>
                `;
                weatherInfoDiv.innerHTML = weather;
            } else {
                weatherInfoDiv.innerHTML = `<p>Error: ${data.message}</p>`;
            }
        })
        .catch(error => {
            weatherInfoDiv.innerHTML = '<p>Ocurrió un error. Por favor, intenta más tarde.</p>';
        });
}

// Inicializar el mapa con la ciudad
let map;
function initMap(lat, lon) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);
    } else {
        map.setView([lat, lon], 10);
    }

    L.marker([lat, lon]).addTo(map);
}

// Función para cargar noticias usando la API de Netlify
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    const newsUrl = '/.netlify/functions/getNews';

    try {
        const response = await fetch(newsUrl);
        const articles = await response.json();
        
        if (articles && articles.length > 0) {
            let newsHTML = articles.map(article => `
                <div class="news-card">
                    <a href="${article.url}" target="_blank">
                        <img src="${article.urlToImage || 'https://via.placeholder.com/400x200'}" alt="Imagen de la noticia">
                        <div class="news-card-content">
                            <h2>${article.title}</h2>
                            <p>${article.description || 'Sin descripción disponible'}</p>
                        </div>
                    </a>
                </div>
            `).join('');
            newsContainer.innerHTML = newsHTML;
        } else {
            newsContainer.innerHTML = '<p>No se encontraron noticias sobre Sabinas Hidalgo.</p>';
        }
    } catch (error) {
        console.error('Error al cargar las noticias:', error);
        newsContainer.innerHTML = '<p>Hubo un error al cargar las noticias.</p>';
    }
}

// Llamar a las funciones cuando el DOM se haya cargado
document.addEventListener('DOMContentLoaded', () => {
    getCurrentWeather();
    loadNews();
});
