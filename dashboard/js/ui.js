/**
 * UI Module - Handles modals, toasts, dropdowns, and other UI interactions
 */

export class UI {
    constructor() {
        this.state = null;
        this.grid = null;
        
        // Toast management
        this.toasts = new Map();
        this.toastCounter = 0;
        
        // Modal management
        this.activeModal = null;
        this.modalStack = [];
        
        // Dropdown management
        this.activeDropdown = null;
        
        // Context menu
        this.contextMenu = null;
        this.contextMenuTarget = null;
        
        // Widget types for library
        this.widgetTypes = [
            {
                type: 'clock',
                name: 'Clock',
                description: 'Digital and analog clock with timezone support',
                icon: 'clock',
                defaultSize: { w: 3, h: 2 }
            },
            {
                type: 'weather',
                name: 'Weather',
                description: 'Current weather conditions and forecast',
                icon: 'cloud',
                defaultSize: { w: 3, h: 2 }
            },
            {
                type: 'notes',
                name: 'Notes',
                description: 'Rich text note-taking with autosave',
                icon: 'edit',
                defaultSize: { w: 4, h: 3 }
            },
            {
                type: 'todo',
                name: 'Todo List',
                description: 'Task management with filters and stats',
                icon: 'check',
                defaultSize: { w: 3, h: 4 }
            },
            {
                type: 'pomodoro',
                name: 'Pomodoro Timer',
                description: 'Focus timer with break cycles',
                icon: 'play',
                defaultSize: { w: 3, h: 2 }
            },
            {
                type: 'calendar',
                name: 'Calendar',
                description: 'Mini calendar with quick notes',
                icon: 'calendar',
                defaultSize: { w: 4, h: 3 }
            },
            {
                type: 'quotes',
                name: 'Quotes',
                description: 'Random inspirational quotes',
                icon: 'quote',
                defaultSize: { w: 3, h: 2 }
            },
            {
                type: 'stocks',
                name: 'Stocks',
                description: 'Stock prices with mini charts',
                icon: 'trending',
                defaultSize: { w: 4, h: 3 }
            },
            {
                type: 'links',
                name: 'Quick Links',
                description: 'Bookmarks with favicons',
                icon: 'link',
                defaultSize: { w: 6, h: 2 }
            },
            {
                type: 'system',
                name: 'System Info',
                description: 'Device and browser information',
                icon: 'monitor',
                defaultSize: { w: 3, h: 2 }
            }
        ];
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleEscapeKey = this.handleEscapeKey.bind(this);
        this.handleClickOutside = this.handleClickOutside.bind(this);
    }

    async init(state, grid) {
        this.state = state;
        this.grid = grid;
        
        this.setupEventListeners();
        this.setupAccessibility();
        this.populateWidgetLibrary();
        
        console.log('UI module initialized');
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('keydown', this.handleEscapeKey);
        document.addEventListener('click', this.handleClickOutside);
        
        // Modal event listeners
        this.setupModalListeners();
        
        // Theme selection
        this.setupThemeListeners();
        
        // Context menu
        this.setupContextMenu();
    }

    setupModalListeners() {
        // Close buttons
        document.querySelectorAll('.modal .btn-icon').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal-overlay');
                if (modal) {
                    this.closeModal(modal);
                }
            });
        });

        // Modal overlay clicks
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeModal(overlay);
                }
            });
        });

        // Widget settings modal
        document.getElementById('save-settings-btn')?.addEventListener('click', () => {
            this.saveWidgetSettings();
        });

        document.getElementById('cancel-settings-btn')?.addEventListener('click', () => {
            this.closeModal(document.getElementById('widget-settings-modal'));
        });
    }

    setupThemeListeners() {
        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.dataset.theme;
                this.applyTheme(theme);
                this.closeModal(document.getElementById('theme-modal'));
            });
        });
    }

    setupContextMenu() {
        this.contextMenu = document.getElementById('context-menu');
        
        document.getElementById('context-settings')?.addEventListener('click', () => {
            if (this.contextMenuTarget) {
                this.showWidgetSettings(this.contextMenuTarget);
            }
            this.hideContextMenu();
        });

        document.getElementById('context-refresh')?.addEventListener('click', () => {
            if (this.contextMenuTarget) {
                this.refreshWidget(this.contextMenuTarget);
            }
            this.hideContextMenu();
        });

        document.getElementById('context-duplicate')?.addEventListener('click', () => {
            if (this.contextMenuTarget) {
                this.duplicateWidget(this.contextMenuTarget);
            }
            this.hideContextMenu();
        });

        document.getElementById('context-remove')?.addEventListener('click', () => {
            if (this.contextMenuTarget) {
                this.removeWidget(this.contextMenuTarget);
            }
            this.hideContextMenu();
        });
    }

    setupAccessibility() {
        // Focus trap for modals
        this.setupFocusTrap();
        
        // ARIA live regions
        this.setupAriaLiveRegions();
        
        // Keyboard navigation
        this.setupKeyboardNavigation();
    }

    setupFocusTrap() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Tab') {
                    this.trapFocus(e, modal);
                }
            });
        });
    }

    trapFocus(e, container) {
        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    }

    setupAriaLiveRegions() {
        // Toast container is already set up as aria-live="polite"
        
        // Add screen reader announcements for widget operations
        this.state.on('widgetAdded', (widget) => {
            this.announceToScreenReader(`${widget.type} widget added`);
        });

        this.state.on('widgetRemoved', (widgetId) => {
            this.announceToScreenReader('Widget removed');
        });

        this.state.on('themeChanged', (theme) => {
            this.announceToScreenReader(`Theme changed to ${theme}`);
        });
    }

    setupKeyboardNavigation() {
        // Widget focus management
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey && !this.activeModal) {
                this.handleWidgetTabNavigation(e);
            }
        });
    }

    handleWidgetTabNavigation(e) {
        const widgets = Array.from(document.querySelectorAll('.widget-grid-item'));
        const currentWidget = document.activeElement.closest('.widget-grid-item');
        
        if (currentWidget) {
            const currentIndex = widgets.indexOf(currentWidget);
            const nextWidget = widgets[currentIndex + 1];
            
            if (nextWidget) {
                nextWidget.focus();
                e.preventDefault();
            }
        }
    }

    // Toast Management
    showToast(message, type = 'info', duration = 5000) {
        const id = ++this.toastCounter;
        const toast = this.createToastElement(id, message, type, duration);
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Store toast
        this.toasts.set(id, {
            element: toast,
            timer: setTimeout(() => {
                this.hideToast(id);
            }, duration)
        });
        
        // Auto-remove after animation
        setTimeout(() => {
            if (this.toasts.has(id)) {
                this.removeToast(id);
            }
        }, duration + 500);
        
        return id;
    }

    createToastElement(id, message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.dataset.toastId = id;
        toast.setAttribute('role', 'alert');
        
        const icons = {
            success: 'check',
            warning: 'warning',
            error: 'close',
            info: 'info'
        };
        
        const titles = {
            success: 'Success',
            warning: 'Warning',
            error: 'Error',
            info: 'Info'
        };
        
        toast.innerHTML = `
            <svg class="toast-icon icon" aria-hidden="true">
                <use href="./assets/icons.svg#icon-${icons[type] || 'info'}"></use>
            </svg>
            <div class="toast-content">
                <h3 class="toast-title">${titles[type] || 'Info'}</h3>
                <p class="toast-message">${message}</p>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <svg class="icon" aria-hidden="true">
                    <use href="./assets/icons.svg#icon-close"></use>
                </svg>
            </button>
        `;
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hideToast(id);
        });
        
        // Progress bar for duration
        if (duration > 0) {
            const progress = document.createElement('div');
            progress.className = 'toast-progress';
            progress.style.width = '100%';
            progress.style.transitionDuration = `${duration}ms`;
            toast.appendChild(progress);
            
            requestAnimationFrame(() => {
                progress.style.width = '0%';
            });
        }
        
        return toast;
    }

    hideToast(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.element.classList.remove('show');
            if (toast.timer) {
                clearTimeout(toast.timer);
            }
        }
    }

    removeToast(id) {
        const toast = this.toasts.get(id);
        if (toast) {
            toast.element.remove();
            this.toasts.delete(id);
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Close any existing modal
        this.closeActiveModal();
        
        // Show modal
        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        this.activeModal = modal;
        this.modalStack.push(modal);
        
        // Focus first focusable element
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        this.announceToScreenReader('Modal opened');
    }

    closeModal(modal) {
        if (!modal) return;

        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        
        // Remove from stack
        const index = this.modalStack.indexOf(modal);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }
        
        // Update active modal
        this.activeModal = this.modalStack[this.modalStack.length - 1] || null;
        
        // Restore body scroll if no modals are open
        if (!this.activeModal) {
            document.body.style.overflow = '';
        }
        
        this.announceToScreenReader('Modal closed');
    }

    closeActiveModal() {
        if (this.activeModal) {
            this.closeModal(this.activeModal);
        }
    }

    closeModals() {
        while (this.modalStack.length > 0) {
            this.closeModal(this.modalStack[this.modalStack.length - 1]);
        }
    }

    // Widget Library
    populateWidgetLibrary() {
        const containers = [
            document.getElementById('widget-library'),
            document.getElementById('modal-widget-library')
        ];

        containers.forEach(container => {
            if (container) {
                container.innerHTML = '';
                this.widgetTypes.forEach(widgetType => {
                    const preview = this.createWidgetPreview(widgetType);
                    container.appendChild(preview);
                });
            }
        });
    }

    createWidgetPreview(widgetType) {
        const preview = document.createElement('div');
        preview.className = 'widget-preview';
        preview.dataset.widgetType = widgetType.type;
        preview.setAttribute('role', 'button');
        preview.setAttribute('tabindex', '0');
        preview.setAttribute('aria-label', `Add ${widgetType.name} widget`);
        
        preview.innerHTML = `
            <svg class="icon icon-lg" aria-hidden="true">
                <use href="./assets/icons.svg#icon-${widgetType.icon}"></use>
            </svg>
            <h3 class="widget-preview-title">${widgetType.name}</h3>
            <p class="widget-preview-description">${widgetType.description}</p>
        `;
        
        // Click handler
        const handleAdd = () => {
            this.addWidget(widgetType.type);
            this.closeModals();
        };
        
        preview.addEventListener('click', handleAdd);
        preview.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleAdd();
            }
        });
        
        return preview;
    }

    showAddWidgetModal() {
        this.showModal('add-widget-modal');
    }

    addWidget(type) {
        const widgetType = this.widgetTypes.find(w => w.type === type);
        if (!widgetType) return;

        const widget = this.state.addWidget({
            type: type,
            x: 0,
            y: 0,
            w: widgetType.defaultSize.w,
            h: widgetType.defaultSize.h,
            config: {}
        });

        this.showToast(`${widgetType.name} widget added`, 'success');
        return widget;
    }

    // Widget Settings
    showWidgetSettings(widgetId, widgetInstance = null) {
        const widget = this.state.getWidget(widgetId);
        if (!widget) return;

        const modal = document.getElementById('widget-settings-modal');
        const title = document.getElementById('widget-settings-title');
        const content = document.getElementById('widget-settings-content');
        
        const widgetType = this.widgetTypes.find(w => w.type === widget.type);
        title.textContent = `${widgetType?.name || widget.type} Settings`;
        
        // Generate settings form
        content.innerHTML = this.generateSettingsForm(widget, widgetInstance);
        
        // Store current widget for saving
        modal.dataset.currentWidget = widgetId;
        
        this.showModal('widget-settings-modal');
    }

    generateSettingsForm(widget, widgetInstance = null) {
        // Basic settings available for all widgets
        let form = `
            <div class="form-group">
                <label class="form-label" for="widget-title">Widget Title</label>
                <input 
                    type="text" 
                    id="widget-title" 
                    class="form-input" 
                    value="${widget.config.title || ''}"
                    placeholder="Custom title (optional)"
                >
            </div>
        `;

        // Widget-specific settings
        if (widgetInstance && typeof widgetInstance.getSettingsForm === 'function') {
            form += widgetInstance.getSettingsForm(widget.config);
        }

        return form;
    }

    saveWidgetSettings() {
        const modal = document.getElementById('widget-settings-modal');
        const widgetId = modal.dataset.currentWidget;
        const widget = this.state.getWidget(widgetId);
        
        if (!widget) return;

        // Collect form data
        const form = modal.querySelector('#widget-settings-content');
        const formData = new FormData();
        const inputs = form.querySelectorAll('input, select, textarea');
        
        const config = { ...widget.config };
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                config[input.name || input.id] = input.checked;
            } else if (input.type === 'number') {
                config[input.name || input.id] = parseFloat(input.value) || 0;
            } else {
                config[input.name || input.id] = input.value;
            }
        });

        // Update widget
        this.state.updateWidget({
            ...widget,
            config
        });

        this.closeModal(modal);
        this.showToast('Settings saved', 'success');
    }

    // Context Menu
    showContextMenu(e, widgetId) {
        e.preventDefault();
        
        this.contextMenuTarget = widgetId;
        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = `${e.clientX}px`;
        this.contextMenu.style.top = `${e.clientY}px`;
        
        // Adjust position if menu goes off-screen
        const rect = this.contextMenu.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };
        
        if (rect.right > viewport.width) {
            this.contextMenu.style.left = `${e.clientX - rect.width}px`;
        }
        
        if (rect.bottom > viewport.height) {
            this.contextMenu.style.top = `${e.clientY - rect.height}px`;
        }
        
        // Focus first item
        const firstItem = this.contextMenu.querySelector('.dropdown-item');
        if (firstItem) {
            firstItem.focus();
        }
    }

    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.contextMenuTarget = null;
    }

    // Widget Operations
    refreshWidget(widgetId) {
        const element = document.querySelector(`[data-widget-id="${widgetId}"]`);
        if (element) {
            element.dispatchEvent(new CustomEvent('refresh'));
        }
    }

    duplicateWidget(widgetId) {
        const duplicated = this.state.duplicateWidget(widgetId);
        if (duplicated) {
            this.showToast('Widget duplicated', 'success');
        }
    }

    removeWidget(widgetId) {
        const widget = this.state.getWidget(widgetId);
        const widgetType = this.widgetTypes.find(w => w.type === widget?.type);
        
        if (confirm(`Remove ${widgetType?.name || 'this widget'}?`)) {
            this.state.removeWidget(widgetId);
            this.showToast('Widget removed', 'info');
        }
    }

    // Dropdown Management
    toggleDropdown(dropdown) {
        if (this.activeDropdown && this.activeDropdown !== dropdown) {
            this.closeDropdown(this.activeDropdown);
        }
        
        const isOpen = dropdown.classList.contains('open');
        
        if (isOpen) {
            this.closeDropdown(dropdown);
        } else {
            this.openDropdown(dropdown);
        }
    }

    openDropdown(dropdown) {
        dropdown.classList.add('open');
        this.activeDropdown = dropdown;
        
        const trigger = dropdown.querySelector('button');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'true');
        }
    }

    closeDropdown(dropdown) {
        dropdown.classList.remove('open');
        
        const trigger = dropdown.querySelector('button');
        if (trigger) {
            trigger.setAttribute('aria-expanded', 'false');
        }
        
        if (this.activeDropdown === dropdown) {
            this.activeDropdown = null;
        }
    }

    closeAllDropdowns() {
        document.querySelectorAll('.dropdown.open').forEach(dropdown => {
            this.closeDropdown(dropdown);
        });
    }

    // Theme Management
    showThemeModal() {
        this.showModal('theme-modal');
        
        // Update active theme
        const currentTheme = this.state.getTheme();
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.toggle('active', option.dataset.theme === currentTheme);
        });
    }

    applyTheme(theme) {
        this.state.setTheme(theme);
        this.showToast(`Theme changed to ${theme}`, 'success');
    }

    // Event Handlers
    handleEscapeKey(e) {
        if (e.key === 'Escape') {
            if (this.contextMenu.style.display !== 'none') {
                this.hideContextMenu();
            } else if (this.activeModal) {
                this.closeActiveModal();
            } else if (this.activeDropdown) {
                this.closeAllDropdowns();
            }
        }
    }

    handleClickOutside(e) {
        // Close context menu
        if (this.contextMenu.style.display !== 'none' && !this.contextMenu.contains(e.target)) {
            this.hideContextMenu();
        }
        
        // Close dropdowns
        if (this.activeDropdown && !this.activeDropdown.contains(e.target)) {
            this.closeAllDropdowns();
        }
    }

    // Accessibility Helpers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // Help Modal
    showHelpModal() {
        // Create help modal if it doesn't exist
        if (!document.getElementById('help-modal')) {
            this.createHelpModal();
        }
        
        this.showModal('help-modal');
    }

    createHelpModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'help-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-labelledby', 'help-title');
        modal.setAttribute('aria-hidden', 'true');
        
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h2 class="modal-title" id="help-title">Keyboard Shortcuts</h2>
                    <button class="btn btn-icon" aria-label="Close modal">
                        <svg class="icon" aria-hidden="true">
                            <use href="./assets/icons.svg#icon-close"></use>
                        </svg>
                    </button>
                </div>
                
                <div class="modal-content">
                    <h3>General</h3>
                    <ul>
                        <li><kbd>Ctrl/Cmd + N</kbd> - Add new widget</li>
                        <li><kbd>Ctrl/Cmd + S</kbd> - Save layout</li>
                        <li><kbd>Ctrl/Cmd + O</kbd> - Import layout</li>
                        <li><kbd>Ctrl/Cmd + E</kbd> - Export layout</li>
                        <li><kbd>Ctrl/Cmd + Shift + R</kbd> - Reset to default</li>
                        <li><kbd>T</kbd> - Toggle theme</li>
                        <li><kbd>?</kbd> - Show this help</li>
                        <li><kbd>Escape</kbd> - Close modals/menus</li>
                    </ul>
                    
                    <h3>Widget Navigation</h3>
                    <ul>
                        <li><kbd>Arrow Keys</kbd> - Move widget</li>
                        <li><kbd>Shift + Arrow Keys</kbd> - Resize widget</li>
                        <li><kbd>Page Up/Down</kbd> - Move widget up/down by 5 rows</li>
                        <li><kbd>Home/End</kbd> - Move widget to start/end of row</li>
                        <li><kbd>Tab</kbd> - Navigate between widgets</li>
                    </ul>
                    
                    <h3>Mouse/Touch</h3>
                    <ul>
                        <li>Drag widget header to move</li>
                        <li>Drag widget edges/corners to resize</li>
                        <li>Right-click widget for context menu</li>
                        <li>Long-press on touch devices for context menu</li>
                    </ul>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Set up event listeners
        modal.querySelector('.btn-icon').addEventListener('click', () => {
            this.closeModal(modal);
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
            }
        });
    }
}