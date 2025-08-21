/**
 * System Widget - Device and browser information
 */

export class SystemWidget {
    static type = 'system';
    static title = 'System Info';
    static description = 'Device and browser information';
    
    constructor(config = {}) {
        this.config = {
            showBattery: true,
            showNetwork: true,
            showMemory: true,
            showPerformance: false,
            refreshInterval: 5, // seconds
            title: 'System Info',
            ...config
        };
        
        this.element = null;
        this.refreshTimer = null;
        this.isVisible = true;
        
        this.bindMethods();
    }

    bindMethods() {
        this.updateSystemInfo = this.updateSystemInfo.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    }

    async createElement() {
        this.element = document.createElement('div');
        this.element.className = 'widget-grid-item system-widget-container';
        this.element.setAttribute('tabindex', '0');
        this.element.setAttribute('role', 'region');
        this.element.setAttribute('aria-label', 'System information widget');
        
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
                            aria-label="Refresh system info" title="Refresh">
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
                <div class="system-widget" id="system-content">
                    ${this.renderLoading()}
                </div>
            </div>
        `;
        
        return this.element;
    }

    renderLoading() {
        return `
            <div class="widget-loading">
                <div class="spinner"></div>
                <span>Loading system info...</span>
            </div>
        `;
    }

    renderSystemInfo(data) {
        return `
            <div class="system-info">
                <div class="system-item">
                    <span class="system-label">Browser</span>
                    <span class="system-value">${data.browser}</span>
                </div>
                
                <div class="system-item">
                    <span class="system-label">Platform</span>
                    <span class="system-value">${data.platform}</span>
                </div>
                
                <div class="system-item">
                    <span class="system-label">Language</span>
                    <span class="system-value">${data.language}</span>
                </div>
                
                <div class="system-item">
                    <span class="system-label">Screen</span>
                    <span class="system-value">${data.screen}</span>
                </div>
                
                ${this.config.showNetwork ? this.renderNetworkInfo(data.network) : ''}
                ${this.config.showMemory ? this.renderMemoryInfo(data.memory) : ''}
                ${this.config.showBattery ? this.renderBatteryInfo(data.battery) : ''}
                
                <div class="system-item">
                    <span class="system-label">Updated</span>
                    <span class="system-value">${new Date().toLocaleTimeString([], {timeStyle: 'short'})}</span>
                </div>
            </div>
        `;
    }

    renderNetworkInfo(network) {
        if (!network) return '';
        
        return `
            <div class="system-item">
                <span class="system-label">Connection</span>
                <div class="system-status">
                    <div class="system-indicator ${network.online ? '' : 'error'}"></div>
                    <span class="system-value">${network.online ? 'Online' : 'Offline'}</span>
                </div>
            </div>
            
            ${network.type ? `
                <div class="system-item">
                    <span class="system-label">Type</span>
                    <span class="system-value">${network.type}</span>
                </div>
            ` : ''}
        `;
    }

    renderMemoryInfo(memory) {
        if (!memory) return '';
        
        const usedPercent = Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100);
        
        return `
            <div class="system-item">
                <span class="system-label">Memory</span>
                <span class="system-value">${this.formatBytes(memory.usedJSHeapSize)} / ${this.formatBytes(memory.jsHeapSizeLimit)}</span>
            </div>
            
            <div class="system-item">
                <span class="system-label">Usage</span>
                <div class="system-status">
                    <div class="system-indicator ${usedPercent > 80 ? 'error' : usedPercent > 60 ? 'warning' : ''}"></div>
                    <span class="system-value">${usedPercent}%</span>
                </div>
            </div>
        `;
    }

    renderBatteryInfo(battery) {
        if (!battery) return '';
        
        const level = Math.round(battery.level * 100);
        const chargingText = battery.charging ? 'Charging' : 'Not charging';
        
        return `
            <div class="system-item">
                <span class="system-label">Battery</span>
                <div class="system-battery">
                    <div class="system-battery-icon">
                        <div class="system-battery-level ${level < 20 ? 'critical' : level < 50 ? 'warning' : ''}" 
                             style="width: ${level}%"></div>
                    </div>
                    <span class="system-value">${level}%</span>
                </div>
            </div>
            
            <div class="system-item">
                <span class="system-label">Status</span>
                <div class="system-status">
                    <div class="system-indicator ${battery.charging ? '' : level < 20 ? 'error' : 'warning'}"></div>
                    <span class="system-value">${chargingText}</span>
                </div>
            </div>
        `;
    }

    async init() {
        await this.updateSystemInfo();
        this.startRefreshTimer();
        this.setupEventListeners();
        console.log('System widget initialized');
    }

    setupEventListeners() {
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Handle refresh
        this.element.addEventListener('refresh', () => {
            this.updateSystemInfo();
        });
        
        // Handle configuration updates
        this.element.addEventListener('configUpdate', (e) => {
            this.updateConfig(e.detail);
        });
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
            if (this.isVisible) {
                this.updateSystemInfo();
            }
        });
        
        window.addEventListener('offline', () => {
            if (this.isVisible) {
                this.updateSystemInfo();
            }
        });
    }

    startRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        const intervalMs = this.config.refreshInterval * 1000;
        this.refreshTimer = setInterval(() => {
            if (this.isVisible) {
                this.updateSystemInfo();
            }
        }, intervalMs);
    }

    stopRefreshTimer() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }

    async updateSystemInfo() {
        const content = this.element.querySelector('#system-content');
        
        try {
            const systemData = await this.getSystemData();
            content.innerHTML = this.renderSystemInfo(systemData);
        } catch (error) {
            console.error('Failed to get system information:', error);
            content.innerHTML = this.renderError('Failed to load system information');
        }
    }

    async getSystemData() {
        const data = {
            browser: this.getBrowserInfo(),
            platform: navigator.platform || 'Unknown',
            language: navigator.language || 'Unknown',
            screen: `${screen.width}×${screen.height}`,
            network: await this.getNetworkInfo(),
            memory: this.getMemoryInfo(),
            battery: await this.getBatteryInfo()
        };
        
        return data;
    }

    getBrowserInfo() {
        const userAgent = navigator.userAgent;
        
        if (userAgent.includes('Firefox')) {
            return 'Firefox';
        } else if (userAgent.includes('Chrome')) {
            return userAgent.includes('Edg') ? 'Edge' : 'Chrome';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari';
        } else if (userAgent.includes('Opera')) {
            return 'Opera';
        } else {
            return 'Unknown';
        }
    }

    async getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        
        return {
            online: navigator.onLine,
            type: connection?.effectiveType || connection?.type || null,
            downlink: connection?.downlink || null,
            rtt: connection?.rtt || null
        };
    }

    getMemoryInfo() {
        if ('memory' in performance) {
            return {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
            };
        }
        return null;
    }

    async getBatteryInfo() {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            } catch (error) {
                console.warn('Battery API not available:', error);
            }
        }
        return null;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    renderError(message) {
        return `
            <div class="widget-error">
                <svg class="icon icon-lg" aria-hidden="true">
                    <use href="./assets/icons.svg#icon-monitor"></use>
                </svg>
                <p>System information unavailable</p>
                <small>${message}</small>
                <button class="btn btn-sm widget-error-retry" onclick="this.closest('.system-widget-container').dispatchEvent(new CustomEvent('refresh'))">
                    Retry
                </button>
            </div>
        `;
    }

    handleVisibilityChange() {
        this.isVisible = !document.hidden;
        
        if (this.isVisible) {
            this.updateSystemInfo();
            this.startRefreshTimer();
        } else {
            this.stopRefreshTimer();
        }
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        
        // Update title
        const titleElement = this.element.querySelector('.widget-title');
        if (titleElement) {
            titleElement.textContent = this.config.title;
        }
        
        // If refresh interval changed, restart timer
        if ('refreshInterval' in newConfig) {
            this.startRefreshTimer();
        }
        
        // Refresh to apply new display options
        this.updateSystemInfo();
    }

    getSettingsForm(config) {
        return `
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="system-show-battery" name="showBattery" 
                           ${config.showBattery ? 'checked' : ''} class="form-checkbox">
                    Show Battery Information
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="system-show-network" name="showNetwork" 
                           ${config.showNetwork ? 'checked' : ''} class="form-checkbox">
                    Show Network Information
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="system-show-memory" name="showMemory" 
                           ${config.showMemory ? 'checked' : ''} class="form-checkbox">
                    Show Memory Information
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label" for="system-refresh-interval">Refresh Interval</label>
                <select id="system-refresh-interval" name="refreshInterval" class="form-select">
                    <option value="2" ${config.refreshInterval === 2 ? 'selected' : ''}>2 seconds</option>
                    <option value="5" ${config.refreshInterval === 5 ? 'selected' : ''}>5 seconds</option>
                    <option value="10" ${config.refreshInterval === 10 ? 'selected' : ''}>10 seconds</option>
                    <option value="30" ${config.refreshInterval === 30 ? 'selected' : ''}>30 seconds</option>
                    <option value="60" ${config.refreshInterval === 60 ? 'selected' : ''}>1 minute</option>
                </select>
            </div>
        `;
    }

    pause() {
        this.isVisible = false;
        this.stopRefreshTimer();
    }

    resume() {
        this.isVisible = true;
        this.startRefreshTimer();
    }

    refresh() {
        this.updateSystemInfo();
    }

    destroy() {
        this.stopRefreshTimer();
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        if (this.element) {
            this.element.remove();
        }
    }

    getConfig() {
        return { ...this.config };
    }
}