// Migrate to event driven background scripts
// https://developer.chrome.com/extensions/background_migration
chrome.runtime.onInstalled.addListener(() => { init() })
chrome.runtime.onStartup.addListener(() => { init() })

// Initialize the extension
function init() {
    // Create context menu (adds to right click options)
    chrome.contextMenus.create({
        "title": "Toggle TabFocus",
        "id": "TabFocus",
        "type": "normal",
        "contexts": ["all"]
    })
}

// Listen for browser action execution
chrome.browserAction.onClicked.addListener(tab => {
    // window_type assumed normal if browserAction clicked
    liftWindow(tab, "normal")
})

// Listen for content menu execution
chrome.contextMenus.onClicked.addListener((info, tab) => {
    chrome.windows.getCurrent((window) => {
        liftWindow(tab, window.type)
    })
})

// If normal tab open as popup; else return popup to normal window
function liftWindow(tab, window_type) {
    (window_type === "normal") ? openTabAsPopup(tab): returnTabToWindow(tab)
}

// Given normal tab, open it as popup window then remove old tab
function openTabAsPopup(tab) {
    // Cannot move normal tabs to popups, must create new popup
    chrome.windows.create({ url: tab.url, type: "popup" }, window => {
        chrome.tabs.remove(tab.id)
    })
}

// If executed on popup, return to normal window
function returnTabToWindow(tab) {
    chrome.windows.getAll({ windowTypes: ["normal"] }, windows => {
        // Handle where no normal windows exist
        if (!windows[0]) { createNormalWindow(tab); return false }

        // Move popup tab to normal window
        const move_params = { windowId: windows[0].id, index: -1 };
        chrome.tabs.move(tab.id, move_params, (newtab) => {
            focusReturnedTab(newtab)
        });
    });
}

// Bring tab into focus after returned to normal window
function focusReturnedTab(newtab) {
    chrome.tabs.update(newtab.id, { active: true }, () => {
        chrome.windows.update(newtab.windowId, { focused: true })
    });
}

// If no normal windows exists for popup return, create a new one
function createNormalWindow(tab) {
    chrome.windows.create({ url: tab.url }, () => {
        chrome.tabs.remove(tab.id)
    })
}