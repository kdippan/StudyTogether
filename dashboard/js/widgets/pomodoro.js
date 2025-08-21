/**
 * Pomodoro Widget - Focus timer with break cycles
 */

export class PomodoroWidget {
    static type = 'pomodoro';
    static title = 'Pomodoro Timer';
    static description = 'Focus timer with break cycles';
    
    constructor(config = {}) {
        this.config = {
            focusTime: 25, // minutes
            shortBreak: 5, // minutes
            longBreak: 15, // minutes
            cycles: 4, // cycles before long break
            title: 'Pomodoro Timer',
            ...config
        };
        
        this.element = null;
        this.timer = null;
        this.isRunning = false;
        this.currentSession = 'focus'; // focus, short-break, long-break
        this.currentCycle = 1;
        this.timeLeft = this.config.focusTime * 60; // in seconds
        
        this.bindMethods();
    }

    bindMethods() {
        this.tick = this.tick.bind(this);
        this.start = this.start.bind(this);
        this.pause = this.pause.bind(this);
        this.reset = this.reset.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item pomodoro-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Pomodoro timer widget');
        
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
                <div class="pomodoro-widget">
                    <div class="pomodoro-session">${this.getSessionName()}</div>
                    <div class="pomodoro-timer" id="pomodoro-timer">${this.formatTime(this.timeLeft)}</div>
                    <div class="pomodoro-controls">
                        <button class="btn btn-primary" id="pomodoro-start">
                            <svg class="icon" aria-hidden="true">
                                <use href="./assets/icons.svg#icon-play"></use>
                            </svg>
                            Start
                        </button>
                        <button class="btn btn-secondary" id="pomodoro-pause" style="display: none;">
                            <svg class="icon" aria-hidden="true">
                                <use href="./assets/icons.svg#icon-pause"></use>
                            </svg>
                            Pause
                        </button>
                        <button class="btn btn-ghost" id="pomodoro-reset">
                            <svg class="icon" aria-hidden="true">
                                <use href="./assets/icons.svg#icon-stop"></use>
                            </svg>
                            Reset
                        </button>
                    </div>
                    <div class="pomodoro-progress">
                        <div class="progress">
                            <div class="progress-bar" id="pomodoro-progress-bar" style="width: 0%;"></div>
                        </div>
                    </div>
                    <div class="pomodoro-settings">
                        <div class="pomodoro-setting">
                            <div class="pomodoro-setting-label">Cycle</div>
                            <div class="pomodoro-setting-value">${this.currentCycle}/${this.config.cycles}</div>
                        </div>
                        <div class="pomodoro-setting">
                            <div class="pomodoro-setting-label">Next</div>
                            <div class="pomodoro-setting-value">${this.getNextSession()}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return this.element;
    }

    async init() {
        this.setupEventListeners();
        this.updateDisplay();
        console.log('Pomodoro widget initialized');
    }

    setupEventListeners() {
        const startBtn = this.element.querySelector('#pomodoro-start');
        const pauseBtn = this.element.querySelector('#pomodoro-pause');
        const resetBtn = this.element.querySelector('#pomodoro-reset');
        
        startBtn.addEventListener('click', this.start);
        pauseBtn.addEventListener('click', this.pause);
        resetBtn.addEventListener('click', this.reset);
        
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
    }

    start() {
        this.isRunning = true;
        this.timer = setInterval(this.tick, 1000);
        
        const startBtn = this.element.querySelector('#pomodoro-start');
        const pauseBtn = this.element.querySelector('#pomodoro-pause');
        
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-flex';
    }

    pause() {
        this.isRunning = false;
        
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        const startBtn = this.element.querySelector('#pomodoro-start');
        const pauseBtn = this.element.querySelector('#pomodoro-pause');
        
        startBtn.style.display = 'inline-flex';
        pauseBtn.style.display = 'none';
    }

    reset() {
        this.pause();
        this.currentSession = 'focus';
        this.currentCycle = 1;
        this.timeLeft = this.config.focusTime * 60;
        this.updateDisplay();
    }

    tick() {
        this.timeLeft--;
        this.updateDisplay();
        
        if (this.timeLeft <= 0) {
            this.completeSession();
        }
    }

    completeSession() {
        this.pause();
        
        // Notify user
        this.showNotification();
        
        // Move to next session
        this.nextSession();
    }

    nextSession() {
        if (this.currentSession === 'focus') {
            if (this.currentCycle >= this.config.cycles) {
                this.currentSession = 'long-break';
                this.timeLeft = this.config.longBreak * 60;
                this.currentCycle = 1;
            } else {
                this.currentSession = 'short-break';
                this.timeLeft = this.config.shortBreak * 60;
            }
        } else {
            this.currentSession = 'focus';
            this.timeLeft = this.config.focusTime * 60;
            if (this.currentSession !== 'long-break') {
                this.currentCycle++;
            }
        }
        
        this.updateDisplay();
    }

    updateDisplay() {
        const timerElement = this.element.querySelector('#pomodoro-timer');
        const progressBar = this.element.querySelector('#pomodoro-progress-bar');
        const sessionElement = this.element.querySelector('.pomodoro-session');
        const cycleElement = this.element.querySelector('.pomodoro-setting-value');
        
        timerElement.textContent = this.formatTime(this.timeLeft);
        sessionElement.textContent = this.getSessionName();
        
        // Update progress
        const totalTime = this.getSessionDuration() * 60;
        const progress = ((totalTime - this.timeLeft) / totalTime) * 100;
        progressBar.style.width = `${progress}%`;
        
        // Update cycle display
        const settingValues = this.element.querySelectorAll('.pomodoro-setting-value');
        settingValues[0].textContent = `${this.currentCycle}/${this.config.cycles}`;
        settingValues[1].textContent = this.getNextSession();
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    getSessionName() {
        switch (this.currentSession) {
            case 'focus': return 'Focus Time';
            case 'short-break': return 'Short Break';
            case 'long-break': return 'Long Break';
            default: return 'Focus Time';
        }
    }

    getSessionDuration() {
        switch (this.currentSession) {
            case 'focus': return this.config.focusTime;
            case 'short-break': return this.config.shortBreak;
            case 'long-break': return this.config.longBreak;
            default: return this.config.focusTime;
        }
    }

    getNextSession() {
        if (this.currentSession === 'focus') {
            return this.currentCycle >= this.config.cycles ? 'Long Break' : 'Short Break';
        }
        return 'Focus';
    }

    showNotification() {
        const message = `${this.getSessionName()} completed!`;
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', { body: message });
        }
        
        // Visual indication
        this.element.classList.add('animate-pulse');
        setTimeout(() => {
            this.element.classList.remove('animate-pulse');
        }, 2000);
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // If not running, update time for current session
        if (!this.isRunning) {
            this.timeLeft = this.getSessionDuration() * 60;
            this.updateDisplay();
        }
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="pomodoro-focus-time">Focus Time (minutes)</label>
                <input type="number" id="pomodoro-focus-time" name="focusTime" class="form-input" 
                       value="${config.focusTime}" min="1" max="60">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="pomodoro-short-break">Short Break (minutes)</label>
                <input type="number" id="pomodoro-short-break" name="shortBreak" class="form-input" 
                       value="${config.shortBreak}" min="1" max="30">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="pomodoro-long-break">Long Break (minutes)</label>
                <input type="number" id="pomodoro-long-break" name="longBreak" class="form-input" 
                       value="${config.longBreak}" min="1" max="60">
            </div>
            
            <div class="form-group">
                <label class="form-label" for="pomodoro-cycles">Cycles until long break</label>
                <input type="number" id="pomodoro-cycles" name="cycles" class="form-input" 
                       value="${config.cycles}" min="1" max="10">
            </div>
        `;
    }

    refresh() {
        this.updateDisplay();
    }

    destroy() {
        this.pause();
        
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}