const fetch = require('node-fetch');

exports.handler = async (event) => {
    const url = `https://newsapi.org/v2/everything?q=Sabinas+Hidalgo&pageSize=10&sortBy=publishedAt&apiKey=e5c8da781cff4f74b63bbe36b4363d8c`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            statusCode: 200,
            body: JSON.stringify(data.articles),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error fetching news data' }),
        };
    }
};
