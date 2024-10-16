// netlify/functions/getWeather.js
const fetch = require('node-fetch');

exports.handler = async (event) => {
    const apiKey = '84eeb2d3645b5c1bfd6c4e9cea29db2a';
    const city = 'Sabinas Hidalgo';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=es`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching weather data' }),
        };
    }
};
