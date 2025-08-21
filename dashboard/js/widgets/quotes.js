/**
 * Quotes Widget - Random inspirational quotes
 */

export class QuotesWidget {
    static type = 'quotes';
    static title = 'Quotes';
    static description = 'Random inspirational quotes';
    
    constructor(config = {}) {
        this.config = {
            category: 'inspirational',
            autoRefresh: false,
            refreshInterval: 60, // minutes
            title: 'Quotes',
            ...config
        };
        
        this.element = null;
        this.currentQuote = null;
        this.refreshTimer = null;
        
        this.quotes = [
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
        ];
        
        this.bindMethods();
    }

    bindMethods() {
        this.getRandomQuote = this.getRandomQuote.bind(this);
        this.copyQuote = this.copyQuote.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item quotes-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Quotes widget');
        
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
                            aria-label="New quote" title="New Quote">
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
                <div class="quotes-widget" id="quotes-content">
                    ${this.renderQuote()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderQuote() {
        if (!this.currentQuote) {
            this.getRandomQuote();
        }
        
        return `
            <div class="quote-category">${this.config.category}</div>
            <blockquote class="quote-text">"${this.currentQuote.text}"</blockquote>
            <cite class="quote-author">— ${this.currentQuote.author}</cite>
            <div class="quote-actions">
                <button class="btn btn-sm btn-ghost" id="new-quote-btn">New Quote</button>
                <button class="btn btn-sm btn-ghost" id="copy-quote-btn">Copy</button>
            </div>
        `;
    }

    async init() {
        this.getRandomQuote();
        this.setupEventListeners();
        if (this.config.autoRefresh) {
            this.startAutoRefresh();
        }
        console.log('Quotes widget initialized');
    }

    setupEventListeners() {
        this.element.addEventListener('click', (e) => {
            if (e.target.id === 'new-quote-btn') {
                this.getRandomQuote();
                this.updateDisplay();
            } else if (e.target.id === 'copy-quote-btn') {
                this.copyQuote();
            }
        });
        
        this.element.addEventListener('refresh', () => {
            this.getRandomQuote();
            this.updateDisplay();
        });
        
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
    }

    getRandomQuote() {
        const randomIndex = Math.floor(Math.random() * this.quotes.length);
        this.currentQuote = this.quotes[randomIndex];
    }

    updateDisplay() {
        const content = this.element.querySelector('#quotes-content');
        content.innerHTML = this.renderQuote();
        this.setupEventListeners();
    }

    copyQuote() {
        const text = `"${this.currentQuote.text}" — ${this.currentQuote.author}`;
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary feedback
            const copyBtn = this.element.querySelector('#copy-quote-btn');
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 1500);
        });
    }

    startAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        const intervalMs = this.config.refreshInterval * 60 * 1000;
        this.refreshTimer = setInterval(() => {
            this.getRandomQuote();
            this.updateDisplay();
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        if (this.config.autoRefresh) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
        
        this.updateDisplay();
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="quotes-category">Category</label>
                <select id="quotes-category" name="category" class="form-select">
                    <option value="inspirational" ${config.category === 'inspirational' ? 'selected' : ''}>Inspirational</option>
                    <option value="motivational" ${config.category === 'motivational' ? 'selected' : ''}>Motivational</option>
                    <option value="success" ${config.category === 'success' ? 'selected' : ''}>Success</option>
                    <option value="wisdom" ${config.category === 'wisdom' ? 'selected' : ''}>Wisdom</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="quotes-auto-refresh" name="autoRefresh" 
                           ${config.autoRefresh ? 'checked' : ''} class="form-checkbox">
                    Auto-refresh quotes
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="quotes-refresh-interval">Refresh Interval (minutes)</label>
                <select id="quotes-refresh-interval" name="refreshInterval" class="form-select">
                    <option value="30" ${config.refreshInterval === 30 ? 'selected' : ''}>30 minutes</option>
                    <option value="60" ${config.refreshInterval === 60 ? 'selected' : ''}>1 hour</option>
                    <option value="120" ${config.refreshInterval === 120 ? 'selected' : ''}>2 hours</option>
                    <option value="360" ${config.refreshInterval === 360 ? 'selected' : ''}>6 hours</option>
                </select>
            </div>
        `;
    }

    refresh() {
        this.getRandomQuote();
        this.updateDisplay();
    }

    destroy() {
        this.stopAutoRefresh();
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}