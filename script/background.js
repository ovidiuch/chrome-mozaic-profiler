// Reference to devtools panel ports. This background script handles all tabs
// so a port for each tab-corresponding devtools instance will be held
var devtoolsPorts = [];

var sendRefreshSignalToTab = function(tabId) {
  /*
    Send refresh message to devtools instance of the just loaded page (if the
    developer toolbar is opened for that tab)
  */
  if (devtoolsPorts[tabId]) {
    devtoolsPorts[tabId].postMessage({action: 'refresh'});
  }
};

// This handler is called whenever a document finishes to load (DOM and
// resources)
chrome.webNavigation.onCompleted.addListener(function(details) {
  // Ignore frames
  if (details.frameId !== 0) {
    return;
  }
  sendRefreshSignalToTab(details.tabId);
});

// Accept incoming connection from devtools instances
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name.indexOf('mozaic-') !== 0) {
    return;
  }
  // Extract the tabId from the port name
  tabId = Number(port.name.replace(/^mozaic-/, ''));
  devtoolsPorts[tabId] = port;

  // Send refresh signal just as the devtool panel is enabled
  sendRefreshSignalToTab(tabId);
});
