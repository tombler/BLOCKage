// TO DO:
    // 2nd analytics graph for total time
    // Add "pause" functionality to sessions, e.g. site is open but tab is not active
    // Clear "Add a Site" form inputs on submission
    // Delete app (and all sessions)
    // Modify existing app name/url

// DONE:
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
function startSession(history_item) {
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (history_item.url.includes(globals.trackedApplications[i].url) && !globals.trackedApplications[i].in_session) {
            // onVisited fires multiple times for a site ("fake page loads")
            // setting in_session here ensures we only start one session for this app and user at a time
            var now = new Date();
            globals.trackedApplications[i].in_session = true;
            globals.trackedApplications[i].session_start = now;
            updateApp(globals.trackedApplications[i]);
            // no need to save session b/c it's not complete, no end time
        }
    };
}

function collect_tabs(tabId, changeInfo, tab) {
    // Note: this event is fired twice:
    // Once with `changeInfo.status` = "loading" and another time with "complete"
    globals.all_tab_info[tabId] = tab;
}

function stopSession(tabId,removeInfo) {
    // calculate time
    // create session in db w/ start time + end time + duration
    if (!globals.all_tab_info.hasOwnProperty(tabId)) {
        return
    }
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (globals.all_tab_info[tabId].url.includes(globals.trackedApplications[i].url) && globals.trackedApplications[i].in_session) {
            var start = new Date(globals.trackedApplications[i].session_start);
            var stop = new Date();
            var duration = msToTime(stop - start);
            var application_id = globals.trackedApplications[i].id;
            var extension_id = globals.trackedApplications[i].extension_id;
            var session = {
                start: start,
                stop: stop,
                duration: duration,
                application_id: application_id,
                extension_id: extension_id
            }
            globals.trackedApplications[i].in_session = false;
            globals.trackedApplications[i].session_start = null;
            // pass app data to saveSession to run updateApp() as a callback on success
            saveSession(session,globals.trackedApplications[i]);
        }
    }
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
chrome.tabs.onUpdated.addListener(collect_tabs);
chrome.history.onVisited.addListener(startSession);
chrome.tabs.onRemoved.addListener(stopSession);



