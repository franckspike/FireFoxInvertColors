function nullFunc() {
}

function setColors(tabId) {
    browser.storage.local.get().then((res) => {
        setColorsToState(tabId, res.InvertColorsState, res.InvertPage, res.InvertImage);
    });
}

function setColorsToState(tabId, state, invertPage, invertImage) {
    if (state == true) {
        if (invertPage) invertColors(tabId);
        if (invertImage != invertPage) invertImg(tabId);
    } else {
        revertImg(tabId);
        revertColors(tabId);
    }
    browser.sessions.setTabValue(tabId, "invertColors", state).then(nullFunc(), nullFunc());
    browser.sessions.setTabValue(tabId, "invertPage", invertPage).then(nullFunc(), nullFunc());
    browser.sessions.setTabValue(tabId, "invertImage", invertImage).then(nullFunc(), nullFunc());
}

function toggleColors(obj, tab) {
    browser.storage.local.get().then((res) => {
      if (tab) {
        browser.sessions.getTabValue(tab.id, "invertColors").then( tabState => {
          tabState = !tabState;
          browser.sessions.getTabValue(tab.id, "invertPage").then( invertPage => {
            browser.sessions.getTabValue(tab.id, "invertImage").then( invertImage => {
                setColorsToState(tab.id, tabState, res.InvertPage, res.InvertImage);
                setPageIconState(tab, tabState);
            }, nullFunc());
          }, nullFunc());
        }, nullFunc());
      } else {
        var state = res.InvertColorsState ? res.InvertColorsState : false;
        state = obj != false ? !state : state;
        setIconState(state);

        browser.storage.local.set({ InvertColorsState: state, InvertPage: res.InvertPage, InvertImage: res.InvertImage });

        browser.tabs.query({}).then((tabs) => {
            for (var tab of tabs) {
                setColorsToState(tab.id, state, res.InvertPage, res.InvertImage);
            };
        });
      }
    });
}

function setIconState(state) {
    if (state) {
        browser.browserAction.setIcon({ path: "icons/on.svg" });
        browser.browserAction.setTitle({ title: "Revert Colors" });
    } else {
        browser.browserAction.setIcon({ path: "icons/off.svg" });
        browser.browserAction.setTitle({ title: "Invert Colors" });
    }
}

function setPageIconState(tab, state) {
    if (state) {
        browser.pageAction.setIcon({tabId: tab.id, path: "icons/on.svg" });
        browser.pageAction.setTitle({tabId: tab.id, title: "Revert Current Page Colors" });
    } else {
        browser.pageAction.setIcon({tabId: tab.id, path: "icons/off.svg" });
        browser.pageAction.setTitle({tabId: tab.id, title: "Invert Current Page Colors" });
    }
}

function invertImg(tabId) {
    browser.tabs.insertCSS(tabId, {
        file: "image.css"
    });
}

function revertImg(tabId) {
    browser.tabs.removeCSS(tabId, {
        file: "image.css"
    });
}

function invertColors(tabId) {
    browser.tabs.insertCSS(tabId, {
        file: "style.css"
    });
}

function revertColors(tabId) {
    browser.tabs.removeCSS(tabId, {
        file: "style.css"
    });
}

function handleUpdated(tabId, changeInfo, tabInfo) {
    browser.pageAction.show(tabId);
    if (changeInfo.status) {
        setColors(tabId);
    }
}

function handleStorageUpdate(changes, area) {
    if (area == "local") {
        for (var item of Object.keys(changes)) {
            if (item == "InvertColorsState" || item == "InvertPageOnly" || item == "InvertPageAndImage" || item == "InvertImageOnly") {
                browser.storage.local.get().then((res) => {
                    var state = res.InvertColorsState ? res.InvertColorsState : false;
                    setIconState(state);

                    browser.tabs.query({}).then((tabs) => {
                        for (var tab of tabs) {
                            setColorsToState(tab.id, state, res.InvertPage, res.InvertImage);
                        };
                    });
                });
            }
        }
    }
}

browser.contextMenus.create({
    id: "InvertColors",
    title: "Invert Colors"
});

browser.tabs.onUpdated.addListener(handleUpdated);
browser.storage.onChanged.addListener(handleStorageUpdate);
browser.browserAction.onClicked.addListener(toggleColors);
browser.pageAction.onClicked.addListener((tab) => {
    toggleColors(true,tab);
});
browser.contextMenus.onClicked.addListener(toggleColors);

toggleColors(false);
