/**
 * Calendar Widget - Mini calendar with quick notes
 */

export class CalendarWidget {
    static type = 'calendar';
    static title = 'Calendar';
    static description = 'Mini calendar with quick notes';
    
    constructor(config = {}) {
        this.config = {
            events: {},
            startWeek: 0, // 0 = Sunday, 1 = Monday
            title: 'Calendar',
            ...config
        };
        
        this.element = null;
        this.currentDate = new Date();
        this.selectedDate = null;
        
        this.bindMethods();
    }

    bindMethods() {
        this.prevMonth = this.prevMonth.bind(this);
        this.nextMonth = this.nextMonth.bind(this);
        this.selectDate = this.selectDate.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item calendar-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Calendar widget');
        
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
                <div class="calendar-widget">
                    ${this.renderCalendar()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderCalendar() {
        return `
            <div class="calendar-header">
                <button class="btn btn-icon btn-sm calendar-nav" id="prev-month" aria-label="Previous month">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-arrow-left"></use>
                    </svg>
                </button>
                <h4 class="calendar-month">${this.currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}</h4>
                <button class="btn btn-icon btn-sm calendar-nav" id="next-month" aria-label="Next month">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-arrow-right"></use>
                    </svg>
                </button>
            </div>
            
            <div class="calendar-grid">
                ${this.renderCalendarGrid()}
            </div>
        `;
    }

    renderCalendarGrid() {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        let grid = '';
        
        // Headers
        daysOfWeek.forEach(day => {
            grid += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Days
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 42; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = date.getMonth() === month;
            const isToday = date.getTime() === today.getTime();
            const isSelected = this.selectedDate && date.getTime() === this.selectedDate.getTime();
            const hasEvent = this.hasEvent(date);
            
            let classes = 'calendar-day';
            if (!isCurrentMonth) classes += ' other-month';
            if (isToday) classes += ' today';
            if (isSelected) classes += ' selected';
            if (hasEvent) classes += ' has-event';
            
            grid += `
                <div class="${classes}" data-date="${date.toISOString()}" role="button" tabindex="0">
                    ${date.getDate()}
                </div>
            `;
        }
        
        return grid;
    }

    hasEvent(date) {
        const dateKey = date.toISOString().split('T')[0];
        return this.config.events[dateKey] && this.config.events[dateKey].length > 0;
    }

    async init() {
        this.setupEventListeners();
        console.log('Calendar widget initialized');
    }

    setupEventListeners() {
        this.element.querySelector('#prev-month').addEventListener('click', this.prevMonth);
        this.element.querySelector('#next-month').addEventListener('click', this.nextMonth);
        
        this.element.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day')) {
                const date = new Date(e.target.dataset.date);
                this.selectDate(date);
            }
        });
        
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
    }

    prevMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.updateCalendarDisplay();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.updateCalendarDisplay();
    }

    selectDate(date) {
        this.selectedDate = date;
        this.updateCalendarDisplay();
        
        // Show a simple prompt for adding notes (placeholder functionality)
        const dateKey = date.toISOString().split('T')[0];
        const existingNote = this.config.events[dateKey]?.[0] || '';
        const note = prompt(`Add note for ${date.toLocaleDateString()}:`, existingNote);
        
        if (note !== null) {
            if (note.trim()) {
                if (!this.config.events[dateKey]) {
                    this.config.events[dateKey] = [];
                }
                this.config.events[dateKey] = [note.trim()];
            } else {
                delete this.config.events[dateKey];
            }
            this.updateCalendarDisplay();
            this.saveConfig();
        }
    }

    updateCalendarDisplay() {
        const calendarWidget = this.element.querySelector('.calendar-widget');
        calendarWidget.innerHTML = this.renderCalendar();
        this.setupEventListeners();
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        this.updateCalendarDisplay();
    }

    saveConfig() {
        this.element.dispatchEvent(new CustomEvent('save', {
            detail: { config: this.config }
        }));
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="calendar-start-week">Start week on</label>
                <select id="calendar-start-week" name="startWeek" class="form-select">
                    <option value="0" ${config.startWeek === 0 ? 'selected' : ''}>Sunday</option>
                    <option value="1" ${config.startWeek === 1 ? 'selected' : ''}>Monday</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Quick Actions</label>
                <button type="button" class="btn btn-sm btn-secondary" onclick="this.closest('.modal').dispatchEvent(new CustomEvent('goToToday'))">
                    Go to Today
                </button>
            </div>
        `;
    }

    goToToday() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.updateCalendarDisplay();
    }

    refresh() {
        this.updateCalendarDisplay();
    }

    destroy() {
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}