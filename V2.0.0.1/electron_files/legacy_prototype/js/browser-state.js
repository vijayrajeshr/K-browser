/**
 * K-Browser - Browser State Management
 * Handles tabs, history, and browser state
 */

class BrowserState {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.maxTabs = 3; // MVP limit
    }

    addTab(url = '') {
        if (this.tabs.length >= this.maxTabs) {
            alert(`Maximum ${this.maxTabs} tabs allowed`);
            return null;
        }

        const tabId = `tab-${Date.now()}`;
        const tab = {
            id: tabId,
            title: 'New Tab',
            url: url || '',
            timestamp: Date.now(),
            iframe: null,
            history: [],
            historyIndex: -1
        };
        this.tabs.push(tab);
        return tab;
    }

    removeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index !== -1) {
            const tab = this.tabs[index];
            if (tab.iframe && tab.iframe.parentNode) {
                tab.iframe.parentNode.removeChild(tab.iframe);
            }
            this.tabs.splice(index, 1);
            if (this.activeTabId === tabId) {
                this.activeTabId = this.tabs.length > 0 ? this.tabs[0].id : null;
            }
        }
    }

    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }

    updateTabUrl(tabId, url) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.url = url;
        }
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.title = title || 'Untitled';
        }
    }

    addToHistory(tabId, url) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
            tab.history.push(url);
            tab.historyIndex = tab.history.length - 1;
        }
    }

    canGoBack(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return false;
        return tab.historyIndex > 0;
    }

    canGoForward(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return false;
        return tab.historyIndex < tab.history.length - 1;
    }

    goBack(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab && this.canGoBack(tabId)) {
            tab.historyIndex--;
            return tab.history[tab.historyIndex];
        }
        return null;
    }

    goForward(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (tab && this.canGoForward(tabId)) {
            tab.historyIndex++;
            return tab.history[tab.historyIndex];
        }
        return null;
    }
}

// Export for use in other modules
window.BrowserState = BrowserState;
