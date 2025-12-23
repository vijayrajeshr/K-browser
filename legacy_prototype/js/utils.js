/**
 * K-Browser - Utility Functions
 * Helper functions for URL handling, loading states, etc.
 */

/**
 * Check if a string is a valid URL
 */
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

/**
 * Sanitize and format URL input
 */
function sanitizeUrl(input) {
    input = input.trim();

    if (!input) {
        return 'https://www.google.com';
    }

    if (input === 'demo:article') {
        return 'demo:article';
    }

    if (input.startsWith('http://') || input.startsWith('https://')) {
        return input;
    }

    if (isValidUrl(input)) {
        return 'https://' + input;
    }

    return 'https://www.google.com/search?q=' + encodeURIComponent(input);
}

/**
 * Loading indicator helpers
 */
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const addressBar = document.getElementById('addressBar');
    if (loadingIndicator) loadingIndicator.classList.add('active');
    if (addressBar) addressBar.classList.add('loading');
}

function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const addressBar = document.getElementById('addressBar');
    if (loadingIndicator) loadingIndicator.classList.remove('active');
    if (addressBar) addressBar.classList.remove('loading');
}

/**
 * Welcome screen visibility
 */
function showWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const iframeContainer = document.getElementById('iframeContainer');
    const errorMessage = document.getElementById('errorMessage');

    if (welcomeScreen) welcomeScreen.style.display = 'flex';
    if (iframeContainer) iframeContainer.style.display = 'none';
    if (errorMessage) errorMessage.style.display = 'none';
}

function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    const iframeContainer = document.getElementById('iframeContainer');

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (iframeContainer) iframeContainer.style.display = 'block';
}

/**
 * Error display helpers
 */
function showError(message, url = null) {
    const errorMessage = document.getElementById('errorMessage');
    const iframeContainer = document.getElementById('iframeContainer');
    const welcomeScreen = document.getElementById('welcomeScreen');
    const errorText = document.getElementById('errorText');

    if (errorMessage) {
        errorMessage.style.display = 'flex';
        if (url) errorMessage.dataset.url = url;
    }
    if (errorText) {
        errorText.textContent = message || 'This website blocks embedding in iframes for security reasons.';
    }
    if (iframeContainer) iframeContainer.style.display = 'none';
    if (welcomeScreen) welcomeScreen.style.display = 'none';
}

function hideError() {
    const errorMessage = document.getElementById('errorMessage');
    if (errorMessage) errorMessage.style.display = 'none';
}

// Export for use in other modules
window.Utils = {
    isValidUrl,
    sanitizeUrl,
    showLoading,
    hideLoading,
    showWelcomeScreen,
    hideWelcomeScreen,
    showError,
    hideError
};
