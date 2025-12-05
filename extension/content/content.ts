// Content script that injects the wallet provider into web pages

console.log('RoundUp Wallet content script loaded');

// Inject the provider script into the page
const script = document.createElement('script');
script.src = chrome.runtime.getURL('inject.js');
script.onload = function() {
  // @ts-ignore
  this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  // Only accept messages from same window
  if (event.source !== window) return;

  const message = event.data;

  // Only handle our wallet messages
  if (message.target !== 'roundup-wallet-content') return;

  console.log('Content script received:', message);

  try {
    // Forward to background script
    const response = await chrome.runtime.sendMessage({
      method: message.method,
      params: message.params,
    });

    // Send response back to page
    window.postMessage(
      {
        target: 'roundup-wallet-inject',
        id: message.id,
        result: response,
      },
      '*'
    );
  } catch (error: any) {
    window.postMessage(
      {
        target: 'roundup-wallet-inject',
        id: message.id,
        error: error.message,
      },
      '*'
    );
  }
});
