/**
 * WebView JavaScript injection utilities
 * Handles DOM manipulation scripts for WebView content
 */

/**
 * Generates a script to handle target="_blank" links
 * Prevents links from trying to open new windows (which fail in WebView)
 *
 * Performance characteristics:
 * - Event-driven (only fires on user clicks)
 * - Uses event delegation (single listener)
 * - Minimal performance impact
 *
 * @returns JavaScript string to inject into WebView
 */
export function getTargetBlankHandlerScript(): string {
  return `
    (function() {
      // Handle target="_blank" links to open in same WebView
      // Uses capture phase to intercept before other handlers
      document.addEventListener('click', function(e) {
        // Find the closest anchor element (handles clicks on child elements)
        var target = e.target;
        while (target && target.tagName !== 'A') {
          target = target.parentElement;
        }
        
        // Only handle links with target="_blank"
        if (target && target.tagName === 'A' && target.getAttribute('target') === '_blank') {
          var href = target.getAttribute('href');
          
          // Only handle http/https links (skip mailto:, tel:, javascript:, etc)
          if (href && (href.indexOf('http://') === 0 || href.indexOf('https://') === 0)) {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = href;
          }
        }
      }, true); // Use capture phase for early interception
    })();
    true;
  `;
}

/**
 * Combines multiple scripts into a single injection string
 * Scripts are separated by newlines for better debugging
 *
 * @param scripts - Array of script strings to combine
 * @returns Combined JavaScript string
 */
export function combineScripts(...scripts: string[]): string {
  return scripts.filter(Boolean).join("\n\n");
}
