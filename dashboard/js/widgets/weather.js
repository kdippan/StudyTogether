/**
 * Weather Widget - Current weather conditions and forecast
 */

export class WeatherWidget {
    static type = 'weather';
    static title = 'Weather';
    static description = 'Current weather conditions and forecast';
    
    constructor(config = {}) {
        this.config = {
            city: 'New York',
            units: 'metric', // metric, imperial
            showForecast: false,
            refreshInterval: 10, // minutes
            title: 'Weather',
            ...config
        };
        
        this.element = null;
        this.refreshTimer = null;
        this.isVisible = true;
        this.isOffline = false;
        
        // Mock data for offline/demo mode
        this.mockData = {
            location: 'Demo City',
            temperature: 22,
            description: 'Partly cloudy',
            humidity: 65,
            windSpeed: 12,
            pressure: 1013,
            icon: '⛅'
        };
        
        this.bindMethods();
    }

    bindMethods() {
        this.fetchWeather = this.fetchWeather.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item weather-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Weather widget');
        
        this.element.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${this.config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-drag-handle btn btn-icon btn-sm tooltip" 
                            aria-label="Drag to move" title="Drag to move">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-drag"></use>
                        </svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" 
                            data-action="refresh" 
                            aria-label="Refresh weather" title="Refresh">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-refresh"></use>
                        </svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" 
                            data-action="settings" 
                            aria-label="Widget settings" title="Settings">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-settings"></use>
                        </svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" 
                            data-action="minimize" 
                            aria-label="Minimize widget" title="Minimize">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-minimize"></use>
                        </svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" 
                            data-action="remove" 
                            aria-label="Remove widget" title="Remove">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-close"></use>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="weather-widget" id="weather-content">
                    ${this.renderLoading()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderLoading() {
        return `
            <div class="widget-loading">
                <div class="spinner"></div>
                <span>Loading weather...</span>
            </div>
        `;
    }

    renderWeather(data) {
        const tempUnit = this.config.units === 'metric' ? '°C' : '°F';
        const windUnit = this.config.units === 'metric' ? 'km/h' : 'mph';
        
        return `
            ${this.isOffline ? '<div class="weather-offline">⚠️ Offline / Demo Mode</div>' : ''}
            
            <div class="weather-current">
                <div class="weather-icon" aria-hidden="true">
                    ${data.icon}
                </div>
                <div class="weather-main">
                    <h2 class="weather-temp">${Math.round(data.temperature)}${tempUnit}</h2>
                    <p class="weather-description">${data.description}</p>
                    <p class="weather-location">${data.location}</p>
                </div>
            </div>
            
            <div class="weather-details">
                <div class="weather-detail">
                    <span class="weather-label">Humidity</span>
                    <span class="weather-value">${data.humidity}%</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-label">Wind</span>
                    <span class="weather-value">${data.windSpeed} ${windUnit}</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-label">Pressure</span>
                    <span class="weather-value">${data.pressure} hPa</span>
                </div>
                <div class="weather-detail">
                    <span class="weather-label">Updated</span>
                    <span class="weather-value">${new Date().toLocaleTimeString([], {timeStyle: 'short'})}</span>
                </div>
            </div>
        `;
    }

    renderError(message) {
        return `
            <div class="widget-error">
                <svg class="icon icon-lg" aria-hidden="true">
                    <use href="./assets/icons.svg#icon-cloud"></use>
                </svg>
                <p>Failed to load weather</p>
                <small>${message}</small>
                <button class="btn btn-sm widget-error-retry" onclick="this.closest('.weather-widget-container').dispatchEvent(new CustomEvent('refresh'))">
                    Retry
                </button>
            </div>
        `;
    }

    async init() {
        await this.fetchWeather();
        this.startRefreshTimer();
        this.setupEventListeners();
        console.log('Weather widget initialized');
    }

    setupEventListeners() {
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle refresh
        this.element.addEventListener('refresh', () => {
            this.fetchWeather();
        });
        
        // Handle configuration updates
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
    }

    startRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        const intervalMs = this.config.refreshInterval * 60 * 1000;
        this.refreshTimer = setInterval(() => {
            if (this.isVisible) {
                this.fetchWeather();
            }
        }, intervalMs);
    }

    stopRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    async fetchWeather() {
        const content = this.element.querySelector('#weather-content');
        
        try {
            // Show loading state
            content.innerHTML = this.renderLoading();
            
            // Try to fetch real weather data
            const weatherData = await this.getWeatherData();
            this.isOffline = false;
            content.innerHTML = this.renderWeather(weatherData);
            
        } catch (error) {
            console.warn('Failed to fetch weather data, using mock data:', error);
            
            // Use mock data as fallback
            this.isOffline = true;
            const mockWeatherData = this.getMockWeatherData();
            content.innerHTML = this.renderWeather(mockWeatherData);
        }
    }

    async getWeatherData() {
        // For demo purposes, we'll use a free weather API
        // In a real implementation, you'd use OpenWeatherMap, WeatherAPI, or similar
        
        // Check if we have an API key in config
        if (!this.config.apiKey) {
            throw new Error('No API key configured');
        }
        
        const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(this.config.city)}&appid=${this.config.apiKey}&units=${this.config.units}`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            location: `${data.name}, ${data.sys.country}`,
            temperature: data.main.temp,
            description: data.weather[0].description,
            humidity: data.main.humidity,
            windSpeed: Math.round(data.wind.speed * (this.config.units === 'metric' ? 3.6 : 2.237)), // Convert m/s
            pressure: data.main.pressure,
            icon: this.getWeatherIcon(data.weather[0].icon, data.weather[0].main)
        };
    }

    getMockWeatherData() {
        // Generate some realistic mock data
        const cities = ['Demo City', 'Sample Town', 'Test Village'];
        const descriptions = ['Partly cloudy', 'Sunny', 'Light rain', 'Overcast', 'Clear sky'];
        const icons = ['☀️', '⛅', '🌤️', '☁️', '🌧️', '⛈️', '❄️'];
        
        const city = this.config.city || cities[Math.floor(Math.random() * cities.length)];
        const baseTemp = this.config.units === 'metric' ? 20 : 68;
        const tempVariation = (Math.random() - 0.5) * 20;
        
        return {
            location: city,
            temperature: baseTemp + tempVariation,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            humidity: 50 + Math.floor(Math.random() * 40),
            windSpeed: Math.floor(Math.random() * 30),
            pressure: 1000 + Math.floor(Math.random() * 50),
            icon: icons[Math.floor(Math.random() * icons.length)]
        };
    }

    getWeatherIcon(iconCode, condition) {
        // Map OpenWeatherMap icons to emoji
        const iconMap = {
            '01d': '☀️', '01n': '🌙',
            '02d': '🌤️', '02n': '☁️',
            '03d': '☁️', '03n': '☁️',
            '04d': '☁️', '04n': '☁️',
            '09d': '🌧️', '09n': '🌧️',
            '10d': '🌦️', '10n': '🌧️',
            '11d': '⛈️', '11n': '⛈️',
            '13d': '❄️', '13n': '❄️',
            '50d': '🌫️', '50n': '🌫️'
        };
        
        return iconMap[iconCode] || '🌤️';
    }

    handleVisibilityChange() {
        this.isVisible = !document.hidden;
        
        if (this.isVisible) {
            // Resume refresh timer
            this.startRefreshTimer();
        } else {
            // Pause refresh timer to save resources
            this.stopRefreshTimer();
        }
    }

    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // If city or units changed, refresh weather
        if (oldConfig.city !== this.config.city || 
            oldConfig.units !== this.config.units ||
            oldConfig.apiKey !== this.config.apiKey) {
            this.fetchWeather();
        }
        
        // If refresh interval changed, restart timer
        if (oldConfig.refreshInterval !== this.config.refreshInterval) {
            this.startRefreshTimer();
        }
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="weather-city">City</label>
                <input type="text" id="weather-city" name="city" class="form-input" 
                       value="${config.city || ''}" placeholder="Enter city name">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-units">Units</label>
                <select id="weather-units" name="units" class="form-select">
                    <option value="metric" ${config.units === 'metric' ? 'selected' : ''}>Metric (°C)</option>
                    <option value="imperial" ${config.units === 'imperial' ? 'selected' : ''}>Imperial (°F)</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-refresh">Refresh Interval (minutes)</label>
                <select id="weather-refresh" name="refreshInterval" class="form-select">
                    <option value="5" ${config.refreshInterval === 5 ? 'selected' : ''}>5 minutes</option>
                    <option value="10" ${config.refreshInterval === 10 ? 'selected' : ''}>10 minutes</option>
                    <option value="15" ${config.refreshInterval === 15 ? 'selected' : ''}>15 minutes</option>
                    <option value="30" ${config.refreshInterval === 30 ? 'selected' : ''}>30 minutes</option>
                    <option value="60" ${config.refreshInterval === 60 ? 'selected' : ''}>1 hour</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="weather-api-key">API Key (Optional)</label>
                <input type="password" id="weather-api-key" name="apiKey" class="form-input" 
                       value="${config.apiKey || ''}" 
                       placeholder="OpenWeatherMap API key for live data">
                <small class="form-help">
                    Get a free API key from <a href="https://openweathermap.org/api" target="_blank" rel="noopener">OpenWeatherMap</a>. 
                    Without an API key, demo data will be shown.
                </small>
            </div>
        `;
    }

    pause() {
        this.isVisible = false;
        this.stopRefreshTimer();
    }

    resume() {
        this.isVisible = true;
        this.startRefreshTimer();
    }

    refresh() {
        this.fetchWeather();
    }

    destroy() {
        this.stopRefreshTimer();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}