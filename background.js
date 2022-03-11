// Create context menu when extension installed
chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
});

// Reinitialize context menu when profile first starts up
chrome.runtime.onStartup.addListener(() => {
  createContextMenu();
});

// Create context menu
function createContextMenu() {
  chrome.contextMenus.create({
    title: "Toggle TabFocus",
    id: "TabFocus",
    type: "normal",
    contexts: ["all"],
  });
}

// Listen for extension icon execution
chrome.action.onClicked.addListener((tab) => {
  // window_type assumed normal if action clicked
  toggleWindowType(tab, "normal");
});

// Listen for context menu execution
chrome.contextMenus.onClicked.addListener((info, tab) => {
  chrome.windows.getCurrent((window) => {
    toggleWindowType(tab, window.type);
  });
});

// If normal tab open as popup; else return popup to normal window
function toggleWindowType(tab, window_type) {
  window_type === "normal" ? openTabAsPopup(tab) : returnTabToWindow(tab);
}

// Open normal tab as popup window then remove old tab
function openTabAsPopup(tab) {
  // Cannot move normal tabs to popups, must create new popup
  chrome.windows.create({ url: tab.url, type: "popup" }, (window) => {
    chrome.tabs.remove(tab.id);
  });
}

// Return popup to normal window
function returnTabToWindow(tab) {
  chrome.windows.getAll({ windowTypes: ["normal"] }, (windows) => {
    // Create normal window if one doesn't exist
    if (!windows[0]) {
      createNormalWindow(tab);
      return false;
    }

    // Move popup tab to normal window
    const move_params = { windowId: windows[0].id, index: -1 };
    chrome.tabs.move(tab.id, move_params, (newtab) => {
      focusReturnedTab(newtab);
    });
  });
}

// Focus tab after returning it to normal window
function focusReturnedTab(newtab) {
  chrome.tabs.update(newtab.id, { active: true }, () => {
    chrome.windows.update(newtab.windowId, { focused: true });
  });
}

// Create a normal window from provided tab url
function createNormalWindow(tab) {
  chrome.windows.create({ url: tab.url }, () => {
    chrome.tabs.remove(tab.id);
  });
}
