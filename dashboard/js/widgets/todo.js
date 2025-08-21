/**
 * Todo Widget - Task management with filters and stats
 */

export class TodoWidget {
    static type = 'todo';
    static title = 'Todo List';
    static description = 'Task management with filters and stats';
    
    constructor(config = {}) {
        this.config = {
            tasks: [],
            filter: 'all', // all, active, completed
            showStats: true,
            allowReorder: true,
            title: 'Todo List',
            ...config
        };
        
        this.element = null;
        this.taskIdCounter = Date.now();
        
        this.bindMethods();
    }

    bindMethods() {
        this.addTask = this.addTask.bind(this);
        this.toggleTask = this.toggleTask.bind(this);
        this.removeTask = this.removeTask.bind(this);
        this.setFilter = this.setFilter.bind(this);
        this.handleKeyPress = this.handleKeyPress.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item todo-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Todo list widget');
        
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
                <div class="todo-widget">
                    ${this.renderTodoInterface()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderTodoInterface() {
        return `
            <div class="todo-add">
                <input type="text" 
                       class="todo-input" 
                       id="todo-input"
                       placeholder="Add a new task..."
                       aria-label="New task">
                <button class="btn btn-primary btn-sm" 
                        id="todo-add-btn"
                        aria-label="Add task">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-plus"></use>
                    </svg>
                </button>
            </div>
            
            <div class="todo-filters">
                <button class="todo-filter ${this.config.filter === 'all' ? 'active' : ''}" 
                        data-filter="all">All</button>
                <button class="todo-filter ${this.config.filter === 'active' ? 'active' : ''}" 
                        data-filter="active">Active</button>
                <button class="todo-filter ${this.config.filter === 'completed' ? 'active' : ''}" 
                        data-filter="completed">Done</button>
            </div>
            
            <div class="todo-list" id="todo-list" role="list">
                ${this.renderTasks()}
            </div>
            
            ${this.config.showStats ? this.renderStats() : ''}
        `;
    }

    renderTasks() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            return `
                <div class="todo-empty">
                    ${this.getEmptyMessage()}
                </div>
            `;
        }
        
        return filteredTasks.map(task => this.renderTask(task)).join('');
    }

    renderTask(task) {
        return `
            <div class="todo-item ${task.completed ? 'completed' : ''}" 
                 data-task-id="${task.id}"
                 role="listitem">
                <input type="checkbox" 
                       class="todo-checkbox form-checkbox" 
                       ${task.completed ? 'checked' : ''}
                       aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
                <span class="todo-text">${this.escapeHtml(task.text)}</span>
                <button class="todo-delete btn btn-icon btn-sm tooltip" 
                        aria-label="Delete task" 
                        title="Delete task">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-close"></use>
                    </svg>
                </button>
            </div>
        `;
    }

    renderStats() {
        const total = this.config.tasks.length;
        const completed = this.config.tasks.filter(t => t.completed).length;
        const active = total - completed;
        
        return `
            <div class="todo-stats">
                <span>Total: ${total}</span>
                <span>Active: ${active}</span>
                <span>Done: ${completed}</span>
            </div>
        `;
    }

    getFilteredTasks() {
        switch (this.config.filter) {
            case 'active':
                return this.config.tasks.filter(task => !task.completed);
            case 'completed':
                return this.config.tasks.filter(task => task.completed);
            default:
                return this.config.tasks;
        }
    }

    getEmptyMessage() {
        switch (this.config.filter) {
            case 'active':
                return '🎉 No active tasks!';
            case 'completed':
                return 'No completed tasks yet.';
            default:
                return 'No tasks yet. Add one above!';
        }
    }

    async init() {
        this.setupEventListeners();
        console.log('Todo widget initialized');
    }

    setupEventListeners() {
        const input = this.element.querySelector('#todo-input');
        const addBtn = this.element.querySelector('#todo-add-btn');
        
        // Add task events
        addBtn.addEventListener('click', this.addTask);
        input.addEventListener('keypress', this.handleKeyPress);
        
        // Filter events
        this.element.querySelectorAll('.todo-filter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });
        
        // Task events (using event delegation)
        this.element.addEventListener('change', (e) => {
            if (e.target.classList.contains('todo-checkbox')) {
                const taskId = parseInt(e.target.closest('.todo-item').dataset.taskId);
                this.toggleTask(taskId);
            }
        });
        
        this.element.addEventListener('click', (e) => {
            if (e.target.closest('.todo-delete')) {
                const taskId = parseInt(e.target.closest('.todo-item').dataset.taskId);
                this.removeTask(taskId);
            }
        });
        
        // Widget events
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
        
        // Drag and drop for reordering (if enabled)
        if (this.config.allowReorder) {
            this.setupDragAndDrop();
        }
    }

    setupDragAndDrop() {
        const todoList = this.element.querySelector('#todo-list');
        
        todoList.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.add('dragging');
                e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
            }
        });
        
        todoList.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('todo-item')) {
                e.target.classList.remove('dragging');
            }
        });
        
        todoList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const draggingElement = todoList.querySelector('.dragging');
            const afterElement = this.getDragAfterElement(todoList, e.clientY);
            
            if (afterElement == null) {
                todoList.appendChild(draggingElement);
            } else {
                todoList.insertBefore(draggingElement, afterElement);
            }
        });
        
        todoList.addEventListener('drop', (e) => {
            e.preventDefault();
            this.updateTaskOrder();
        });
        
        // Make tasks draggable
        this.element.querySelectorAll('.todo-item').forEach(item => {
            item.draggable = true;
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    updateTaskOrder() {
        const taskElements = this.element.querySelectorAll('.todo-item');
        const newOrder = Array.from(taskElements).map(el => 
            parseInt(el.dataset.taskId)
        );
        
        const reorderedTasks = newOrder.map(id => 
            this.config.tasks.find(task => task.id === id)
        ).filter(Boolean);
        
        this.config.tasks = reorderedTasks;
        this.saveConfig();
    }

    handleKeyPress(e) {
        if (e.key === 'Enter') {
            this.addTask();
        }
    }

    addTask() {
        const input = this.element.querySelector('#todo-input');
        const text = input.value.trim();
        
        if (!text) return;
        
        const task = {
            id: ++this.taskIdCounter,
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };
        
        this.config.tasks.unshift(task); // Add to beginning
        input.value = '';
        
        this.renderUpdatedInterface();
        this.saveConfig();
        
        // Focus back on input for quick addition
        input.focus();
        
        console.log('Added task:', task.text);
    }

    toggleTask(taskId) {
        const task = this.config.tasks.find(t => t.id === taskId);
        if (!task) return;
        
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        
        // Find the task element and add animation
        const taskElement = this.element.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('animate-spring');
            setTimeout(() => {
                taskElement.classList.remove('animate-spring');
            }, 600);
        }
        
        this.renderUpdatedInterface();
        this.saveConfig();
        
        console.log('Toggled task:', task.text, task.completed ? 'completed' : 'active');
    }

    removeTask(taskId) {
        const taskIndex = this.config.tasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.config.tasks[taskIndex];
        
        // Add animation before removing
        const taskElement = this.element.querySelector(`[data-task-id="${taskId}"]`);
        if (taskElement) {
            taskElement.classList.add('animate-scale-out');
            setTimeout(() => {
                this.config.tasks.splice(taskIndex, 1);
                this.renderUpdatedInterface();
                this.saveConfig();
            }, 250);
        } else {
            this.config.tasks.splice(taskIndex, 1);
            this.renderUpdatedInterface();
            this.saveConfig();
        }
        
        console.log('Removed task:', task.text);
    }

    setFilter(filter) {
        this.config.filter = filter;
        
        // Update filter buttons
        this.element.querySelectorAll('.todo-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Re-render task list
        const todoList = this.element.querySelector('#todo-list');
        todoList.innerHTML = this.renderTasks();
        
        // Re-setup drag and drop if needed
        if (this.config.allowReorder) {
            this.setupDragAndDrop();
        }
        
        this.saveConfig();
    }

    renderUpdatedInterface() {
        const todoList = this.element.querySelector('#todo-list');
        todoList.innerHTML = this.renderTasks();
        
        if (this.config.showStats) {
            const statsElement = this.element.querySelector('.todo-stats');
            if (statsElement) {
                statsElement.outerHTML = this.renderStats();
            }
        }
        
        // Re-setup drag and drop if needed
        if (this.config.allowReorder) {
            this.setupDragAndDrop();
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // Re-render interface if needed
        this.renderUpdatedInterface();
    }

    saveConfig() {
        // Dispatch save event for state management
        this.element.dispatchEvent(new CustomEvent('save', {
            detail: { config: this.config }
        }));
    }

    // Bulk operations
    clearCompleted() {
        const completedCount = this.config.tasks.filter(t => t.completed).length;
        this.config.tasks = this.config.tasks.filter(t => !t.completed);
        this.renderUpdatedInterface();
        this.saveConfig();
        return completedCount;
    }

    markAllComplete() {
        this.config.tasks.forEach(task => {
            task.completed = true;
            task.updatedAt = new Date().toISOString();
        });
        this.renderUpdatedInterface();
        this.saveConfig();
    }

    markAllIncomplete() {
        this.config.tasks.forEach(task => {
            task.completed = false;
            task.updatedAt = new Date().toISOString();
        });
        this.renderUpdatedInterface();
        this.saveConfig();
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="todo-show-stats" name="showStats" 
                           ${config.showStats ? 'checked' : ''} class="form-checkbox">
                    Show Statistics
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="todo-allow-reorder" name="allowReorder" 
                           ${config.allowReorder ? 'checked' : ''} class="form-checkbox">
                    Allow Drag to Reorder
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="todo-default-filter">Default Filter</label>
                <select id="todo-default-filter" name="filter" class="form-select">
                    <option value="all" ${config.filter === 'all' ? 'selected' : ''}>All Tasks</option>
                    <option value="active" ${config.filter === 'active' ? 'selected' : ''}>Active Only</option>
                    <option value="completed" ${config.filter === 'completed' ? 'selected' : ''}>Completed Only</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">Bulk Actions</label>
                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <button type="button" class="btn btn-sm btn-secondary" 
                            onclick="this.closest('.modal').dispatchEvent(new CustomEvent('markAllComplete'))">
                        Mark All Complete
                    </button>
                    <button type="button" class="btn btn-sm btn-secondary" 
                            onclick="this.closest('.modal').dispatchEvent(new CustomEvent('markAllIncomplete'))">
                        Mark All Incomplete
                    </button>
                    <button type="button" class="btn btn-sm btn-warning" 
                            onclick="this.closest('.modal').dispatchEvent(new CustomEvent('clearCompleted'))">
                        Clear Completed
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">Export Tasks</label>
                <button type="button" class="btn btn-sm btn-secondary" 
                        onclick="this.closest('.modal').dispatchEvent(new CustomEvent('exportTasks'))">
                    Download as Text File
                </button>
            </div>
        `;
    }

    exportTasks() {
        const content = this.config.tasks.map(task => {
            const status = task.completed ? '[x]' : '[ ]';
            return `${status} ${task.text}`;
        }).join('\n');
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `todo-list-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Statistics
    getStats() {
        const total = this.config.tasks.length;
        const completed = this.config.tasks.filter(t => t.completed).length;
        const active = total - completed;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return {
            total,
            completed,
            active,
            completionRate
        };
    }

    // Search functionality
    search(query) {
        const searchTerm = query.toLowerCase();
        return this.config.tasks.some(task => 
            task.text.toLowerCase().includes(searchTerm)
        );
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refresh() {
        this.renderUpdatedInterface();
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