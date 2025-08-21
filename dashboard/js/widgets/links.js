/**
 * Links Widget - Bookmarks with favicons
 */

export class LinksWidget {
    static type = 'links';
    static title = 'Quick Links';
    static description = 'Bookmarks with favicons';
    
    constructor(config = {}) {
        this.config = {
            links: [
                { title: 'Google', url: 'https://google.com', favicon: '🔍' },
                { title: 'GitHub', url: 'https://github.com', favicon: '📁' }
            ],
            title: 'Quick Links',
            ...config
        };
        this.element = null;
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item links-widget-container';
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
                <div class="links-widget">
                    <div class="links-add">
                        <input type="text" class="links-input" placeholder="Add new link...">
                        <button class="btn btn-primary btn-sm">Add</button>
                    </div>
                    <div class="links-list">
                        ${this.config.links.map(link => `
                            <div class="links-item">
                                <span class="links-favicon">${link.favicon}</span>
                                <div class="links-content">
                                    <div class="links-title">${link.title}</div>
                                    <div class="links-url">${link.url}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        return this.element;
    }

    async init() {
        console.log('Links widget initialized (placeholder)');
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label">Links will be managed through the widget interface</label>
                <p class="text-muted">Use the + button in the widget to add links</p>
            </div>
        `;
    }

    refresh() {}
    destroy() { if (this.element) this.element.remove(); }
    getConfig() { return { ...this.config }; }
}