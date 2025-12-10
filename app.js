// Browser State Management
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
      url: url || 'about:blank',
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
      // Remove iframe if it exists
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
      // Remove forward history when navigating to new page
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

// Initialize browser state
const browserState = new BrowserState();

// DOM Elements
const tabBar = document.getElementById('tabBar');
const viewport = document.getElementById('viewport');
const welcomeScreen = document.getElementById('welcomeScreen');
const iframeContainer = document.getElementById('iframeContainer');
const webView = document.getElementById('webView');
const errorMessage = document.getElementById('errorMessage');
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

// Utility Functions
function isValidUrl(string) {
  try {
    if (string.startsWith('http://') || string.startsWith('https://')) {
      new URL(string);
      return true;
    }
    if (string.includes('.') && !string.includes(' ') && !/\s/.test(string)) {
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
  
  if (input.startsWith('http://') || input.startsWith('https://')) {
    return input;
  }
  
  if (isValidUrl(input)) {
    return 'https://' + input;
  }
  
  return 'https://www.google.com/search?q=' + encodeURIComponent(input);
}

function showLoading() {
  loadingIndicator.classList.add('active');
  addressBar.classList.add('loading');
}

function hideLoading() {
  loadingIndicator.classList.remove('active');
  addressBar.classList.remove('loading');
}

function showWelcomeScreen() {
  welcomeScreen.style.display = 'flex';
  iframeContainer.style.display = 'none';
  errorMessage.style.display = 'none';
}

function hideWelcomeScreen() {
  welcomeScreen.style.display = 'none';
  iframeContainer.style.display = 'block';
}

function showError(message, url = null) {
  errorMessage.style.display = 'flex';
  const errorText = errorMessage.querySelector('#errorText');
  if (errorText) {
    errorText.textContent = message || 'This website blocks embedding in iframes for security reasons.';
  }
  iframeContainer.style.display = 'none';
  welcomeScreen.style.display = 'none';
  
  // Store URL for opening in new window
  if (url) {
    errorMessage.dataset.url = url;
  }
}

function hideError() {
  errorMessage.style.display = 'none';
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

function createTabIframe(tab) {
  const iframe = document.createElement('iframe');
  iframe.id = `iframe-${tab.id}`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  // Note: Some sites block iframe embedding via X-Frame-Options or CSP
  // This is a security feature and cannot be bypassed in a web browser
  iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox';
  iframe.style.display = 'none';
  
  let loadTimeout = null;
  let hasLoaded = false;
  
  // Handle iframe load events
  iframe.addEventListener('load', () => {
    hasLoaded = true;
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    
    hideLoading();
    
    // Check if iframe actually loaded content or was blocked
    // Use a message-based approach to detect if iframe is accessible
    setTimeout(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const iframeWindow = iframe.contentWindow;
        
        // Check if we can access the document
        if (iframeDoc && iframeDoc.body) {
          // Successfully loaded and accessible
          hideError();
          
          // Try to get title from iframe
          const title = iframeDoc.title || new URL(iframe.src).hostname;
          browserState.updateTabTitle(tab.id, title);
          updateTabBar();
          return;
        }
      } catch (e) {
        // CORS error - can't access iframe content
        // This could mean:
        // 1. Site loaded but blocks cross-origin access (still works visually)
        // 2. Site blocked iframe embedding (X-Frame-Options)
        // We'll assume it's working if no error is thrown by the browser
      }
      
      // If we get here, check if iframe src is set and try to determine status
      try {
        const url = new URL(iframe.src);
        
        // Try to access iframe window properties (less restricted)
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow && iframeWindow.location) {
            // Can access window - likely loaded but CORS blocks document access
            // This is fine, the page should still display
            hideError();
            browserState.updateTabTitle(tab.id, url.hostname);
            updateTabBar();
            return;
          }
        } catch (e) {
          // Cannot access window - likely blocked by X-Frame-Options
        }
        
        // Final check: wait a bit and see if error persists
        setTimeout(() => {
          // If error is still showing, the site is likely blocked
          if (errorMessage.style.display === 'flex') {
            // Don't change error if it's already showing
            return;
          }
          
          // Try one more time to access
          try {
            const iframeDoc = iframe.contentDocument;
            if (!iframeDoc || !iframeDoc.body) {
              showError(`This website (${url.hostname}) blocks embedding in iframes for security reasons. Click "Open in New Window" to view it.`, iframe.src);
            }
          } catch (e2) {
            // Site is blocked - show error with helpful message
            showError(`This website (${url.hostname}) blocks embedding in iframes for security reasons. Click "Open in New Window" to view it.`, iframe.src);
          }
        }, 2000);
      } catch (e2) {
        showError('Failed to load this page. The website may block embedding in iframes.', iframe.src);
      }
    }, 500);
  });
  
  // Handle iframe errors
  iframe.addEventListener('error', () => {
    hasLoaded = true;
    if (loadTimeout) {
      clearTimeout(loadTimeout);
      loadTimeout = null;
    }
    hideLoading();
    showError('Failed to load this page. Please check your internet connection or try again.', iframe.src);
  });
  
  // Timeout to detect if iframe never loads
  const startLoadTimeout = (url) => {
    if (loadTimeout) clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      if (!hasLoaded) {
        hideLoading();
        try {
          const urlObj = new URL(url);
          showError(`This website (${urlObj.hostname}) is taking too long to load or blocks iframe embedding.`, url);
        } catch (e) {
          showError('This page is taking too long to load or blocks iframe embedding.', url);
        }
      }
    }, 10000); // 10 second timeout
  };
  
  // Store timeout function for use in navigateToUrl
  iframe._startLoadTimeout = startLoadTimeout;
  
  iframeContainer.appendChild(iframe);
  tab.iframe = iframe;
  return iframe;
}

function addTab(url) {
  const sanitizedUrl = url ? sanitizeUrl(url) : '';
  const tab = browserState.addTab(sanitizedUrl);
  if (!tab) return;
  
  const tabElement = createTabElement(tab);
  
  const addButton = tabBar.querySelector('.tab-add');
  if (addButton) {
    tabBar.insertBefore(tabElement, addButton);
  } else {
    tabBar.appendChild(tabElement);
  }
  
  browserState.activeTabId = tab.id;
  switchTab(tab.id);
  
  if (sanitizedUrl && sanitizedUrl !== 'about:blank') {
    navigateToUrl(sanitizedUrl);
  }
}

function closeTab(tabId) {
  if (browserState.tabs.length === 1) {
    return; // Don't close the last tab
  }
  
  browserState.removeTab(tabId);
  
  const tabElement = tabBar.querySelector(`[data-tab-id="${tabId}"]`);
  if (tabElement) {
    tabElement.remove();
  }
  
  if (browserState.activeTabId) {
    switchTab(browserState.activeTabId);
  } else if (browserState.tabs.length > 0) {
    switchTab(browserState.tabs[0].id);
  } else {
    showWelcomeScreen();
  }
}

function switchTab(tabId) {
  browserState.activeTabId = tabId;
  
  // Hide all iframes
  document.querySelectorAll('iframe').forEach(iframe => {
    iframe.style.display = 'none';
  });
  
  // Update tab bar
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tabId === tabId);
  });
  
  const tab = browserState.getActiveTab();
  if (tab) {
    addressBar.value = tab.url || '';
    
    // Show tab's iframe or create one
    if (tab.iframe) {
      tab.iframe.style.display = 'block';
      hideWelcomeScreen();
    } else if (tab.url && tab.url !== 'about:blank') {
      // Create iframe for this tab
      createTabIframe(tab);
      tab.iframe.src = tab.url;
      tab.iframe.style.display = 'block';
      hideWelcomeScreen();
    } else {
      showWelcomeScreen();
    }
    
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
  const tab = browserState.getActiveTab();
  if (tab) {
    backBtn.disabled = !browserState.canGoBack(tab.id);
    forwardBtn.disabled = !browserState.canGoForward(tab.id);
  } else {
    backBtn.disabled = true;
    forwardBtn.disabled = true;
  }
}

// Navigation Functions
function navigateToUrl(url) {
  const tab = browserState.getActiveTab();
  if (!tab) return;
  
  const sanitizedUrl = sanitizeUrl(url);
  
  browserState.updateTabUrl(tab.id, sanitizedUrl);
  browserState.addToHistory(tab.id, sanitizedUrl);
  
  try {
    const urlObj = new URL(sanitizedUrl);
    browserState.updateTabTitle(tab.id, urlObj.hostname);
    updateTabBar();
  } catch (e) {
    browserState.updateTabTitle(tab.id, 'Navigating...');
    updateTabBar();
  }
  
  addressBar.value = sanitizedUrl;
  updateNavButtons();
  
  // Create iframe if it doesn't exist
  if (!tab.iframe) {
    createTabIframe(tab);
  }
  
  showLoading();
  hideError();
  hideWelcomeScreen();
  tab.iframe.style.display = 'block';
  
  // Reset load state
  tab.iframe._hasLoaded = false;
  
  // Start timeout
  if (tab.iframe._startLoadTimeout) {
    tab.iframe._startLoadTimeout(sanitizedUrl);
  }
  
  // Load URL in iframe
  try {
    tab.iframe.src = sanitizedUrl;
  } catch (e) {
    hideLoading();
    showError('Unable to load this URL: ' + e.message, sanitizedUrl);
  }
}

function goBack() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) return;
  
  if (browserState.canGoBack(tab.id)) {
    const url = browserState.goBack(tab.id);
    if (url) {
      showLoading();
      tab.iframe.src = url;
      browserState.updateTabUrl(tab.id, url);
      addressBar.value = url;
      updateNavButtons();
    }
  } else {
    // Try iframe's native history
    try {
      tab.iframe.contentWindow.history.back();
    } catch (e) {
      // CORS error
    }
  }
}

function goForward() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) return;
  
  if (browserState.canGoForward(tab.id)) {
    const url = browserState.goForward(tab.id);
    if (url) {
      showLoading();
      tab.iframe.src = url;
      browserState.updateTabUrl(tab.id, url);
      addressBar.value = url;
      updateNavButtons();
    }
  } else {
    // Try iframe's native history
    try {
      tab.iframe.contentWindow.history.forward();
    } catch (e) {
      // CORS error
    }
  }
}

function reload() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) return;
  
  showLoading();
  tab.iframe.src = tab.iframe.src; // Reload iframe
}

// Reading Mode Functions
function extractArticleContent() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) {
    return null;
  }
  
  try {
    const iframeDoc = tab.iframe.contentDocument || tab.iframe.contentWindow.document;
    
    // Try to find article element
    let article = iframeDoc.querySelector('article');
    
    // Fallback to main content areas
    if (!article) {
      article = iframeDoc.querySelector('main');
    }
    if (!article) {
      article = iframeDoc.querySelector('[role="main"]');
    }
    if (!article) {
      article = iframeDoc.querySelector('.content, #content, .post, .entry');
    }
    
    // Last resort: use body
    if (!article) {
      article = iframeDoc.body;
    }
    
    if (!article) {
      return null;
    }
    
    // Clone the article to avoid modifying original
    const clone = article.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.ad', '.advertisement', '.ads', '[class*="ad-"]',
      '.sidebar', '.social', '.share', '.comments',
      '.menu', '.navigation', 'iframe', 'noscript'
    ];
    
    unwantedSelectors.forEach(selector => {
      clone.querySelectorAll(selector).forEach(el => el.remove());
    });
    
    // Extract title
    let title = iframeDoc.title || '';
    const titleEl = iframeDoc.querySelector('h1, .title, .post-title, .entry-title');
    if (titleEl) {
      title = titleEl.textContent.trim();
    }
    
    // Extract byline/author
    let byline = '';
    const bylineEl = iframeDoc.querySelector('.byline, .author, [rel="author"], .meta-author');
    if (bylineEl) {
      byline = bylineEl.textContent.trim();
    }
    
    // Get text content for reading time calculation
    const textContent = clone.textContent || '';
    
    return {
      title: title || 'Untitled Article',
      byline: byline,
      content: clone.innerHTML,
      textContent: textContent
    };
  } catch (e) {
    // CORS error - can't access iframe content
    console.error('Cannot extract content due to CORS:', e);
    return {
      title: 'Content Unavailable',
      byline: '',
      content: '<p>This page cannot be displayed in reading mode because it blocks cross-origin access. This is a security feature of the website.</p>',
      textContent: 'Content unavailable due to security restrictions.'
    };
  }
}

function enterReadingMode() {
  const article = extractArticleContent();
  
  if (!article) {
    alert('Unable to extract article content from this page.');
    return;
  }
  
  displayArticle(article);
  readingModePanel.classList.add('active');
}

function displayArticle(article) {
  articleTitle.textContent = article.title || 'Untitled';
  
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
  
  // Set initial text size if not already set
  const currentSize = articleBody.dataset.currentSize || '18';
  setTextSize(parseInt(currentSize));
  
  // Set initial line spacing
  const currentSpacing = articleBody.dataset.currentSpacing || '1';
  setLineSpacing(parseFloat(currentSpacing));
}

function exitReadingMode() {
  readingModePanel.classList.remove('active');
}

function applyReadingSettings() {
  // Settings are applied via inline styles and classes
  // This function is called after content is loaded
}

function toggleReadingTheme() {
  readingModePanel.classList.toggle('dark');
}

function setTextSize(size) {
  articleBody.style.fontSize = `${size}px`;
  
  document.querySelectorAll('.text-size-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
  });
  
  // Store current size for persistence
  if (articleBody) {
    articleBody.dataset.currentSize = size;
  }
}

function setLineSpacing(spacing) {
  articleBody.style.lineHeight = `${spacing}`;
  
  document.querySelectorAll('.spacing-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.spacing) === spacing);
  });
  
  // Store current spacing for persistence
  if (articleBody) {
    articleBody.dataset.currentSpacing = spacing;
  }
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

// Error message buttons
const openInNewWindowBtn = document.getElementById('openInNewWindowBtn');
const retryBtn = document.getElementById('retryBtn');

if (openInNewWindowBtn) {
  openInNewWindowBtn.addEventListener('click', () => {
    const url = errorMessage.dataset.url || addressBar.value;
    if (url) {
      window.open(url, '_blank');
    }
  });
}

if (retryBtn) {
  retryBtn.addEventListener('click', () => {
    const url = errorMessage.dataset.url || addressBar.value;
    if (url) {
      navigateToUrl(url);
    }
  });
}

// Initialize the browser
function initBrowser() {
  // Create the "Add Tab" button
  const addButton = document.createElement('button');
  addButton.className = 'tab-add';
  addButton.innerHTML = '+';
  addButton.title = 'New Tab';
  addButton.onclick = () => addTab();
  tabBar.appendChild(addButton);
  
  // Create first tab
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
