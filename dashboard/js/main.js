/**
 * Main Application Entry Point
 * Initializes the dashboard application and coordinates all modules
 */

import { State } from './state.js';
import { Grid } from './grid.js';
import { UI } from './ui.js';

// Widget imports
import { ClockWidget } from './widgets/clock.js';
import { WeatherWidget } from './widgets/weather.js';
import { NotesWidget } from './widgets/notes.js';
import { TodoWidget } from './widgets/todo.js';
import { PomodoroWidget } from './widgets/pomodoro.js';
import { CalendarWidget } from './widgets/calendar.js';
import { QuotesWidget } from './widgets/quotes.js';
import { StocksWidget } from './widgets/stocks.js';
import { LinksWidget } from './widgets/links.js';
import { SystemWidget } from './widgets/system.js';

class Dashboard {
    constructor() {
        this.state = new State();
        this.grid = new Grid();
        this.ui = new UI();
        
        // Widget registry
        this.widgets = new Map();
        this.widgetTypes = new Map();
        
        // Initialize
        this.init();
    }

    async init() {
        try {
            // Register widget types
            this.registerWidgetTypes();
            
            // Initialize modules
            await this.state.init();
            await this.grid.init(this.state);
            await this.ui.init(this.state, this.grid);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial layout
            await this.loadLayout();
            
            // Apply theme
            this.applyTheme();
            
            // Mark page as loaded
            document.body.classList.remove('page-loading');
            document.body.classList.add('page-loaded');
            
            console.log('Dashboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.ui.showToast('Failed to initialize dashboard', 'error');
        }
    }

    registerWidgetTypes() {
        const types = [
            ClockWidget,
            WeatherWidget,
            NotesWidget,
            TodoWidget,
            PomodoroWidget,
            CalendarWidget,
            QuotesWidget,
            StocksWidget,
            LinksWidget,
            SystemWidget
        ];

        types.forEach(WidgetClass => {
            this.widgetTypes.set(WidgetClass.type, WidgetClass);
        });

        console.log(`Registered ${types.length} widget types`);
    }

    setupEventListeners() {
        // App bar controls
        document.getElementById('add-widget-btn')?.addEventListener('click', () => {
            this.ui.showAddWidgetModal();
        });

        // Theme toggle
        document.querySelector('.theme-toggle')?.addEventListener('click', () => {
            this.ui.showThemeModal();
        });

        // Menu dropdown
        document.getElementById('menu-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.ui.toggleDropdown(e.target.closest('.dropdown'));
        });

        // Import/Export
        document.getElementById('import-btn')?.addEventListener('click', () => {
            this.importLayout();
        });

        document.getElementById('export-btn')?.addEventListener('click', () => {
            this.exportLayout();
        });

        document.getElementById('reset-btn')?.addEventListener('click', () => {
            this.resetToDefault();
        });

        // Search
        document.getElementById('widget-search')?.addEventListener('input', (e) => {
            this.filterWidgets(e.target.value);
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                this.ui.closeAllDropdowns();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // State changes
        this.state.on('widgetAdded', (widget) => {
            this.createWidget(widget);
        });

        this.state.on('widgetRemoved', (widgetId) => {
            this.removeWidget(widgetId);
        });

        this.state.on('widgetUpdated', (widget) => {
            this.updateWidget(widget);
        });

        this.state.on('themeChanged', (theme) => {
            this.applyTheme(theme);
        });

        // Window events
        window.addEventListener('resize', () => {
            this.grid.handleResize();
        });

        window.addEventListener('beforeunload', () => {
            this.state.save();
        });

        // Visibility API for pausing/resuming widgets
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseWidgets();
            } else {
                this.resumeWidgets();
            }
        });
    }

    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when not in input/textarea
        if (e.target.matches('input, textarea, [contenteditable]')) {
            return;
        }

        const key = e.key.toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;

        // Escape key
        if (key === 'escape') {
            this.ui.closeModals();
            this.ui.closeAllDropdowns();
            return;
        }

        // Ctrl+shortcuts
        if (ctrl) {
            switch (key) {
                case 'n':
                    e.preventDefault();
                    this.ui.showAddWidgetModal();
                    break;
                case 's':
                    e.preventDefault();
                    this.state.save();
                    this.ui.showToast('Layout saved', 'success');
                    break;
                case 'o':
                    e.preventDefault();
                    this.importLayout();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportLayout();
                    break;
                case 'r':
                    if (shift) {
                        e.preventDefault();
                        this.resetToDefault();
                    }
                    break;
                case '/':
                    e.preventDefault();
                    document.getElementById('widget-search')?.focus();
                    break;
            }
        }

        // Single key shortcuts
        switch (key) {
            case '?':
                e.preventDefault();
                this.ui.showHelpModal();
                break;
            case 't':
                if (!ctrl) {
                    this.ui.showThemeModal();
                }
                break;
        }
    }

    async loadLayout() {
        const layout = this.state.getLayout();
        
        if (layout.widgets.length === 0) {
            // Load default layout
            await this.loadDefaultLayout();
        } else {
            // Load saved layout
            for (const widgetData of layout.widgets) {
                await this.createWidget(widgetData);
            }
        }
    }

    async loadDefaultLayout() {
        const defaultWidgets = [
            // Row 1
            { type: 'clock', x: 0, y: 0, w: 3, h: 2, config: {} },
            { type: 'weather', x: 3, y: 0, w: 3, h: 2, config: { city: 'New York' } },
            { type: 'pomodoro', x: 6, y: 0, w: 3, h: 2, config: {} },
            { type: 'todo', x: 9, y: 0, w: 3, h: 2, config: {} },
            
            // Row 2
            { type: 'calendar', x: 0, y: 2, w: 4, h: 3, config: {} },
            { type: 'notes', x: 4, y: 2, w: 4, h: 3, config: {} },
            { type: 'stocks', x: 8, y: 2, w: 4, h: 3, config: { symbol: 'AAPL' } },
            
            // Row 3
            { type: 'links', x: 0, y: 5, w: 6, h: 2, config: {} },
            { type: 'quotes', x: 6, y: 5, w: 3, h: 2, config: {} },
            { type: 'system', x: 9, y: 5, w: 3, h: 2, config: {} }
        ];

        for (const widgetData of defaultWidgets) {
            this.state.addWidget(widgetData);
        }
    }

    async createWidget(widgetData) {
        const WidgetClass = this.widgetTypes.get(widgetData.type);
        
        if (!WidgetClass) {
            console.error(`Unknown widget type: ${widgetData.type}`);
            return null;
        }

        try {
            // Create widget instance
            const widget = new WidgetClass(widgetData.config || {});
            
            // Create DOM element
            const element = await widget.createElement();
            element.dataset.widgetId = widgetData.id;
            element.dataset.widgetType = widgetData.type;
            
            // Set grid position
            this.grid.setElementPosition(element, widgetData);
            
            // Add to grid
            document.getElementById('widget-grid').appendChild(element);
            
            // Initialize widget
            await widget.init();
            
            // Store widget
            this.widgets.set(widgetData.id, widget);
            
            // Add event listeners
            this.setupWidgetListeners(element, widget, widgetData);
            
            // Animate in
            element.classList.add('animate-scale-in');
            
            return widget;
        } catch (error) {
            console.error(`Failed to create widget ${widgetData.type}:`, error);
            this.ui.showToast(`Failed to create ${widgetData.type} widget`, 'error');
            return null;
        }
    }

    setupWidgetListeners(element, widget, widgetData) {
        // Context menu
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.ui.showContextMenu(e, widgetData.id);
        });

        // Settings button
        const settingsBtn = element.querySelector('[data-action="settings"]');
        settingsBtn?.addEventListener('click', () => {
            this.ui.showWidgetSettings(widgetData.id, widget);
        });

        // Refresh button
        const refreshBtn = element.querySelector('[data-action="refresh"]');
        refreshBtn?.addEventListener('click', () => {
            widget.refresh?.();
        });

        // Minimize button
        const minimizeBtn = element.querySelector('[data-action="minimize"]');
        minimizeBtn?.addEventListener('click', () => {
            this.toggleWidgetMinimized(widgetData.id);
        });

        // Remove button
        const removeBtn = element.querySelector('[data-action="remove"]');
        removeBtn?.addEventListener('click', () => {
            this.removeWidget(widgetData.id);
        });
    }

    removeWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
        
        if (widget) {
            widget.destroy?.();
            this.widgets.delete(widgetId);
        }
        
        if (element) {
            element.classList.add('animate-scale-out');
            setTimeout(() => {
                element.remove();
            }, 250);
        }
        
        this.state.removeWidget(widgetId);
    }

    updateWidget(widgetData) {
        const widget = this.widgets.get(widgetData.id);
        const element = document.querySelector(`[data-widget-id="${widgetData.id}"]`);
        
        if (widget && element) {
            // Update position
            this.grid.setElementPosition(element, widgetData);
            
            // Update widget config
            widget.updateConfig?.(widgetData.config);
            
            // Update minimized state
            const content = element.querySelector('.widget-content');
            if (content) {
                content.classList.toggle('minimized', widgetData.minimized);
            }
        }
    }

    toggleWidgetMinimized(widgetId) {
        const widgetData = this.state.getWidget(widgetId);
        if (widgetData) {
            this.state.updateWidget({
                ...widgetData,
                minimized: !widgetData.minimized
            });
        }
    }

    filterWidgets(query) {
        const widgets = document.querySelectorAll('.widget-grid-item');
        const searchTerm = query.toLowerCase().trim();
        
        widgets.forEach(widget => {
            const type = widget.dataset.widgetType;
            const title = widget.querySelector('.widget-title')?.textContent || '';
            
            const matches = type.includes(searchTerm) || 
                          title.toLowerCase().includes(searchTerm);
            
            widget.style.display = matches || !searchTerm ? '' : 'none';
        });
    }

    applyTheme(theme = this.state.getTheme()) {
        const root = document.documentElement;
        
        // Remove existing theme attributes
        root.removeAttribute('data-theme');
        
        // Apply new theme
        if (theme !== 'system') {
            root.setAttribute('data-theme', theme);
        }
        
        // Save theme preference
        this.state.setTheme(theme);
        
        // Update theme toggle button
        const themeToggle = document.querySelector('.theme-toggle');
        if (themeToggle) {
            themeToggle.dataset.theme = theme;
        }
    }

    async importLayout() {
        const fileInput = document.getElementById('import-file');
        
        const handleFileSelect = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const layout = JSON.parse(text);
                
                // Validate layout
                if (!layout.widgets || !Array.isArray(layout.widgets)) {
                    throw new Error('Invalid layout format');
                }
                
                // Clear current widgets
                this.widgets.forEach((widget, id) => {
                    this.removeWidget(id);
                });
                
                // Import new layout
                this.state.importLayout(layout);
                await this.loadLayout();
                
                this.ui.showToast('Layout imported successfully', 'success');
            } catch (error) {
                console.error('Import failed:', error);
                this.ui.showToast('Failed to import layout', 'error');
            }
            
            // Clean up
            fileInput.value = '';
            fileInput.removeEventListener('change', handleFileSelect);
        };
        
        fileInput.addEventListener('change', handleFileSelect);
        fileInput.click();
    }

    exportLayout() {
        try {
            const layout = this.state.getLayout();
            const data = JSON.stringify(layout, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dashboard-layout-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            this.ui.showToast('Layout exported successfully', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.ui.showToast('Failed to export layout', 'error');
        }
    }

    async resetToDefault() {
        if (!confirm('Are you sure you want to reset to the default layout? This will remove all current widgets.')) {
            return;
        }
        
        try {
            // Clear current widgets
            this.widgets.forEach((widget, id) => {
                this.removeWidget(id);
            });
            
            // Reset state
            this.state.reset();
            
            // Load default layout
            await this.loadDefaultLayout();
            
            this.ui.showToast('Layout reset to default', 'success');
        } catch (error) {
            console.error('Reset failed:', error);
            this.ui.showToast('Failed to reset layout', 'error');
        }
    }

    pauseWidgets() {
        this.widgets.forEach(widget => {
            widget.pause?.();
        });
    }

    resumeWidgets() {
        this.widgets.forEach(widget => {
            widget.resume?.();
        });
    }
}

// Initialize dashboard when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.dashboard = new Dashboard();
    });
} else {
    window.dashboard = new Dashboard();
}

export { Dashboard };