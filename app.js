// Browser State Management
class BrowserState {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.history = [];
    this.historyIndex = -1;
    this.currentUrl = '';
  }

  addTab(url = '') {
    const tabId = `tab-${Date.now()}`;
    const tab = {
      id: tabId,
      title: 'New Tab',
      url: url || 'about:blank',
      timestamp: Date.now()
    };
    this.tabs.push(tab);
    return tab;
  }

  removeTab(tabId) {
    const index = this.tabs.findIndex(t => t.id === tabId);
    if (index !== -1) {
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
      this.currentUrl = url;
    }
  }

  updateTabTitle(tabId, title) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.title = title || 'Untitled';
    }
  }

  addToHistory(url) {
    // Remove forward history when navigating to new page
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(url);
    this.historyIndex = this.history.length - 1;
    this.currentUrl = url;
  }

  canGoBack() {
    return this.historyIndex > 0;
  }

  canGoForward() {
    return this.historyIndex < this.history.length - 1;
  }

  goBack() {
    if (this.canGoBack()) {
      this.historyIndex--;
      this.currentUrl = this.history[this.historyIndex];
      return this.currentUrl;
    }
    return null;
  }

  goForward() {
    if (this.canGoForward()) {
      this.historyIndex++;
      this.currentUrl = this.history[this.historyIndex];
      return this.currentUrl;
    }
    return null;
  }
}

// Initialize browser state
const browserState = new BrowserState();

// DOM Elements
const tabBar = document.getElementById('tabBar');
const viewport = document.getElementById('viewport');
const addressBar = document.getElementById('addressBar');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const readingModeBtn = document.getElementById('readingModeBtn');
const readingModePanel = document.getElementById('readingModePanel');
const exitReadingBtn = document.getElementById('exitReadingBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const articleTitle = document.getElementById('articleTitle');
const articleMeta = document.getElementById('articleMeta');
const articleBody = document.getElementById('articleBody');

// Track opened windows
let openedWindows = [];

// Utility Functions
function isValidUrl(string) {
  try {
    // Check if it has a protocol
    if (string.startsWith('http://') || string.startsWith('https://')) {
      new URL(string);
      return true;
    }
    // Check if it looks like a domain (has dot and no spaces)
    if (string.includes('.') && !string.includes(' ') && !/\s/.test(string)) {
      // Try to create URL with https prefix
      new URL('https://' + string);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

function sanitizeUrl(input) {
  input = input.trim();
  
  if (!input) {
    return 'https://www.google.com';
  }
  
  // Check if it's already a complete URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  
  // Check if it looks like a domain (e.g., github.com, example.org)
  if (isValidUrl(input)) {
    return 'https://' + input;
  }
  
  // Otherwise, treat as search query using Google
  return 'https://www.google.com/search?q=' + encodeURIComponent(input);
}

function showLoading() {
  loadingIndicator.classList.add('active');
}

function hideLoading() {
  loadingIndicator.classList.remove('active');
}

// Tab Management
function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tab.id;
  
  const titleSpan = document.createElement('span');
  titleSpan.className = 'tab-title';
  titleSpan.textContent = tab.title;
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'tab-close';
  closeBtn.innerHTML = '✕';
  closeBtn.onclick = (e) => {
    e.stopPropagation();
    closeTab(tab.id);
  };
  
  tabElement.appendChild(titleSpan);
  tabElement.appendChild(closeBtn);
  
  tabElement.onclick = () => switchTab(tab.id);
  
  return tabElement;
}

function addTab(url) {
  const sanitizedUrl = url ? sanitizeUrl(url) : '';
  const tab = browserState.addTab(sanitizedUrl);
  const tabElement = createTabElement(tab);
  
  // Add tab button
  const addButton = tabBar.querySelector('.tab-add');
  if (addButton) {
    tabBar.insertBefore(tabElement, addButton);
  } else {
    tabBar.appendChild(tabElement);
  }
  
  // Switch to new tab
  browserState.activeTabId = tab.id;
  switchTab(tab.id);
  
  // If URL provided, navigate to it
  if (sanitizedUrl) {
    navigateToUrl(sanitizedUrl);
  }
}

function closeTab(tabId) {
  if (browserState.tabs.length === 1) {
    // Close all windows and reset
    openedWindows.forEach(w => {
      if (w && !w.closed) w.close();
    });
    openedWindows = [];
    return; // Don't close the last tab
  }
  
  browserState.removeTab(tabId);
  
  // Remove tab element
  const tabElement = tabBar.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.remove();
  }
  
  // Switch to active tab
  if (browserState.activeTabId) {
    switchTab(browserState.activeTabId);
  }
}

function switchTab(tabId) {
  browserState.activeTabId = tabId;
  
  // Update tab bar
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tabId === tabId);
  });
  
  // Update address bar and nav buttons
  const tab = browserState.getActiveTab();
  if (tab) {
    addressBar.value = tab.url || '';
    updateNavButtons();
  }
}

function updateTabBar() {
  document.querySelectorAll('.tab').forEach(tabElement => {
    const tabId = tabElement.dataset.tabId;
    const tab = browserState.tabs.find(t => t.id === tabId);
    if (tab) {
      const titleSpan = tabElement.querySelector('.tab-title');
      titleSpan.textContent = tab.title;
    }
  });
}

function updateNavButtons() {
  backBtn.disabled = !browserState.canGoBack();
  forwardBtn.disabled = !browserState.canGoForward();
}

// Navigation Functions
function navigateToUrl(url) {
  const tab = browserState.getActiveTab();
  if (!tab) return;
  
  const sanitizedUrl = sanitizeUrl(url);
  
  // Update tab info
  browserState.updateTabUrl(tab.id, sanitizedUrl);
  browserState.addToHistory(sanitizedUrl);
  
  // Update tab title to show domain
  try {
    const urlObj = new URL(sanitizedUrl);
    browserState.updateTabTitle(tab.id, urlObj.hostname);
    updateTabBar();
  } catch (e) {
    browserState.updateTabTitle(tab.id, 'Navigating...');
    updateTabBar();
  }
  
  // Update address bar
  addressBar.value = sanitizedUrl;
  updateNavButtons();
  
  // Open in same window (this navigates the current page)
  window.location.href = sanitizedUrl;
}

function goBack() {
  // Use browser's native back button
  if (browserState.canGoBack()) {
    window.history.back();
    const url = browserState.goBack();
    if (url) {
      addressBar.value = url;
      updateNavButtons();
    }
  }
}

function goForward() {
  // Use browser's native forward button
  if (browserState.canGoForward()) {
    window.history.forward();
    const url = browserState.goForward();
    if (url) {
      addressBar.value = url;
      updateNavButtons();
    }
  }
}

function reload() {
  // Use browser's native reload
  window.location.reload();
}

// Reading Mode Functions
function enterReadingMode() {
  // Simple reading mode - just extract current page content
  try {
    const pageTitle = document.title || 'Reading Mode';
    const pageContent = document.body.innerHTML;
    
    displayArticle({
      title: pageTitle,
      content: '<p>Reading mode simplifies web pages for easier reading.</p><p>In a production browser, this would extract and clean the article content from the current page.</p>',
      byline: 'Browser UI',
      textContent: 'Reading mode simplifies web pages for easier reading.'
    });
    
    readingModePanel.classList.add('active');
  } catch (e) {
    alert('Could not enter reading mode: ' + e.message);
  }
}

function displayArticle(article) {
  articleTitle.textContent = article.title || 'Untitled';
  
  // Calculate reading time (average 200 words per minute)
  const wordCount = article.textContent ? article.textContent.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);
  
  let metaText = '';
  if (article.byline) {
    metaText += `By ${article.byline} • `;
  }
  metaText += `${readingTime} min read`;
  
  articleMeta.textContent = metaText;
  articleBody.innerHTML = article.content || '';
  
  // Apply current reading mode settings
  applyReadingSettings();
}

function exitReadingMode() {
  readingModePanel.classList.remove('active');
}

function applyReadingSettings() {
  // Reading settings are applied via CSS classes and inline styles
}

function toggleReadingTheme() {
  readingModePanel.classList.toggle('dark');
}

function setTextSize(size) {
  articleBody.style.fontSize = `${size}px`;
  
  // Update button states
  document.querySelectorAll('.text-size-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
  });
}

function setLineSpacing(spacing) {
  articleBody.style.lineHeight = `${spacing}`;
  
  // Update button states
  document.querySelectorAll('.spacing-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.spacing) === spacing);
  });
}

// Event Listeners
addressBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    navigateToUrl(addressBar.value);
  }
});

backBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);
reloadBtn.addEventListener('click', reload);
readingModeBtn.addEventListener('click', enterReadingMode);
exitReadingBtn.addEventListener('click', exitReadingMode);
themeToggleBtn.addEventListener('click', toggleReadingTheme);

// Text size buttons
document.querySelectorAll('.text-size-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setTextSize(parseInt(btn.dataset.size));
  });
});

// Line spacing buttons
document.querySelectorAll('.spacing-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    setLineSpacing(parseFloat(btn.dataset.spacing));
  });
});



// Initialize the browser
function initBrowser() {
  // Create the "Add Tab" button
  const addButton = document.createElement('button');
  addButton.className = 'tab-add';
  addButton.innerHTML = '+';
  addButton.title = 'New Tab';
  addButton.onclick = () => addTab();
  tabBar.appendChild(addButton);
  
  // Create first tab (about:blank)
  addTab('');
  
  // Quick links
  const quickLinks = document.querySelectorAll('.quick-link');
  quickLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      navigateToUrl(btn.dataset.url);
    });
  });
}

// Start the browser when page loads
window.addEventListener('DOMContentLoaded', initBrowser);