/**
 * Grid System - Drag, Drop, Resize with Grid Snapping
 * Handles all widget positioning, dragging, and resizing operations
 */

export class Grid {
    constructor() {
        this.state = null;
        this.gridContainer = null;
        this.gridConfig = {
            cols: 12,
            rowHeight: 60,
            gap: 16
        };
        
        // Drag state
        this.isDragging = false;
        this.dragElement = null;
        this.dragData = null;
        this.dragGhost = null;
        this.dragOffset = { x: 0, y: 0 };
        
        // Resize state
        this.isResizing = false;
        this.resizeElement = null;
        this.resizeData = null;
        this.resizeHandle = null;
        
        // Auto-scroll
        this.autoScrollTimer = null;
        this.scrollSpeed = 20;
        this.scrollZone = 50;
        
        // Touch support
        this.touchSupported = 'ontouchstart' in window;
        this.pointerEvents = 'PointerEvent' in window;
        
        // Performance
        this.animationFrame = null;
        
        this.bindMethods();
    }

    bindMethods() {
        this.handlePointerDown = this.handlePointerDown.bind(this);
        this.handlePointerMove = this.handlePointerMove.bind(this);
        this.handlePointerUp = this.handlePointerUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    async init(state) {
        this.state = state;
        this.gridContainer = document.getElementById('widget-grid');
        
        if (!this.gridContainer) {
            throw new Error('Grid container not found');
        }

        // Set up grid configuration
        this.updateGridConfig(state.getGridConfig());
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Listen for state changes
        state.on('gridUpdated', (config) => {
            this.updateGridConfig(config);
        });

        console.log('Grid system initialized');
    }

    setupEventListeners() {
        // Pointer events for drag/resize
        if (this.pointerEvents) {
            this.gridContainer.addEventListener('pointerdown', this.handlePointerDown);
            document.addEventListener('pointermove', this.handlePointerMove);
            document.addEventListener('pointerup', this.handlePointerUp);
        } else {
            // Fallback to mouse/touch events
            this.gridContainer.addEventListener('mousedown', this.handlePointerDown);
            this.gridContainer.addEventListener('touchstart', this.handlePointerDown, { passive: false });
            document.addEventListener('mousemove', this.handlePointerMove);
            document.addEventListener('touchmove', this.handlePointerMove, { passive: false });
            document.addEventListener('mouseup', this.handlePointerUp);
            document.addEventListener('touchend', this.handlePointerUp);
        }

        // Keyboard navigation
        document.addEventListener('keydown', this.handleKeyDown);

        // Window resize
        window.addEventListener('resize', this.handleResize);

        // Prevent context menu during drag
        this.gridContainer.addEventListener('contextmenu', (e) => {
            if (this.isDragging || this.isResizing) {
                e.preventDefault();
            }
        });
    }

    updateGridConfig(config) {
        this.gridConfig = { ...this.gridConfig, ...config };
        
        // Update CSS custom properties
        document.documentElement.style.setProperty('--grid-cols', this.gridConfig.cols);
        document.documentElement.style.setProperty('--grid-gap', `${this.gridConfig.gap}px`);
        document.documentElement.style.setProperty('--grid-row-height', `${this.gridConfig.rowHeight}px`);
        
        // Update existing widgets
        this.updateAllWidgetPositions();
    }

    updateAllWidgetPositions() {
        const widgets = this.gridContainer.querySelectorAll('.widget-grid-item');
        widgets.forEach(element => {
            const widgetId = element.dataset.widgetId;
            const widget = this.state.getWidget(widgetId);
            if (widget) {
                this.setElementPosition(element, widget);
            }
        });
    }

    setElementPosition(element, widget) {
        const { x, y, w, h } = widget;
        
        // Set CSS grid position
        element.style.gridColumn = `${x + 1} / span ${w}`;
        element.style.gridRow = `${y + 1} / span ${h}`;
        
        // Add resize handles if not already present
        this.addResizeHandles(element);
    }

    addResizeHandles(element) {
        // Check if handles already exist
        if (element.querySelector('.resize-handle')) {
            return;
        }

        const handles = [
            'resize-n', 'resize-e', 'resize-s', 'resize-w',
            'resize-ne', 'resize-nw', 'resize-se', 'resize-sw'
        ];

        handles.forEach(className => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${className}`;
            handle.dataset.direction = className.replace('resize-', '');
            element.appendChild(handle);
        });
    }

    // Pointer Event Handling
    handlePointerDown(e) {
        // Ignore right clicks
        if (e.button === 2) return;

        const target = e.target.closest('.widget-grid-item');
        const resizeHandle = e.target.closest('.resize-handle');
        const dragHandle = e.target.closest('.widget-drag-handle');

        if (resizeHandle && target) {
            this.startResize(e, target, resizeHandle);
        } else if (dragHandle && target) {
            this.startDrag(e, target);
        }
    }

    handlePointerMove(e) {
        if (this.isDragging) {
            this.updateDrag(e);
        } else if (this.isResizing) {
            this.updateResize(e);
        }
    }

    handlePointerUp(e) {
        if (this.isDragging) {
            this.endDrag(e);
        } else if (this.isResizing) {
            this.endResize(e);
        }
    }

    // Drag Operations
    startDrag(e, element) {
        e.preventDefault();
        
        const widgetId = element.dataset.widgetId;
        const widget = this.state.getWidget(widgetId);
        
        if (!widget) return;

        this.isDragging = true;
        this.dragElement = element;
        this.dragData = { ...widget };
        
        // Calculate offset from mouse to element top-left
        const rect = element.getBoundingClientRect();
        const containerRect = this.gridContainer.getBoundingClientRect();
        
        this.dragOffset = {
            x: this.getPointerX(e) - rect.left,
            y: this.getPointerY(e) - rect.top
        };

        // Add dragging class
        element.classList.add('dragging');
        element.style.willChange = 'transform';
        
        // Create ghost element
        this.createDragGhost(widget);
        
        // Focus the element for keyboard navigation
        element.focus();
        
        // Start auto-scroll detection
        this.startAutoScroll();
        
        // Prevent text selection
        document.body.style.userSelect = 'none';
        
        console.log('Started dragging widget:', widgetId);
    }

    updateDrag(e) {
        if (!this.isDragging || !this.dragElement) return;

        e.preventDefault();
        
        const pointer = {
            x: this.getPointerX(e),
            y: this.getPointerY(e)
        };
        
        // Update element position
        const rect = this.gridContainer.getBoundingClientRect();
        const x = pointer.x - rect.left - this.dragOffset.x;
        const y = pointer.y - rect.top - this.dragOffset.y;
        
        this.dragElement.style.transform = `translate(${x}px, ${y}px)`;
        
        // Update ghost position
        this.updateDragGhost(pointer);
        
        // Update auto-scroll
        this.updateAutoScroll(pointer);
    }

    endDrag(e) {
        if (!this.isDragging || !this.dragElement) return;

        const newPosition = this.getDragDropPosition(e);
        const widgetId = this.dragElement.dataset.widgetId;
        
        // Remove dragging state
        this.isDragging = false;
        this.dragElement.classList.remove('dragging');
        this.dragElement.style.transform = '';
        this.dragElement.style.willChange = '';
        
        // Clean up
        this.removeDragGhost();
        this.stopAutoScroll();
        document.body.style.userSelect = '';
        
        // Update widget position in state
        if (newPosition && (newPosition.x !== this.dragData.x || newPosition.y !== this.dragData.y)) {
            this.state.moveWidget(widgetId, newPosition.x, newPosition.y);
            
            // Animate to final position
            this.animateToPosition(this.dragElement);
        }
        
        this.dragElement = null;
        this.dragData = null;
        
        console.log('Ended drag operation');
    }

    getDragDropPosition(e) {
        const containerRect = this.gridContainer.getBoundingClientRect();
        const pointer = {
            x: this.getPointerX(e) - containerRect.left,
            y: this.getPointerY(e) - containerRect.top
        };

        // Convert to grid coordinates
        const colWidth = (containerRect.width - (this.gridConfig.cols - 1) * this.gridConfig.gap) / this.gridConfig.cols;
        const rowHeight = this.gridConfig.rowHeight;
        
        const x = Math.round(pointer.x / (colWidth + this.gridConfig.gap));
        const y = Math.round(pointer.y / (rowHeight + this.gridConfig.gap));
        
        // Validate bounds
        const maxX = this.gridConfig.cols - this.dragData.w;
        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, y);
        
        // Check for collisions
        const testWidget = {
            ...this.dragData,
            x: clampedX,
            y: clampedY
        };
        
        if (!this.state.hasCollision(testWidget, this.dragData.id)) {
            return { x: clampedX, y: clampedY };
        }
        
        // Find alternative position
        return this.state.findAvailablePosition(testWidget);
    }

    createDragGhost(widget) {
        this.dragGhost = document.createElement('div');
        this.dragGhost.className = 'widget-drag-ghost';
        this.dragGhost.style.gridColumn = `${widget.x + 1} / span ${widget.w}`;
        this.dragGhost.style.gridRow = `${widget.y + 1} / span ${widget.h}`;
        this.gridContainer.appendChild(this.dragGhost);
    }

    updateDragGhost(pointer) {
        if (!this.dragGhost) return;

        const newPosition = this.getGhostPosition(pointer);
        if (newPosition) {
            this.dragGhost.style.gridColumn = `${newPosition.x + 1} / span ${this.dragData.w}`;
            this.dragGhost.style.gridRow = `${newPosition.y + 1} / span ${this.dragData.h}`;
            this.dragGhost.style.opacity = '0.3';
        } else {
            this.dragGhost.style.opacity = '0.1';
        }
    }

    getGhostPosition(pointer) {
        const containerRect = this.gridContainer.getBoundingClientRect();
        const relativePointer = {
            x: pointer.x - containerRect.left,
            y: pointer.y - containerRect.top
        };

        const colWidth = (containerRect.width - (this.gridConfig.cols - 1) * this.gridConfig.gap) / this.gridConfig.cols;
        const rowHeight = this.gridConfig.rowHeight;
        
        const x = Math.round(relativePointer.x / (colWidth + this.gridConfig.gap));
        const y = Math.round(relativePointer.y / (rowHeight + this.gridConfig.gap));
        
        const maxX = this.gridConfig.cols - this.dragData.w;
        const clampedX = Math.max(0, Math.min(x, maxX));
        const clampedY = Math.max(0, y);
        
        const testWidget = {
            ...this.dragData,
            x: clampedX,
            y: clampedY
        };
        
        return !this.state.hasCollision(testWidget, this.dragData.id) ? 
               { x: clampedX, y: clampedY } : null;
    }

    removeDragGhost() {
        if (this.dragGhost) {
            this.dragGhost.remove();
            this.dragGhost = null;
        }
    }

    // Resize Operations
    startResize(e, element, handle) {
        e.preventDefault();
        e.stopPropagation();
        
        const widgetId = element.dataset.widgetId;
        const widget = this.state.getWidget(widgetId);
        
        if (!widget) return;

        this.isResizing = true;
        this.resizeElement = element;
        this.resizeData = { ...widget };
        this.resizeHandle = handle.dataset.direction;
        
        // Add resizing class
        element.classList.add('resizing');
        handle.classList.add('active');
        
        // Store initial pointer position
        this.resizeStartPointer = {
            x: this.getPointerX(e),
            y: this.getPointerY(e)
        };
        
        // Store initial dimensions
        this.resizeStartDimensions = {
            w: widget.w,
            h: widget.h,
            x: widget.x,
            y: widget.y
        };
        
        console.log('Started resizing widget:', widgetId, 'direction:', this.resizeHandle);
    }

    updateResize(e) {
        if (!this.isResizing || !this.resizeElement) return;

        e.preventDefault();
        
        const pointer = {
            x: this.getPointerX(e),
            y: this.getPointerY(e)
        };
        
        const deltaX = pointer.x - this.resizeStartPointer.x;
        const deltaY = pointer.y - this.resizeStartPointer.y;
        
        // Convert pixel delta to grid units
        const containerRect = this.gridContainer.getBoundingClientRect();
        const colWidth = (containerRect.width - (this.gridConfig.cols - 1) * this.gridConfig.gap) / this.gridConfig.cols;
        const rowHeight = this.gridConfig.rowHeight;
        
        const deltaGridX = Math.round(deltaX / (colWidth + this.gridConfig.gap));
        const deltaGridY = Math.round(deltaY / (rowHeight + this.gridConfig.gap));
        
        const newDimensions = this.calculateResizeDimensions(deltaGridX, deltaGridY);
        
        if (newDimensions) {
            // Apply the new dimensions temporarily
            this.resizeElement.style.gridColumn = `${newDimensions.x + 1} / span ${newDimensions.w}`;
            this.resizeElement.style.gridRow = `${newDimensions.y + 1} / span ${newDimensions.h}`;
        }
    }

    calculateResizeDimensions(deltaX, deltaY) {
        const { w, h, x, y } = this.resizeStartDimensions;
        let newW = w, newH = h, newX = x, newY = y;
        
        switch (this.resizeHandle) {
            case 'e': // East
                newW = Math.max(1, w + deltaX);
                break;
            case 'w': // West
                newW = Math.max(1, w - deltaX);
                newX = Math.max(0, x + deltaX);
                break;
            case 's': // South
                newH = Math.max(1, h + deltaY);
                break;
            case 'n': // North
                newH = Math.max(1, h - deltaY);
                newY = Math.max(0, y + deltaY);
                break;
            case 'se': // Southeast
                newW = Math.max(1, w + deltaX);
                newH = Math.max(1, h + deltaY);
                break;
            case 'sw': // Southwest
                newW = Math.max(1, w - deltaX);
                newH = Math.max(1, h + deltaY);
                newX = Math.max(0, x + deltaX);
                break;
            case 'ne': // Northeast
                newW = Math.max(1, w + deltaX);
                newH = Math.max(1, h - deltaY);
                newY = Math.max(0, y + deltaY);
                break;
            case 'nw': // Northwest
                newW = Math.max(1, w - deltaX);
                newH = Math.max(1, h - deltaY);
                newX = Math.max(0, x + deltaX);
                newY = Math.max(0, y + deltaY);
                break;
        }
        
        // Validate bounds
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        newW = Math.max(1, Math.min(newW, this.gridConfig.cols - newX));
        newH = Math.max(1, newH);
        
        // Check for collisions
        const testWidget = {
            ...this.resizeData,
            x: newX,
            y: newY,
            w: newW,
            h: newH
        };
        
        if (!this.state.hasCollision(testWidget, this.resizeData.id)) {
            return testWidget;
        }
        
        return null;
    }

    endResize(e) {
        if (!this.isResizing || !this.resizeElement) return;

        const newDimensions = this.getResizeEndDimensions(e);
        const widgetId = this.resizeElement.dataset.widgetId;
        
        // Remove resizing state
        this.isResizing = false;
        this.resizeElement.classList.remove('resizing');
        this.resizeElement.querySelectorAll('.resize-handle.active').forEach(handle => {
            handle.classList.remove('active');
        });
        
        // Update widget in state
        if (newDimensions) {
            const hasChanged = newDimensions.x !== this.resizeData.x ||
                             newDimensions.y !== this.resizeData.y ||
                             newDimensions.w !== this.resizeData.w ||
                             newDimensions.h !== this.resizeData.h;
            
            if (hasChanged) {
                this.state.updateWidget({
                    ...this.resizeData,
                    x: newDimensions.x,
                    y: newDimensions.y,
                    w: newDimensions.w,
                    h: newDimensions.h
                });
            }
        }
        
        this.resizeElement = null;
        this.resizeData = null;
        this.resizeHandle = null;
        
        console.log('Ended resize operation');
    }

    getResizeEndDimensions(e) {
        const pointer = {
            x: this.getPointerX(e),
            y: this.getPointerY(e)
        };
        
        const deltaX = pointer.x - this.resizeStartPointer.x;
        const deltaY = pointer.y - this.resizeStartPointer.y;
        
        const containerRect = this.gridContainer.getBoundingClientRect();
        const colWidth = (containerRect.width - (this.gridConfig.cols - 1) * this.gridConfig.gap) / this.gridConfig.cols;
        const rowHeight = this.gridConfig.rowHeight;
        
        const deltaGridX = Math.round(deltaX / (colWidth + this.gridConfig.gap));
        const deltaGridY = Math.round(deltaY / (rowHeight + this.gridConfig.gap));
        
        return this.calculateResizeDimensions(deltaGridX, deltaGridY);
    }

    // Auto-scroll functionality
    startAutoScroll() {
        this.autoScrollTimer = setInterval(() => {
            if (this.isDragging) {
                this.performAutoScroll();
            }
        }, 16); // ~60fps
    }

    updateAutoScroll(pointer) {
        const containerRect = this.gridContainer.getBoundingClientRect();
        const scrollContainer = this.gridContainer.parentElement;
        
        this.autoScrollDirection = {
            x: 0,
            y: 0
        };
        
        // Check horizontal scroll
        if (pointer.x < containerRect.left + this.scrollZone) {
            this.autoScrollDirection.x = -1;
        } else if (pointer.x > containerRect.right - this.scrollZone) {
            this.autoScrollDirection.x = 1;
        }
        
        // Check vertical scroll
        if (pointer.y < containerRect.top + this.scrollZone) {
            this.autoScrollDirection.y = -1;
        } else if (pointer.y > containerRect.bottom - this.scrollZone) {
            this.autoScrollDirection.y = 1;
        }
    }

    performAutoScroll() {
        if (!this.autoScrollDirection) return;
        
        const scrollContainer = this.gridContainer.parentElement;
        
        if (this.autoScrollDirection.x !== 0) {
            scrollContainer.scrollLeft += this.autoScrollDirection.x * this.scrollSpeed;
        }
        
        if (this.autoScrollDirection.y !== 0) {
            scrollContainer.scrollTop += this.autoScrollDirection.y * this.scrollSpeed;
        }
    }

    stopAutoScroll() {
        if (this.autoScrollTimer) {
            clearInterval(this.autoScrollTimer);
            this.autoScrollTimer = null;
        }
        this.autoScrollDirection = null;
    }

    // Keyboard Navigation
    handleKeyDown(e) {
        const focusedWidget = document.activeElement.closest('.widget-grid-item');
        if (!focusedWidget) return;

        const widgetId = focusedWidget.dataset.widgetId;
        const widget = this.state.getWidget(widgetId);
        if (!widget) return;

        const key = e.key;
        const shift = e.shiftKey;
        let handled = false;

        if (shift) {
            // Resize with Shift + Arrow keys
            switch (key) {
                case 'ArrowRight':
                    this.state.resizeWidget(widgetId, widget.w + 1, widget.h);
                    handled = true;
                    break;
                case 'ArrowLeft':
                    this.state.resizeWidget(widgetId, Math.max(1, widget.w - 1), widget.h);
                    handled = true;
                    break;
                case 'ArrowDown':
                    this.state.resizeWidget(widgetId, widget.w, widget.h + 1);
                    handled = true;
                    break;
                case 'ArrowUp':
                    this.state.resizeWidget(widgetId, widget.w, Math.max(1, widget.h - 1));
                    handled = true;
                    break;
            }
        } else {
            // Move with Arrow keys
            switch (key) {
                case 'ArrowRight':
                    this.state.moveWidget(widgetId, widget.x + 1, widget.y);
                    handled = true;
                    break;
                case 'ArrowLeft':
                    this.state.moveWidget(widgetId, Math.max(0, widget.x - 1), widget.y);
                    handled = true;
                    break;
                case 'ArrowDown':
                    this.state.moveWidget(widgetId, widget.x, widget.y + 1);
                    handled = true;
                    break;
                case 'ArrowUp':
                    this.state.moveWidget(widgetId, widget.x, Math.max(0, widget.y - 1));
                    handled = true;
                    break;
                case 'PageDown':
                    this.state.moveWidget(widgetId, widget.x, widget.y + 5);
                    handled = true;
                    break;
                case 'PageUp':
                    this.state.moveWidget(widgetId, widget.x, Math.max(0, widget.y - 5));
                    handled = true;
                    break;
                case 'Home':
                    this.state.moveWidget(widgetId, 0, widget.y);
                    handled = true;
                    break;
                case 'End':
                    this.state.moveWidget(widgetId, this.gridConfig.cols - widget.w, widget.y);
                    handled = true;
                    break;
            }
        }

        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }

    // Utility Methods
    getPointerX(e) {
        return e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    }

    getPointerY(e) {
        return e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    }

    animateToPosition(element) {
        element.classList.add('animate-spring');
        setTimeout(() => {
            element.classList.remove('animate-spring');
        }, 600);
    }

    handleResize() {
        // Debounce resize handling
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.updateAllWidgetPositions();
        }, 150);
    }

    // Debug Methods
    showGridOverlay() {
        const overlay = document.getElementById('grid-overlay');
        if (overlay) {
            overlay.innerHTML = '';
            overlay.classList.add('visible');
            
            // Generate grid cells
            for (let row = 0; row < 20; row++) {
                for (let col = 0; col < this.gridConfig.cols; col++) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell';
                    cell.style.gridColumn = `${col + 1}`;
                    cell.style.gridRow = `${row + 1}`;
                    overlay.appendChild(cell);
                }
            }
        }
    }

    hideGridOverlay() {
        const overlay = document.getElementById('grid-overlay');
        if (overlay) {
            overlay.classList.remove('visible');
        }
    }
}