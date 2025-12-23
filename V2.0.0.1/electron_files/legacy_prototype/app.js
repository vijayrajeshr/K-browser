// Browser State Management - Imported from js/browser-state.js

// Initialize browser state
const browserState = new BrowserState();

// Demo Article Content for Testing Reading Mode
const DEMO_ARTICLE_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>The Future of browser interfaces</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background-color: #ffffff; /* Force light background */
        }
        img { max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; color: #111; }
        .meta { color: #666; font-size: 0.9em; margin-bottom: 2em; border-bottom: 1px solid #eee; padding-bottom: 1em; }
        p { margin-bottom: 1.5em; font-size: 1.1em; }
        blockquote { border-left: 4px solid #6366f1; padding-left: 20px; font-style: italic; color: #555; margin: 2em 0; }
    </style>
</head>
<body>
    <article>
        <header>
            <h1>The Future of Browser Interfaces: Beyond the Address Bar</h1>
            <div class="meta">By <span class="author">Alex Chen</span> • Published on <time>October 15, 2024</time></div>
        </header>

        <img src="https://images.unsplash.com/photo-1481487484168-9b995ecc1679?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80" alt="Futuristic interface concept">

        <p>In the ever-evolving landscape of digital interaction, the web browser remains our primary window to the internet. However, the fundamental design of browsers has remained surprisingly static for nearly two decades. We still rely on tabs, address bars, and back buttons—paradigms established in the late 90s.</p>

        <p>But a new wave of interface design, dubbed "SaltUI", is challenging these conventions. By prioritizing content over chrome and fluidity over rigidity, we are entering a new era of "invisible browsing".</p>

        <h2>The Rise of Contextual Computing</h2>

        <p>Imagine a browser that understands what you're doing. When you're reading a long-form article, the interface should melt away, leaving only the text. This isn't just a "full-screen" mode; it's a fundamental shift in how the browser renders the page.</p>

        <blockquote>
            "The best interface is no interface. content should be the only thing that matters."
        </blockquote>

        <p>This philosophy drives the new "Reading Mode" features we see emerging. It's not just about stripping away ads; it's about reformatting the web for human consumption rather than machine delivery. Typography, spacing, and contrast become dynamic variables controlled by the user, not the publisher.</p>

        <h2>Ambient Intelligence</h2>

        <p>Future browsers will likely incorporate local LLMs (Large Language Models) to summarize content, suggest related reading, and even restructure complex documentation into simplified formats automatically. This "active reading" assistance will transform passive consumption into an interactive dialogue with the text.</p>
        
        <p>As we move forward, the defined line between the "browser" and the "web page" will blur. The browser will no longer be just a frame; it will be the lens through which we interpret the digital world.</p>
    </article>
</body>
</html>
`;

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

// Utility Functions - Imported from js/utils.js

// Tab Management
function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.dataset.tabId = tab.id;

  // Assign random color for Vivaldi-style tab accents
  const colors = [
    'var(--color-tab-red)',
    'var(--color-tab-green)',
    'var(--color-tab-blue)',
    'var(--color-tab-yellow)',
    'var(--color-tab-purple)',
    'var(--color-tab-orange)'
  ];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  tabElement.style.setProperty('--tab-color', randomColor);

  // Favicon (Simulated)
  const favicon = document.createElement('img');
  favicon.className = 'tab-icon';
  // Default to globe icon, can be updated later based on URL
  favicon.src = 'https://www.google.com/s2/favicons?domain=google.com';

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

  tabElement.appendChild(favicon); // Add favicon
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
  } else {
    // Ensure address bar is clear for new tabs
    addressBar.value = '';
    addressBar.focus();
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
    // displayed url should be empty if it is about:blank
    const displayUrl = (tab.url === 'about:blank') ? '' : tab.url;
    addressBar.value = displayUrl || '';

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

  const displayUrl = (sanitizedUrl === 'about:blank') ? '' : sanitizedUrl;
  addressBar.value = displayUrl;
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
  if (tab.iframe._startLoadTimeout && !sanitizedUrl.startsWith('demo:')) {
    tab.iframe._startLoadTimeout(sanitizedUrl);
  }

  // Handle demo content or standard URL
  try {
    if (sanitizedUrl === 'demo:article') {
      // Load demo content via srcdoc (bypassing network/CORS)
      tab.iframe.removeAttribute('src');
      tab.iframe.srcdoc = DEMO_ARTICLE_HTML;

      // Simulate loading time for effect
      setTimeout(() => {
        hideLoading();
        hideError();
        browserState.updateTabTitle(tab.id, 'Demo Article');
        updateTabBar();
      }, 500);
    } else {
      // Standard URL load
      tab.iframe.removeAttribute('srcdoc');
      tab.iframe.src = sanitizedUrl;
    }
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

  // Google search bar on welcome screen
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          navigateToUrl(query);
          searchInput.value = '';
        }
      }
    });
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

// ============= Animated Starfield Background =============
class Starfield {
  constructor() {
    this.canvas = document.getElementById('starfield');
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.stars = [];
    this.numStars = 150;

    this.resize();
    this.createStars();
    this.animate();

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createStars() {
    this.stars = [];
    for (let i = 0; i < this.numStars; i++) {
      this.stars.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        alpha: Math.random(),
        alphaSpeed: (Math.random() * 0.02 + 0.005) * (Math.random() < 0.5 ? 1 : -1),
        color: this.getStarColor()
      });
    }
  }

  getStarColor() {
    const colors = [
      'rgba(99, 102, 241, ALPHA)',   // Primary indigo
      'rgba(236, 72, 153, ALPHA)',   // Secondary pink
      'rgba(139, 92, 246, ALPHA)',   // Accent violet
      'rgba(6, 182, 212, ALPHA)',    // Cyan
      'rgba(255, 255, 255, ALPHA)'   // White
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let star of this.stars) {
      // Update alpha for twinkling
      star.alpha += star.alphaSpeed;
      if (star.alpha <= 0.1 || star.alpha >= 1) {
        star.alphaSpeed *= -1;
      }
      star.alpha = Math.max(0.1, Math.min(1, star.alpha));

      // Draw star with glow
      const color = star.color.replace('ALPHA', star.alpha.toFixed(2));
      const glowColor = star.color.replace('ALPHA', (star.alpha * 0.3).toFixed(2));

      // Glow effect
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
      this.ctx.fillStyle = glowColor;
      this.ctx.fill();

      // Star core
      this.ctx.beginPath();
      this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }

    requestAnimationFrame(() => this.animate());
  }
}

// Initialize starfield when page loads
window.addEventListener('DOMContentLoaded', () => {
  new Starfield();
});
