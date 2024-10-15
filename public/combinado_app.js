// Tu clave API gratuita de OpenWeatherMap
const apiKey = '84eeb2d3645b5c1bfd6c4e9cea29db2a';

// Función para obtener el clima actual usando la API gratuita
function getCurrentWeather(city = 'Sabinas Hidalgo') {
    const weatherInfoDiv = document.getElementById('weatherInfo');
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;

    fetch(url)
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

// Llamar a la función cuando el DOM se haya cargado
document.addEventListener('DOMContentLoaded', () => {
    getCurrentWeather('Sabinas Hidalgo');
});
