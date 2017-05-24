// TO DO:
    // Add "pause" functionality to sessions, e.g. site is open but tab is not active
    // 2nd analytics graph for total time
    // Delete app (and all sessions)
    // Modify existing app name/url

// DONE:
    // Clear "Add a Site" form inputs on submission
    // - Session history/analytics tab
        // queries
        // graph
    // - Add locally-stored live session info to DOM on popup, e.g.
        // Sessions today: 3
        // In session: Yes
        // Active time: 00:00:35
    // - Change getApps() to return local globals.trackedApplications
        // 1. Extension loads: get all user apps from the db
        // 2. Popup loads: get all user apps from locally-stored
        // 3. User adds app: save to db, reload all user apps from db and store locally


//chrome functions / frontend logic
function startSession(app) {
    // onVisited fires multiple times for a site ("fake page loads")
    // setting in_session here ensures we only start one session for this app and user at a time
    var now = new Date();
    app.in_session = true;
    app.paused = false;
    app.session_start = now;
    app.duration = 0;
    app.check_count = 1;
    // saves app state to DB
    updateApp(app);
    // no need to save session b/c it's not complete, no end time
}

function collect_tabs(tabId, changeInfo, tab) {
    // Note: this event is fired twice:
    // Once with `changeInfo.status` = "loading" and another time with "complete"
    globals.all_tab_info[tabId] = tab;
}

function stopSession(app) {
    // calculate time
    // create session in db w/ start time + end time + duration
    var start = new Date(app.session_start);
    var stop = new Date();
    // var duration = msToTime(stop - start);
    var duration = stop - start;
    var application_id = app.id;
    var extension_id = app.extension_id;
    var check_count = parseInt(app.check_count);
    var session = {
        start: start,
        stop: stop,
        duration: duration,
        check_count: check_count,
        application_id: application_id,
        extension_id: extension_id
    }
    app.in_session = false;
    app.paused = false;
    app.session_start = null;
    app.duration = null;
    app.check_count = null;
    // pass app data to saveSession to run updateApp() as a callback on success
    saveSession(session,app);
}

function pauseSession(app) {
    // we're unpausing the session. Increment the check count
    if (!app.paused) {
        app.check_count++;
        // setInterval() to increment duration by 1000ms
    }
    // we're pausing the session. 
    else {
        // clearInterval() to stop incrementing duration
    }
    updateApp(app);
}

// Execution/Listeners

// popup.html DOM interactions
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    // called when popup.html is opened
    if (message.msg === 'getApps') {
        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid;
            // get apps from local storage to avoid DB call
            // pass sendResponse so getUserApps() can send the data to popup.js after loading
            getUserApps(userid,false,sendResponse);
        });
    }

    if (message.msg === 'addApp') {
        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid;
            var appData = {
                name: message.data.name,
                url: message.data.url,
                extension_id: userid
            }
            addApp(appData, sendResponse);
        });
    }

    if (message.msg === 'getCharts') {
        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid;
            // get apps from local storage to avoid DB call
            // pass sendResponse so getUserApps() can send the data to popup.js after loading
            getDailySessions(userid,true,sendResponse);
        });
    }

    // Needed in order to keep message channel open until sendResponse is triggered
    return true;
});

// Startup functions
chrome.storage.sync.get('userid', function(items) {
    // auth the user, which will create one if it doesn't exist
    var userid = items.userid;
    if (userid) {
        var userData = {extension_id: userid};
        authUser(userData);
    } else {
        userid = getRandomToken();
        chrome.storage.sync.set({userid: userid}, function() {
            var userData = {extension_id: userid};
            authUser(userData);
        });
    }
    // Set that user's apps to begin tracking immediately
    // No need to sendResponse to DOM b/c popup.html isn't open yet
    // We just want to store the apps locally so we can track them
    getUserApps(userid,true);
});

// listeners for tracking sessions

//Collect tab info for onRemoved events
chrome.tabs.onUpdated.addListener(collect_tabs);
// Collect window info for onRemoved events
// TODO*****************

// Start session:
// when a site is visited
chrome.history.onVisited.addListener(function (history_item) {
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (history_item.url.includes(globals.trackedApplications[i].url) && !globals.trackedApplications[i].in_session) {
            startSession(globals.trackedApplications[i]);
        }
    }
});

// pause session:
// when active tab changes
chrome.tabs.onActivated.addListener(function(activeInfo) {
    if (!globals.all_tab_info.hasOwnProperty(activeInfo.tabId)) {
        return
    }
    var tab = globals.all_tab_info[activeInfo.tabId];
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        // if the app is not paused (i.e. active), and the tab we've navigated to isn't the app
        // we must be navigating away from the live tab
        if (!globals.trackedApplications[i].paused && !tab.url.includes(globals.trackedApplications[i].url)) {
            // toggle immediately to avoid race conditions
            globals.trackedApplications[i].paused = !globals.trackedApplications[i].paused;
            pauseSession(globals.trackedApplications[i]);
        } 
        // if the app is paused and the tab we're navigating to IS the app
        // we must be unpausing the session
        else if (globals.trackedApplications[i].paused && tab.url.includes(globals.trackedApplications[i].url)) {
            if (globals.trackedApplications[i].session_start === null) {
                // in case we trigger an unstarted session
                startSession(globals.trackedApplications[i]);
            } else {
                globals.trackedApplications[i].paused = !globals.trackedApplications[i].paused;
                pauseSession(globals.trackedApplications[i]);
            }
        }
    }
});
// when new tab opens 
chrome.tabs.onCreated.addListener(function (tab) {
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (!globals.trackedApplications[i].paused && !tab.url.includes(globals.trackedApplications[i].url)) {
            // toggle immediately to avoid race conditions
            globals.trackedApplications[i].paused = !globals.trackedApplications[i].paused;
            pauseSession(globals.trackedApplications[i]);
        } 
    }
});
// when window changes
// TODO ******

// stop session and save:
// when user closes tab
chrome.tabs.onRemoved.addListener(function(tabId,removeInfo) {
    if (!globals.all_tab_info.hasOwnProperty(tabId)) {
        return
    }
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (globals.all_tab_info[tabId].url.includes(globals.trackedApplications[i].url) && globals.trackedApplications[i].in_session) {
            stopSession(globals.trackedApplications[i]);  
        }
    }
    //TO-DO: Support for multiple tabs of same app
    // e.g. two gmail tabs open and one gets closed, in_session still == true
});
// when user closes window
// TODO*********

// adds all tabs to global obj when extension loads
chrome.windows.getCurrent({populate:true}, function(Window) {
    for (var i = 0; i < Window.tabs.length; i++) {
        globals.all_tab_info[Window.tabs[i].id] = Window.tabs[i];
    };
});






