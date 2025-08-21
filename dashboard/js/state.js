/**
 * State Management System
 * Handles application state persistence and pub/sub events
 */

class EventEmitter {
    constructor() {
        this.events = new Map();
    }

    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(callback);
    }

    off(event, callback) {
        if (this.events.has(event)) {
            const callbacks = this.events.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, ...args) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(callback => {
                try {
                    callback(...args);
                } catch (error) {
                    console.error(`Error in event handler for ${event}:`, error);
                }
            });
        }
    }
}

export class State extends EventEmitter {
    constructor() {
        super();
        
        this.storageKey = 'dashboard-state-v1';
        this.saveDebounceTime = 1000; // 1 second
        this.saveTimer = null;
        
        // Default state
        this.state = {
            grid: {
                cols: 12,
                rowHeight: 60,
                gap: 16
            },
            widgets: [],
            theme: 'system',
            version: 1
        };
    }

    async init() {
        try {
            await this.load();
            console.log('State initialized');
        } catch (error) {
            console.error('Failed to initialize state:', error);
            // Continue with default state
        }
    }

    // Widget Management
    addWidget(widgetData) {
        const widget = {
            id: this.generateId(),
            type: widgetData.type,
            x: widgetData.x || 0,
            y: widgetData.y || 0,
            w: widgetData.w || 3,
            h: widgetData.h || 2,
            minimized: widgetData.minimized || false,
            config: widgetData.config || {}
        };

        // Validate position
        widget.x = Math.max(0, Math.min(widget.x, this.state.grid.cols - widget.w));
        widget.y = Math.max(0, widget.y);

        // Check for collisions and adjust position if needed
        const adjustedPosition = this.findAvailablePosition(widget);
        widget.x = adjustedPosition.x;
        widget.y = adjustedPosition.y;

        this.state.widgets.push(widget);
        this.emit('widgetAdded', widget);
        this.scheduleSave();
        
        return widget;
    }

    removeWidget(widgetId) {
        const index = this.state.widgets.findIndex(w => w.id === widgetId);
        if (index > -1) {
            const widget = this.state.widgets[index];
            this.state.widgets.splice(index, 1);
            this.emit('widgetRemoved', widgetId);
            this.scheduleSave();
            return widget;
        }
        return null;
    }

    updateWidget(widgetData) {
        const index = this.state.widgets.findIndex(w => w.id === widgetData.id);
        if (index > -1) {
            const currentWidget = this.state.widgets[index];
            const updatedWidget = { ...currentWidget, ...widgetData };
            
            // Validate position
            updatedWidget.x = Math.max(0, Math.min(updatedWidget.x, this.state.grid.cols - updatedWidget.w));
            updatedWidget.y = Math.max(0, updatedWidget.y);
            updatedWidget.w = Math.max(1, Math.min(updatedWidget.w, this.state.grid.cols - updatedWidget.x));
            updatedWidget.h = Math.max(1, updatedWidget.h);

            this.state.widgets[index] = updatedWidget;
            this.emit('widgetUpdated', updatedWidget);
            this.scheduleSave();
            return updatedWidget;
        }
        return null;
    }

    getWidget(widgetId) {
        return this.state.widgets.find(w => w.id === widgetId);
    }

    getWidgets() {
        return [...this.state.widgets];
    }

    duplicateWidget(widgetId) {
        const widget = this.getWidget(widgetId);
        if (!widget) return null;

        const duplicate = {
            type: widget.type,
            x: widget.x + widget.w,
            y: widget.y,
            w: widget.w,
            h: widget.h,
            minimized: false,
            config: { ...widget.config }
        };

        return this.addWidget(duplicate);
    }

    // Position Management
    findAvailablePosition(widget) {
        const { x, y, w, h } = widget;
        let testX = x;
        let testY = y;

        // Try the requested position first
        if (!this.hasCollision({ x: testX, y: testY, w, h })) {
            return { x: testX, y: testY };
        }

        // Search for an available position
        for (let row = 0; row < 100; row++) { // Limit search to prevent infinite loop
            for (let col = 0; col <= this.state.grid.cols - w; col++) {
                testX = col;
                testY = row;
                
                if (!this.hasCollision({ x: testX, y: testY, w, h })) {
                    return { x: testX, y: testY };
                }
            }
        }

        // Fallback to end of grid
        const maxY = Math.max(0, ...this.state.widgets.map(w => w.y + w.h));
        return { x: 0, y: maxY };
    }

    hasCollision(widget, excludeId = null) {
        const { x, y, w, h } = widget;
        
        return this.state.widgets.some(existing => {
            if (existing.id === excludeId) return false;
            
            return !(
                x >= existing.x + existing.w ||
                x + w <= existing.x ||
                y >= existing.y + existing.h ||
                y + h <= existing.y
            );
        });
    }

    moveWidget(widgetId, x, y) {
        const widget = this.getWidget(widgetId);
        if (!widget) return null;

        // Snap to grid
        x = Math.round(x);
        y = Math.round(y);

        // Validate bounds
        x = Math.max(0, Math.min(x, this.state.grid.cols - widget.w));
        y = Math.max(0, y);

        return this.updateWidget({ ...widget, x, y });
    }

    resizeWidget(widgetId, w, h) {
        const widget = this.getWidget(widgetId);
        if (!widget) return null;

        // Validate size
        w = Math.max(1, Math.min(w, this.state.grid.cols - widget.x));
        h = Math.max(1, h);

        return this.updateWidget({ ...widget, w, h });
    }

    // Grid Management
    getGridConfig() {
        return { ...this.state.grid };
    }

    updateGridConfig(config) {
        this.state.grid = { ...this.state.grid, ...config };
        this.emit('gridUpdated', this.state.grid);
        this.scheduleSave();
    }

    // Theme Management
    getTheme() {
        return this.state.theme;
    }

    setTheme(theme) {
        const validThemes = ['system', 'light', 'dark', 'amoled'];
        if (!validThemes.includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }

        this.state.theme = theme;
        this.emit('themeChanged', theme);
        this.scheduleSave();
    }

    // Layout Management
    getLayout() {
        return {
            grid: { ...this.state.grid },
            widgets: this.state.widgets.map(w => ({ ...w })),
            theme: this.state.theme,
            version: this.state.version
        };
    }

    importLayout(layout) {
        // Validate layout structure
        if (!layout || typeof layout !== 'object') {
            throw new Error('Invalid layout: must be an object');
        }

        if (!layout.widgets || !Array.isArray(layout.widgets)) {
            throw new Error('Invalid layout: widgets must be an array');
        }

        // Validate widgets
        const validatedWidgets = layout.widgets.map((widget, index) => {
            if (!widget.type || typeof widget.type !== 'string') {
                throw new Error(`Invalid widget at index ${index}: missing type`);
            }

            return {
                id: widget.id || this.generateId(),
                type: widget.type,
                x: Math.max(0, parseInt(widget.x) || 0),
                y: Math.max(0, parseInt(widget.y) || 0),
                w: Math.max(1, parseInt(widget.w) || 3),
                h: Math.max(1, parseInt(widget.h) || 2),
                minimized: Boolean(widget.minimized),
                config: widget.config || {}
            };
        });

        // Update state
        this.state.widgets = validatedWidgets;
        
        if (layout.grid) {
            this.state.grid = {
                cols: Math.max(1, parseInt(layout.grid.cols) || 12),
                rowHeight: Math.max(20, parseInt(layout.grid.rowHeight) || 60),
                gap: Math.max(0, parseInt(layout.grid.gap) || 16)
            };
        }

        if (layout.theme) {
            this.setTheme(layout.theme);
        }

        this.emit('layoutImported', this.getLayout());
        this.scheduleSave();
    }

    reset() {
        this.state = {
            grid: {
                cols: 12,
                rowHeight: 60,
                gap: 16
            },
            widgets: [],
            theme: 'system',
            version: 1
        };

        this.emit('stateReset');
        this.save();
    }

    // Persistence
    async load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (!stored) {
                console.log('No saved state found, using defaults');
                return;
            }

            const parsed = JSON.parse(stored);
            
            // Handle version migrations
            const migrated = this.migrate(parsed);
            
            // Validate and merge with default state
            this.state = this.validateState(migrated);
            
            console.log('State loaded successfully');
        } catch (error) {
            console.error('Failed to load state:', error);
            // Continue with default state
        }
    }

    save() {
        try {
            const serialized = JSON.stringify(this.state);
            localStorage.setItem(this.storageKey, serialized);
            this.emit('stateSaved');
        } catch (error) {
            console.error('Failed to save state:', error);
            // Try to clear some space and retry
            this.clearOldData();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.state));
            } catch (retryError) {
                console.error('Failed to save state after cleanup:', retryError);
            }
        }
    }

    scheduleSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        
        this.saveTimer = setTimeout(() => {
            this.save();
        }, this.saveDebounceTime);
    }

    // Data validation and migration
    validateState(state) {
        const defaultState = {
            grid: {
                cols: 12,
                rowHeight: 60,
                gap: 16
            },
            widgets: [],
            theme: 'system',
            version: 1
        };

        if (!state || typeof state !== 'object') {
            return defaultState;
        }

        return {
            grid: this.validateGrid(state.grid) || defaultState.grid,
            widgets: this.validateWidgets(state.widgets) || defaultState.widgets,
            theme: this.validateTheme(state.theme) || defaultState.theme,
            version: state.version || defaultState.version
        };
    }

    validateGrid(grid) {
        if (!grid || typeof grid !== 'object') return null;

        return {
            cols: Math.max(1, parseInt(grid.cols) || 12),
            rowHeight: Math.max(20, parseInt(grid.rowHeight) || 60),
            gap: Math.max(0, parseInt(grid.gap) || 16)
        };
    }

    validateWidgets(widgets) {
        if (!Array.isArray(widgets)) return null;

        return widgets.filter(widget => {
            return widget &&
                   typeof widget === 'object' &&
                   typeof widget.type === 'string' &&
                   widget.type.length > 0;
        }).map(widget => ({
            id: widget.id || this.generateId(),
            type: widget.type,
            x: Math.max(0, parseInt(widget.x) || 0),
            y: Math.max(0, parseInt(widget.y) || 0),
            w: Math.max(1, parseInt(widget.w) || 3),
            h: Math.max(1, parseInt(widget.h) || 2),
            minimized: Boolean(widget.minimized),
            config: widget.config || {}
        }));
    }

    validateTheme(theme) {
        const validThemes = ['system', 'light', 'dark', 'amoled'];
        return validThemes.includes(theme) ? theme : null;
    }

    migrate(state) {
        if (!state.version) {
            // Migrate from pre-versioned state
            state.version = 1;
        }

        // Future migrations would go here
        // if (state.version < 2) { ... }

        return state;
    }

    // Utility methods
    generateId() {
        return `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    clearOldData() {
        // Remove old dashboard data that might be taking up space
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('dashboard-') || key.startsWith('widget-'))) {
                if (key !== this.storageKey) {
                    keysToRemove.push(key);
                }
            }
        }
        
        keysToRemove.forEach(key => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                console.warn(`Failed to remove old data key: ${key}`);
            }
        });
    }

    // Debug methods
    debug() {
        console.log('Current state:', JSON.stringify(this.state, null, 2));
    }

    getStats() {
        const serialized = JSON.stringify(this.state);
        return {
            widgets: this.state.widgets.length,
            storageSize: new Blob([serialized]).size,
            lastSaved: localStorage.getItem(this.storageKey + '-timestamp')
        };
    }
}