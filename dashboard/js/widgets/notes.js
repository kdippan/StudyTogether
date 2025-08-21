/**
 * Notes Widget - Rich text note-taking with autosave
 */

export class NotesWidget {
    static type = 'notes';
    static title = 'Notes';
    static description = 'Rich text note-taking with autosave';
    
    constructor(config = {}) {
        this.config = {
            content: '',
            autosave: true,
            autosaveDelay: 2000, // ms
            placeholder: 'Start typing your notes...',
            enableFormatting: true,
            title: 'Notes',
            ...config
        };
        
        this.element = null;
        this.editor = null;
        this.autosaveTimer = null;
        this.lastSaved = null;
        this.isDirty = false;
        
        this.bindMethods();
    }

    bindMethods() {
        this.handleInput = this.handleInput.bind(this);
        this.handleFormat = this.handleFormat.bind(this);
        this.saveContent = this.saveContent.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item notes-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'Notes widget');
        
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
                <div class="notes-widget">
                    ${this.config.enableFormatting ? this.renderToolbar() : ''}
                    <textarea 
                        class="notes-editor" 
                        id="notes-editor"
                        placeholder="${this.config.placeholder}"
                        aria-label="Note editor"
                    >${this.config.content}</textarea>
                    <div class="notes-status">
                        <span class="notes-status-text" id="notes-status">Ready</span>
                        <span class="notes-word-count" id="notes-word-count">0 words</span>
                    </div>
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderToolbar() {
        return `
            <div class="notes-toolbar" role="toolbar" aria-label="Text formatting">
                <button class="btn btn-sm btn-icon tooltip" 
                        data-format="bold" 
                        aria-label="Bold" 
                        title="Bold (Ctrl+B)">
                    <strong>B</strong>
                </button>
                <button class="btn btn-sm btn-icon tooltip" 
                        data-format="italic" 
                        aria-label="Italic" 
                        title="Italic (Ctrl+I)">
                    <em>I</em>
                </button>
                <button class="btn btn-sm btn-icon tooltip" 
                        data-format="underline" 
                        aria-label="Underline" 
                        title="Underline (Ctrl+U)">
                    <u>U</u>
                </button>
                <div class="toolbar-divider"></div>
                <button class="btn btn-sm btn-icon tooltip" 
                        data-format="list" 
                        aria-label="Bullet list" 
                        title="Bullet List">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-list"></use>
                    </svg>
                </button>
                <button class="btn btn-sm btn-icon tooltip" 
                        data-format="clear" 
                        aria-label="Clear formatting" 
                        title="Clear Formatting">
                    <svg class="icon" aria-hidden="true">
                        <use href="./assets/icons.svg#icon-close"></use>
                    </svg>
                </button>
            </div>
        `;
    }

    async init() {
        this.editor = this.element.querySelector('#notes-editor');
        this.setupEventListeners();
        this.updateWordCount();
        this.lastSaved = Date.now();
        console.log('Notes widget initialized');
    }

    setupEventListeners() {
        // Editor input events
        this.editor.addEventListener('input', this.handleInput);
        this.editor.addEventListener('paste', this.handleInput);
        
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 'b':
                        e.preventDefault();
                        this.handleFormat('bold');
                        break;
                    case 'i':
                        e.preventDefault();
                        this.handleFormat('italic');
                        break;
                    case 'u':
                        e.preventDefault();
                        this.handleFormat('underline');
                        break;
                    case 's':
                        e.preventDefault();
                        this.saveContent();
                        break;
                }
            }
        });
        
        // Toolbar buttons (if enabled)
        if (this.config.enableFormatting) {
            this.element.querySelectorAll('[data-format]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const format = e.target.closest('[data-format]').dataset.format;
                    this.handleFormat(format);
                });
            });
        }
        
        // Widget events
        this.element.addEventListener('refresh', () => {
            this.saveContent();
        });
        
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
        
        // Auto-focus when widget is clicked
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('.widget-header') && !e.target.closest('.notes-toolbar')) {
                this.editor.focus();
            }
        });
    }

    handleInput() {
        this.isDirty = true;
        this.updateStatus('Typing...');
        this.updateWordCount();
        
        if (this.config.autosave) {
            this.scheduleAutosave();
        }
    }

    handleFormat(action) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const selectedText = this.editor.value.substring(start, end);
        
        if (!selectedText && action !== 'list') {
            // If no text is selected, show a message
            this.updateStatus('Select text to format');
            setTimeout(() => this.updateStatus('Ready'), 2000);
            return;
        }
        
        let newText = '';
        let replacement = '';
        
        switch (action) {
            case 'bold':
                replacement = `**${selectedText}**`;
                break;
            case 'italic':
                replacement = `*${selectedText}*`;
                break;
            case 'underline':
                replacement = `<u>${selectedText}</u>`;
                break;
            case 'list':
                const lines = selectedText ? selectedText.split('\n') : [''];
                replacement = lines.map(line => line.trim() ? `• ${line.trim()}` : line).join('\n');
                break;
            case 'clear':
                // Remove common markdown and HTML formatting
                replacement = selectedText
                    .replace(/\*\*(.*?)\*\*/g, '$1')  // bold
                    .replace(/\*(.*?)\*/g, '$1')      // italic
                    .replace(/<u>(.*?)<\/u>/g, '$1')  // underline
                    .replace(/^• /gm, '');            // bullet points
                break;
            default:
                return;
        }
        
        // Replace selected text
        newText = this.editor.value.substring(0, start) + replacement + this.editor.value.substring(end);
        this.editor.value = newText;
        
        // Update selection
        const newSelectionStart = start;
        const newSelectionEnd = start + replacement.length;
        this.editor.setSelectionRange(newSelectionStart, newSelectionEnd);
        
        // Focus back on editor
        this.editor.focus();
        
        // Trigger input event to save changes
        this.handleInput();
        
        this.updateStatus(`Applied ${action} formatting`);
        setTimeout(() => this.updateStatus('Ready'), 2000);
    }

    scheduleAutosave() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        this.autosaveTimer = setTimeout(() => {
            this.saveContent();
        }, this.config.autosaveDelay);
    }

    saveContent() {
        if (!this.isDirty) return;
        
        const content = this.editor.value;
        this.config.content = content;
        this.isDirty = false;
        this.lastSaved = Date.now();
        
        // Dispatch save event for state management
        this.element.dispatchEvent(new CustomEvent('save', {
            detail: { content }
        }));
        
        this.updateStatus('Saved', 'notes-saved');
        setTimeout(() => this.updateStatus('Ready'), 1500);
        
        console.log('Notes content saved');
    }

    updateStatus(message, className = '') {
        const statusElement = this.element.querySelector('#notes-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `notes-status-text ${className}`;
        }
    }

    updateWordCount() {
        const content = this.editor.value.trim();
        const words = content ? content.split(/\s+/).length : 0;
        const chars = content.length;
        
        const countElement = this.element.querySelector('#notes-word-count');
        if (countElement) {
            countElement.textContent = `${words} word${words !== 1 ? 's' : ''}, ${chars} char${chars !== 1 ? 's' : ''}`;
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // Update placeholder
        if (this.editor) {
            this.editor.placeholder = this.config.placeholder;
        }
        
        // If formatting was toggled, rebuild the widget
        if ('enableFormatting' in newConfig) {
            this.rebuildWidget();
        }
    }

    rebuildWidget() {
        // Save current content
        const currentContent = this.editor ? this.editor.value : this.config.content;
        this.config.content = currentContent;
        
        // Rebuild widget content
        const widgetContent = this.element.querySelector('.widget-content');
        widgetContent.innerHTML = `
            <div class="notes-widget">
                ${this.config.enableFormatting ? this.renderToolbar() : ''}
                <textarea 
                    class="notes-editor" 
                    id="notes-editor"
                    placeholder="${this.config.placeholder}"
                    aria-label="Note editor"
                >${this.config.content}</textarea>
                <div class="notes-status">
                    <span class="notes-status-text" id="notes-status">Ready</span>
                    <span class="notes-word-count" id="notes-word-count">0 words</span>
                </div>
            </div>
        `;
        
        // Re-initialize
        this.editor = this.element.querySelector('#notes-editor');
        this.setupEventListeners();
        this.updateWordCount();
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label" for="notes-placeholder">Placeholder Text</label>
                <input type="text" id="notes-placeholder" name="placeholder" class="form-input" 
                       value="${config.placeholder || ''}" 
                       placeholder="Enter placeholder text">
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="notes-autosave" name="autosave" 
                           ${config.autosave ? 'checked' : ''} class="form-checkbox">
                    Enable Autosave
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="notes-autosave-delay">Autosave Delay (seconds)</label>
                <select id="notes-autosave-delay" name="autosaveDelay" class="form-select">
                    <option value="1000" ${config.autosaveDelay === 1000 ? 'selected' : ''}>1 second</option>
                    <option value="2000" ${config.autosaveDelay === 2000 ? 'selected' : ''}>2 seconds</option>
                    <option value="5000" ${config.autosaveDelay === 5000 ? 'selected' : ''}>5 seconds</option>
                    <option value="10000" ${config.autosaveDelay === 10000 ? 'selected' : ''}>10 seconds</option>
                </select>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="notes-formatting" name="enableFormatting" 
                           ${config.enableFormatting ? 'checked' : ''} class="form-checkbox">
                    Enable Formatting Toolbar
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="notes-export">Export Notes</label>
                <button type="button" id="notes-export" class="btn btn-secondary" 
                        onclick="this.closest('.modal').dispatchEvent(new CustomEvent('exportNotes'))">
                    Download as Text File
                </button>
            </div>
        `;
    }

    exportNotes() {
        const content = this.config.content;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `notes-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    // Search functionality
    search(query) {
        const content = this.config.content.toLowerCase();
        const searchTerm = query.toLowerCase();
        return content.includes(searchTerm);
    }

    highlight(query) {
        if (!query) return;
        
        const content = this.editor.value;
        const searchTerm = query.toLowerCase();
        const contentLower = content.toLowerCase();
        
        const index = contentLower.indexOf(searchTerm);
        if (index !== -1) {
            this.editor.focus();
            this.editor.setSelectionRange(index, index + query.length);
            this.updateStatus(`Found: "${query}"`);
        } else {
            this.updateStatus(`Not found: "${query}"`);
        }
        
        setTimeout(() => this.updateStatus('Ready'), 2000);
    }

    getWordCount() {
        const content = this.config.content.trim();
        return content ? content.split(/\s+/).length : 0;
    }

    getCharCount() {
        return this.config.content.length;
    }

    isEmpty() {
        return !this.config.content.trim();
    }

    refresh() {
        this.updateWordCount();
        this.updateStatus('Ready');
    }

    pause() {
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
    }

    resume() {
        if (this.isDirty && this.config.autosave) {
            this.scheduleAutosave();
        }
    }

    destroy() {
        // Save any unsaved changes
        if (this.isDirty) {
            this.saveContent();
        }
        
        if (this.autosaveTimer) {
            clearTimeout(this.autosaveTimer);
        }
        
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        // Always include current editor content
        if (this.editor) {
            this.config.content = this.editor.value;
        }
        return { ...this.config };
    }
}