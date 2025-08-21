/**
 * Clock Widget - Digital and analog clock with timezone support
 */

export class ClockWidget {
    static type = 'clock';
    static title = 'Clock';
    static description = 'Digital and analog clock with timezone support';
    
    constructor(config = {}) {
        this.config = {
            format: '12', // 12 or 24 hour
            showSeconds: true,
            showDate: true,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            clockType: 'digital', // digital or analog
            title: 'Clock',
            ...config
        };
        
        this.element = null;
        this.updateTimer = null;
        this.isVisible = true;
        
        this.bindMethods();
    }

    bindMethods() {
        this.updateTime = this.updateTime.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item clock-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Clock widget');
        
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
                <div class="clock-widget" id="clock-content">
                    ${this.renderClock()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderClock() {
        if (this.config.clockType === 'analog') {
            return this.renderAnalogClock();
        } else {
            return this.renderDigitalClock();
        }
    }

    renderDigitalClock() {
        return `
            <div class="clock-time" id="clock-time" aria-live="polite">
                --:--:--
            </div>
            ${this.config.showDate ? '<div class="clock-date" id="clock-date"></div>' : ''}
            <div class="clock-timezone" id="clock-timezone">${this.getTimezoneName()}</div>
        `;
    }

    renderAnalogClock() {
        return `
            <div class="clock-analog" aria-label="Analog clock">
                <div class="clock-numbers">
                    ${this.renderClockNumbers()}
                </div>
                <div class="clock-hand hour" id="hour-hand"></div>
                <div class="clock-hand minute" id="minute-hand"></div>
                ${this.config.showSeconds ? '<div class="clock-hand second" id="second-hand"></div>' : ''}
                <div class="clock-center"></div>
            </div>
            ${this.config.showDate ? '<div class="clock-date" id="clock-date"></div>' : ''}
            <div class="clock-timezone" id="clock-timezone">${this.getTimezoneName()}</div>
        `;
    }

    renderClockNumbers() {
        let numbers = '';
        for (let i = 1; i <= 12; i++) {
            const angle = (i * 30) - 90; // Convert to degrees from top
            const x = 50 + 35 * Math.cos(angle * Math.PI / 180);
            const y = 50 + 35 * Math.sin(angle * Math.PI / 180);
            
            numbers += `
                <div class="clock-number" style="left: ${x - 10}px; top: ${y - 10}px;">
                    ${i}
                </div>
            `;
        }
        return numbers;
    }

    async init() {
        this.startClock();
        this.setupEventListeners();
        console.log('Clock widget initialized');
    }

    setupEventListeners() {
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle refresh
        this.element.addEventListener('refresh', () => {
            this.updateTime();
        });
        
        // Handle configuration updates
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
    }

    startClock() {
        this.updateTime();
        this.updateTimer = setInterval(this.updateTime, 1000);
    }

    stopClock() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    updateTime() {
        if (!this.isVisible) return;

        try {
            const now = new Date();
            
            if (this.config.clockType === 'analog') {
                this.updateAnalogClock(now);
            } else {
                this.updateDigitalClock(now);
            }
            
            if (this.config.showDate) {
                this.updateDate(now);
            }
        } catch (error) {
            console.error('Error updating clock:', error);
        }
    }

    updateDigitalClock(date) {
        const timeElement = this.element.querySelector('#clock-time');
        if (!timeElement) return;

        const options = {
            timeZone: this.config.timezone,
            hour12: this.config.format === '12',
            hour: '2-digit',
            minute: '2-digit'
        };

        if (this.config.showSeconds) {
            options.second = '2-digit';
        }

        const timeString = date.toLocaleTimeString([], options);
        timeElement.textContent = timeString;
    }

    updateAnalogClock(date) {
        // Get time in specified timezone
        const timeInZone = new Date(date.toLocaleString("en-US", {timeZone: this.config.timezone}));
        
        const hours = timeInZone.getHours() % 12;
        const minutes = timeInZone.getMinutes();
        const seconds = timeInZone.getSeconds();

        // Calculate angles (0 degrees = 12 o'clock)
        const hourAngle = (hours * 30) + (minutes * 0.5); // 30 degrees per hour + minute adjustment
        const minuteAngle = minutes * 6; // 6 degrees per minute
        const secondAngle = seconds * 6; // 6 degrees per second

        // Update hand positions
        const hourHand = this.element.querySelector('#hour-hand');
        const minuteHand = this.element.querySelector('#minute-hand');
        const secondHand = this.element.querySelector('#second-hand');

        if (hourHand) {
            hourHand.style.transform = `rotate(${hourAngle}deg)`;
        }
        
        if (minuteHand) {
            minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
        }
        
        if (secondHand && this.config.showSeconds) {
            secondHand.style.transform = `rotate(${secondAngle}deg)`;
        }
    }

    updateDate(date) {
        const dateElement = this.element.querySelector('#clock-date');
        if (!dateElement) return;

        const options = {
            timeZone: this.config.timezone,
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };

        const dateString = date.toLocaleDateString([], options);
        dateElement.textContent = dateString;
    }

    getTimezoneName() {
        try {
            const shortName = this.config.timezone.split('/').pop().replace(/_/g, ' ');
            return shortName;
        } catch (error) {
            return this.config.timezone;
        }
    }

    handleVisibilityChange() {
        this.isVisible = !document.hidden;
        
        if (this.isVisible) {
            this.updateTime();
            if (!this.updateTimer) {
                this.startClock();
            }
        } else {
            this.stopClock();
        }
    }

    updateConfig(newConfig) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...newConfig };
        
        // Check if we need to re-render
        const needsRerender = 
            oldConfig.clockType !== this.config.clockType ||
            oldConfig.showSeconds !== this.config.showSeconds ||
            oldConfig.showDate !== this.config.showDate;
        
        if (needsRerender) {
            const content = this.element.querySelector('#clock-content');
            content.innerHTML = this.renderClock();
        }
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // Update timezone display
        const timezoneElement = this.element.querySelector('#clock-timezone');
        if (timezoneElement) {
            timezoneElement.textContent = this.getTimezoneName();
        }
        
        // Force update
        this.updateTime();
    }

    getSettingsForm(config) {
        const timezones = [
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Kolkata',
            'Australia/Sydney',
            'Pacific/Auckland'
        ];

        return `
            <div class="form-group">
                <label class="form-label" for="clock-format">Time Format</label>
                <select id="clock-format" name="format" class="form-select">
                    <option value="12" ${config.format === '12' ? 'selected' : ''}>12 Hour</option>
                    <option value="24" ${config.format === '24' ? 'selected' : ''}>24 Hour</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="clock-type">Clock Type</label>
                <select id="clock-type" name="clockType" class="form-select">
                    <option value="digital" ${config.clockType === 'digital' ? 'selected' : ''}>Digital</option>
                    <option value="analog" ${config.clockType === 'analog' ? 'selected' : ''}>Analog</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="clock-timezone">Timezone</label>
                <select id="clock-timezone" name="timezone" class="form-select">
                    ${timezones.map(tz => `
                        <option value="${tz}" ${config.timezone === tz ? 'selected' : ''}>
                            ${tz.replace(/_/g, ' ')}
                        </option>
                    `).join('')}
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="clock-show-seconds" name="showSeconds" 
                           ${config.showSeconds ? 'checked' : ''} class="form-checkbox">
                    Show Seconds
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="clock-show-date" name="showDate" 
                           ${config.showDate ? 'checked' : ''} class="form-checkbox">
                    Show Date
                </label>
            </div>
        `;
    }

    pause() {
        this.isVisible = false;
        this.stopClock();
    }

    resume() {
        this.isVisible = true;
        this.startClock();
    }

    refresh() {
        this.updateTime();
    }

    destroy() {
        this.stopClock();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}