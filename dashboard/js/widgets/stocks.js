/**
 * Stocks Widget - Stock prices with mini charts (placeholder)
 */

export class StocksWidget {
    static type = 'stocks';
    static title = 'Stocks';
    static description = 'Stock prices with mini charts';
    
    constructor(config = {}) {
        this.config = {
            symbol: 'AAPL',
            title: 'Stocks',
            ...config
        };
        this.element = null;
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item stocks-widget-container';
        this.element.innerHTML = `
            <div class="widget-header">
                <h3 class="widget-title">${this.config.title}</h3>
                <div class="widget-actions">
                    <button class="widget-drag-handle btn btn-icon btn-sm tooltip" aria-label="Drag to move" title="Drag to move">
                        <svg class="icon"><use href="./assets/icons.svg#icon-drag"></use></svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" data-action="settings" aria-label="Widget settings" title="Settings">
                        <svg class="icon"><use href="./assets/icons.svg#icon-settings"></use></svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" data-action="minimize" aria-label="Minimize widget" title="Minimize">
                        <svg class="icon"><use href="./assets/icons.svg#icon-minimize"></use></svg>
                    </button>
                    <button class="btn btn-icon btn-sm tooltip" data-action="remove" aria-label="Remove widget" title="Remove">
                        <svg class="icon"><use href="./assets/icons.svg#icon-close"></use></svg>
                    </button>
                </div>
            </div>
            <div class="widget-content">
                <div class="stocks-widget">
                    <div class="stocks-symbol">
                        <h2 class="stocks-ticker">${this.config.symbol}</h2>
                        <div class="stocks-price">$150.25</div>
                        <div class="stocks-change positive">+2.45 (+1.66%)</div>
                    </div>
                    <div class="stocks-details">
                        <div class="stocks-detail">
                            <span class="stocks-detail-label">Open</span>
                            <span>$148.20</span>
                        </div>
                        <div class="stocks-detail">
                            <span class="stocks-detail-label">High</span>
                            <span>$151.80</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return this.element;
    }

    async init() {
        console.log('Stocks widget initialized (placeholder)');
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="stocks-symbol">Stock Symbol</label>
                <input type="text" id="stocks-symbol" name="symbol" class="form-input" value="${config.symbol}">
            </div>
        `;
    }

    refresh() {}
    destroy() { if (this.element) this.element.remove(); }
    getConfig() { return { ...this.config }; }
}