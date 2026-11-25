// ==========================================
// Weather App Configuration
// ==========================================
// If you have a personal OpenWeatherMap API key, paste it here.
// Note: If left empty or if the key is invalid, the app automatically
// uses Open-Meteo (free, no API key required) so the app always works!
const openWeatherApiKey = "";

// Attach Enter key listener on cityInput
function setupInputListener() {
  const input = document.getElementById("cityInput");
  if (input) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        getWeather();
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupInputListener);
} else {
  setupInputListener();
}

// WMO Weather code interpreter for Open-Meteo
const wmoWeatherMap = {
  0: { main: "Clear", description: "Clear sky", icon: "☀️" },
  1: { main: "Mainly Clear", description: "Mainly clear sky", icon: "🌤️" },
  2: { main: "Partly Cloudy", description: "Partly cloudy", icon: "⛅" },
  3: { main: "Overcast", description: "Overcast clouds", icon: "☁️" },
  45: { main: "Fog", description: "Foggy", icon: "🌫️" },
  48: { main: "Fog", description: "Depositing rime fog", icon: "🌫️" },
  51: { main: "Drizzle", description: "Light drizzle", icon: "🌦️" },
  53: { main: "Drizzle", description: "Moderate drizzle", icon: "🌦️" },
  55: { main: "Drizzle", description: "Dense drizzle", icon: "🌧️" },
  56: { main: "Freezing Drizzle", description: "Light freezing drizzle", icon: "🌧️" },
  57: { main: "Freezing Drizzle", description: "Dense freezing drizzle", icon: "🌧️" },
  61: { main: "Rain", description: "Slight rain", icon: "🌧️" },
  63: { main: "Rain", description: "Moderate rain", icon: "🌧️" },
  65: { main: "Rain", description: "Heavy rain", icon: "🌧️" },
  66: { main: "Freezing Rain", description: "Light freezing rain", icon: "🌨️" },
  67: { main: "Freezing Rain", description: "Heavy freezing rain", icon: "🌨️" },
  71: { main: "Snow", description: "Slight snowfall", icon: "🌨️" },
  73: { main: "Snow", description: "Moderate snowfall", icon: "🌨️" },
  75: { main: "Snow", description: "Heavy snowfall", icon: "❄️" },
  77: { main: "Snow Grains", description: "Snow grains", icon: "❄️" },
  80: { main: "Rain Showers", description: "Slight rain showers", icon: "🌦️" },
  81: { main: "Rain Showers", description: "Moderate rain showers", icon: "🌦️" },
  82: { main: "Rain Showers", description: "Violent rain showers", icon: "⛈️" },
  85: { main: "Snow Showers", description: "Slight snow showers", icon: "🌨️" },
  86: { main: "Snow Showers", description: "Heavy snow showers", icon: "🌨️" },
  95: { main: "Thunderstorm", description: "Thunderstorm", icon: "⛈️" },
  96: { main: "Thunderstorm", description: "Thunderstorm with hail", icon: "⛈️" },
  99: { main: "Thunderstorm", description: "Thunderstorm with heavy hail", icon: "⛈️" },
};

async function getWeather() {
  const cityInput = document.getElementById("cityInput");
  const resultDiv = document.getElementById("weatherResult");
  const city = cityInput.value.trim();

  if (!city) {
    showError("Please enter a city name.");
    return;
  }

  // Show loading state
  resultDiv.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Fetching weather for <strong>${escapeHtml(city)}</strong>...</p>
    </div>
  `;

  // 1. If OpenWeatherMap API key is provided and looks valid, try OpenWeatherMap first
  if (openWeatherApiKey && openWeatherApiKey.trim().length === 32) {
    try {
      const owmData = await fetchOpenWeatherMap(city, openWeatherApiKey.trim());
      renderOpenWeatherMapData(owmData);
      return;
    } catch (err) {
      console.warn("OpenWeatherMap request failed:", err.message);
      // Fallback automatically to Open-Meteo
    }
  }

  // 2. Default/Fallback: Free Open-Meteo API (no API key required)
  try {
    const meteoData = await fetchOpenMeteo(city);
    renderOpenMeteoData(meteoData);
  } catch (err) {
    showError(err.message || "Failed to fetch weather data. Please try again.");
  }
}

// Fetch from OpenWeatherMap
async function fetchOpenWeatherMap(city, key) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`City "${city}" not found. Please check spelling.`);
    } else if (response.status === 401) {
      throw new Error("Invalid OpenWeatherMap API key.");
    } else {
      throw new Error(data.message || "Failed to fetch weather from OpenWeatherMap.");
    }
  }

  return data;
}

// Fetch from Open-Meteo (Geocoding + Current Weather)
async function fetchOpenMeteo(city) {
  // Step 1: Geocode city name to lat/lon coordinates
  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
  const geoRes = await fetch(geoUrl);
  
  if (!geoRes.ok) {
    throw new Error("Geocoding service unavailable. Please check your network.");
  }

  const geoData = await geoRes.json();
  if (!geoData.results || geoData.results.length === 0) {
    throw new Error(`City "${city}" not found. Please check the spelling.`);
  }

  const location = geoData.results[0];
  const { latitude, longitude, name, country, admin1 } = location;

  // Step 2: Fetch current weather for coordinates
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&wind_speed_unit=ms`;
  const weatherRes = await fetch(weatherUrl);

  if (!weatherRes.ok) {
    throw new Error("Weather forecast service is currently unreachable.");
  }

  const weatherData = await weatherRes.json();
  return {
    locationName: name,
    country: country || "",
    region: admin1 || "",
    current: weatherData.current
  };
}

// Render Open-Meteo weather
function renderOpenMeteoData(data) {
  const { locationName, country, region, current } = data;
  const weatherInfo = wmoWeatherMap[current.weather_code] || {
    main: "Unknown",
    description: "Current weather condition",
    icon: "🌡️"
  };

  const locationLabel = [locationName, region, country].filter(Boolean).join(", ");

  const resultHTML = `
    <div class="weather-card">
      <div class="weather-header">
        <span class="weather-icon">${weatherInfo.icon}</span>
        <div>
          <h2>${escapeHtml(locationLabel)}</h2>
          <span class="condition-badge">${weatherInfo.main}</span>
        </div>
      </div>
      <div class="temp-display">${Math.round(current.temperature_2m)}°C</div>
      <div class="weather-details">
        <p><strong>📝 Condition:</strong> ${weatherInfo.description}</p>
        <p><strong>💧 Humidity:</strong> ${current.relative_humidity_2m}%</p>
        <p><strong>💨 Wind Speed:</strong> ${current.wind_speed_10m} m/s</p>
      </div>
    </div>
  `;

  document.getElementById("weatherResult").innerHTML = resultHTML;
}

// Render OpenWeatherMap data
function renderOpenWeatherMapData(data) {
  const iconCode = data.weather && data.weather[0] ? data.weather[0].icon : "";
  const iconUrl = iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : "";

  const resultHTML = `
    <div class="weather-card">
      <div class="weather-header">
        ${iconUrl ? `<img class="weather-img" src="${iconUrl}" alt="${data.weather[0].main}">` : `<span class="weather-icon">🌤️</span>`}
        <div>
          <h2>${escapeHtml(data.name)}, ${escapeHtml(data.sys.country)}</h2>
          <span class="condition-badge">${escapeHtml(data.weather[0].main)}</span>
        </div>
      </div>
      <div class="temp-display">${Math.round(data.main.temp)}°C</div>
      <div class="weather-details">
        <p><strong>📝 Condition:</strong> ${escapeHtml(data.weather[0].description)}</p>
        <p><strong>💧 Humidity:</strong> ${data.main.humidity}%</p>
        <p><strong>💨 Wind Speed:</strong> ${data.wind.speed} m/s</p>
      </div>
    </div>
  `;

  document.getElementById("weatherResult").innerHTML = resultHTML;
}

function showError(message) {
  document.getElementById("weatherResult").innerHTML = `
    <div class="error-box">
      <span class="error-icon">⚠️</span>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
