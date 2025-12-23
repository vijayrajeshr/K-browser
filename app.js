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
const homeBtn = document.getElementById('homeBtn');
const noteBtn = document.getElementById('noteBtn');
const noteModal = document.getElementById('noteModal');
const noteCloseBtn = document.getElementById('noteCloseBtn');
const noteTextarea = document.getElementById('noteTextarea');
const googleSearchBtn = document.getElementById('googleSearchBtn');

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

// Simplified: No proxy for now - focus on UI
// Sites that work in iframes will work, others will show helpful message

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
  // Configure iframe for maximum compatibility with proxied content
  // Using minimal sandbox to allow proxied sites to work
  iframe.sandbox = 'allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-popups-to-escape-sandbox';
  iframe.setAttribute('allow', 'fullscreen');
  iframe.setAttribute('allowfullscreen', 'true');
  iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
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
    
    // Check if iframe actually loaded content
    setTimeout(() => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        
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
        // This is okay - page may still be visible, just can't access it
      }
      
      // If we get here, try to get URL info
      try {
        const url = new URL(iframe.src);
        // Try to access iframe window (less restricted)
        try {
          const iframeWindow = iframe.contentWindow;
          if (iframeWindow) {
            // Can access window - page likely loaded
            hideError();
            browserState.updateTabTitle(tab.id, url.hostname);
            updateTabBar();
            return;
          }
        } catch (e) {
          // Cannot access - might be blocked
        }
        
        // If we can't access anything, assume it loaded but is blocked
        // Don't show error immediately - let user see if content appears
        hideError();
        browserState.updateTabTitle(tab.id, url.hostname);
        updateTabBar();
      } catch (e2) {
        // Invalid URL or other error
        hideError();
      }
    }, 300);
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
  
  // Simple direct loading - no proxy complexity
  try {
    tab.iframe.src = sanitizedUrl;
  } catch (e) {
    hideLoading();
    showError('Unable to load this URL: ' + e.message, sanitizedUrl);
  }
}

function goBack() {
  const tab = browserState.getActiveTab();
  if (!tab) return;
  
  if (browserState.canGoBack(tab.id)) {
    const url = browserState.goBack(tab.id);
    if (url && tab.iframe) {
      showLoading();
      tab.iframe.src = url;
      browserState.updateTabUrl(tab.id, url);
      addressBar.value = url;
      updateNavButtons();
    }
  } else if (tab.iframe) {
    // Try iframe's native history
    try {
      tab.iframe.contentWindow.history.back();
      // Update address bar after a delay
      setTimeout(() => {
        if (tab.iframe && tab.iframe.contentWindow) {
          try {
            const iframeUrl = tab.iframe.contentWindow.location.href;
            addressBar.value = iframeUrl;
            browserState.updateTabUrl(tab.id, iframeUrl);
          } catch (e) {
            // CORS - can't access
          }
        }
      }, 100);
    } catch (e) {
      // CORS error
    }
  }
}

function goForward() {
  const tab = browserState.getActiveTab();
  if (!tab) return;
  
  if (browserState.canGoForward(tab.id)) {
    const url = browserState.goForward(tab.id);
    if (url && tab.iframe) {
      showLoading();
      tab.iframe.src = url;
      browserState.updateTabUrl(tab.id, url);
      addressBar.value = url;
      updateNavButtons();
    }
  } else if (tab.iframe) {
    // Try iframe's native history
    try {
      tab.iframe.contentWindow.history.forward();
      // Update address bar after a delay
      setTimeout(() => {
        if (tab.iframe && tab.iframe.contentWindow) {
          try {
            const iframeUrl = tab.iframe.contentWindow.location.href;
            addressBar.value = iframeUrl;
            browserState.updateTabUrl(tab.id, iframeUrl);
          } catch (e) {
            // CORS - can't access
          }
        }
      }, 100);
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

// Reading Mode Functions - Fixed for CORS
function extractArticleContent() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) {
    return null;
  }
  
  try {
    // Try to access iframe document
    const iframe = tab.iframe;
    let iframeDoc;
    
    try {
      iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    } catch (e) {
      // CORS error - try alternative method
      return {
        title: 'Content Unavailable',
        byline: '',
        content: '<p>This page cannot be displayed in reading mode because it blocks cross-origin access. This is a security feature of the website.</p><p>Try navigating to a page that allows iframe embedding, or use the "Open in New Window" option.</p>',
        textContent: 'Content unavailable due to security restrictions.'
      };
    }
    
    if (!iframeDoc || !iframeDoc.body) {
      return null;
    }
    
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
      article = iframeDoc.querySelector('.content, #content, .post, .entry, .article, .post-content');
    }
    
    // Last resort: use body but filter better
    if (!article) {
      article = iframeDoc.body;
    }
    
    if (!article) {
      return null;
    }
    
    // Clone the article to avoid modifying original
    const clone = article.cloneNode(true);
    
    // Remove unwanted elements more aggressively
    const unwantedSelectors = [
      'script', 'style', 'nav', 'header', 'footer', 
      '.ad', '.advertisement', '.ads', '[class*="ad-"]', '[id*="ad-"]',
      '.sidebar', '.social', '.share', '.comments', '.comment',
      '.menu', '.navigation', 'iframe', 'noscript', '.cookie',
      '.newsletter', '.subscribe', '.related', '.recommended',
      'aside', '[role="complementary"]', '.widget', '.sidebar-widget'
    ];
    
    unwantedSelectors.forEach(selector => {
      try {
        clone.querySelectorAll(selector).forEach(el => el.remove());
      } catch (e) {
        // Ignore errors
      }
    });
    
    // Extract title
    let title = iframeDoc.title || '';
    const titleEl = iframeDoc.querySelector('h1, .title, .post-title, .entry-title, article h1');
    if (titleEl) {
      title = titleEl.textContent.trim();
    }
    
    // Extract byline/author
    let byline = '';
    const bylineEl = iframeDoc.querySelector('.byline, .author, [rel="author"], .meta-author, .post-author');
    if (bylineEl) {
      byline = bylineEl.textContent.trim();
    }
    
    // Get text content for reading time calculation
    const textContent = clone.textContent || '';
    
    // Clean up HTML - remove empty elements
    clone.querySelectorAll('*').forEach(el => {
      if (el.children.length === 0 && el.textContent.trim() === '') {
        el.remove();
      }
    });
    
    return {
      title: title || 'Untitled Article',
      byline: byline,
      content: clone.innerHTML,
      textContent: textContent
    };
  } catch (e) {
    // CORS error or other issue
    console.error('Cannot extract content:', e);
    return {
      title: 'Content Unavailable',
      byline: '',
      content: '<p>This page cannot be displayed in reading mode because it blocks cross-origin access. This is a security feature of the website.</p><p>Try navigating to a page that allows iframe embedding, or use the "Open in New Window" option.</p>',
      textContent: 'Content unavailable due to security restrictions.'
    };
  }
}

function enterReadingMode() {
  const tab = browserState.getActiveTab();
  if (!tab || !tab.iframe) {
    alert('No page loaded. Please navigate to a page first.');
    return;
  }
  
  const article = extractArticleContent();
  
  if (!article) {
    alert('Unable to extract article content from this page. The page may block cross-origin access.');
    return;
  }
  
  displayArticle(article);
  readingModePanel.classList.add('active');
}

function displayArticle(article) {
  if (!articleTitle || !articleMeta || !articleBody) return;
  
  articleTitle.textContent = article.title || 'Untitled';
  
  const wordCount = article.textContent ? article.textContent.split(/\s+/).filter(w => w.length > 0).length : 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  
  let metaText = '';
  if (article.byline) {
    metaText += `${article.byline} • `;
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
  const currentSpacing = articleBody.dataset.currentSpacing || '1.6';
  setLineSpacing(parseFloat(currentSpacing));
  
  // Update active button states
  document.querySelectorAll('.spacing-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.spacing) === parseFloat(currentSpacing));
  });
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
  if (!articleBody) return;
  
  articleBody.style.fontSize = `${size}px`;
  
  document.querySelectorAll('.text-size-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.size) === size);
  });
  
  // Store current size for persistence
  articleBody.dataset.currentSize = size;
}

function setLineSpacing(spacing) {
  if (!articleBody) return;
  
  articleBody.style.lineHeight = `${spacing}`;
  
  document.querySelectorAll('.spacing-btn').forEach(btn => {
    btn.classList.toggle('active', parseFloat(btn.dataset.spacing) === spacing);
  });
  
  // Store current spacing for persistence
  articleBody.dataset.currentSpacing = spacing;
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

// Home Button Functionality
function goHome() {
  const tab = browserState.getActiveTab();
  if (tab && tab.iframe) {
    tab.iframe.style.display = 'none';
  }
  showWelcomeScreen();
  addressBar.value = '';
}

// Note Modal Functionality
function openNoteModal() {
  // Load note from sessionStorage if exists
  const savedNote = sessionStorage.getItem('browserNote');
  if (savedNote && noteTextarea) {
    noteTextarea.value = savedNote;
  }
  noteModal.classList.add('active');
  if (noteTextarea) {
    noteTextarea.focus();
  }
}

function closeNoteModal() {
  noteModal.classList.remove('active');
  // Save note to sessionStorage (temporary)
  if (noteTextarea) {
    sessionStorage.setItem('browserNote', noteTextarea.value);
  }
}

function handleGoogleSearch() {
  const query = prompt('Enter your search query:');
  if (query && query.trim()) {
    navigateToUrl('https://www.google.com/search?q=' + encodeURIComponent(query));
  }
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
  
  // Home button
  if (homeBtn) {
    homeBtn.addEventListener('click', goHome);
  }
  
  // Note button
  if (noteBtn) {
    noteBtn.addEventListener('click', openNoteModal);
  }
  
  // Note close button
  if (noteCloseBtn) {
    noteCloseBtn.addEventListener('click', closeNoteModal);
  }
  
  // Close note modal on outside click
  if (noteModal) {
    noteModal.addEventListener('click', (e) => {
      if (e.target === noteModal) {
        closeNoteModal();
      }
    });
  }
  
  // Google search button
  if (googleSearchBtn) {
    googleSearchBtn.addEventListener('click', handleGoogleSearch);
  }
  
  // Home links
  const homeLinks = document.querySelectorAll('.home-link[data-url]');
  homeLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const url = link.dataset.url;
      if (url) {
        navigateToUrl(url);
      }
    });
  });
  
  // GitHub link (opens in new window)
  const githubLink = document.getElementById('githubLink');
  if (githubLink) {
    githubLink.addEventListener('click', (e) => {
      // GitHub link opens in new tab/window
      // Don't prevent default - let it open normally
    });
  }
  
  // Save note on input (auto-save)
  if (noteTextarea) {
    noteTextarea.addEventListener('input', () => {
      sessionStorage.setItem('browserNote', noteTextarea.value);
    });
  }
}

// Start the browser when page loads
window.addEventListener('DOMContentLoaded', initBrowser);
