# 🌤️ Weather App

A responsive, lightweight Weather Web Application built with vanilla HTML, CSS, and JavaScript.

## ✨ Features
- **Instant Weather Lookup**: Search current weather for any city worldwide.
- **Zero-Setup Default**: Uses the free Open-Meteo API by default (no API key required).
- **OpenWeatherMap Support**: Optional support for personal OpenWeatherMap API keys with automatic fallback.
- **Keyboard Friendly**: Press `Enter` in the search bar to fetch weather instantly.
- **Detailed Metrics**: Displays temperature, weather conditions, humidity, and wind speed.
- **Responsive & Modern Design**: Clean card interface with loading and error states.

## 🚀 How to Run
Simply open `index.html` in any modern web browser:
1. Double-click `index.html`.
2. Enter a city name (e.g. `London`, `Tokyo`, `New York`) and click **Get Weather** or press **Enter**.

## ⚙️ Configuration (Optional)
If you want to use your personal [OpenWeatherMap](https://openweathermap.org/) API key:
1. Open `script.js`.
2. Paste your 32-character API key into `openWeatherApiKey`:
   ```javascript
   const openWeatherApiKey = "YOUR_API_KEY_HERE";
   ```
3. Save the file and refresh your browser.
