// TO DO:
    // - Session history/analytics tab
        // queries
        // graph
    // Add "pause" functionality to sessions, e.g. site is open but tab is not active
    // Clear "Add a Site" form inputs on submission
    // Delete app (and all sessions)
    // Modify existing app name/url

// DONE:
    // - Add locally-stored live session info to DOM on popup, e.g.
        // Sessions today: 3
        // In session: Yes
        // Active time: 00:00:35
    // - Change getApps() to return local globals.trackedApplications
        // 1. Extension loads: get all user apps from the db
        // 2. Popup loads: get all user apps from locally-stored
        // 3. User adds app: save to db, reload all user apps from db and store locally


//globals - put in config file
globals = {};
globals.baseUrl = 'http://localhost:3000';
globals.all_tab_info = {};
globals.currentSessions = [];
globals.trackedApplications = [];
globals.userSessions = [];

// functions
function getRandomToken() {
    // E.g. 8 * 32 = 256 bits token
    var randomPool = new Uint8Array(32);
    crypto.getRandomValues(randomPool);
    var hex = '';
    for (var i = 0; i < randomPool.length; ++i) {
        hex += randomPool[i].toString(16);
    }
    // E.g. db18458e2782b2b77e36769c569e263a53885a9944dd0a861e5064eac16f1a
    return hex;
}

// http://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

//To do: refactor authUser,getUserApps, addApp to common func
function authUser(userData) {
    var url = globals.baseUrl+'/api/1.0/extension'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(userData)
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            // message goes nowhere b/c popup.js isn't listening
            // DOM doesn't need this data
            chrome.runtime.sendMessage(res);
            console.log(res);
        }
    }
    http.send(data);
}

function getUserApps(userid,from_db=false,sendResponse=null) {
    if (!from_db) {
        // fake ajax
        var res = {
            status: 'success',
            data: globals.trackedApplications,
            message: 'getApps'
        }
        if (sendResponse !== null) {
            console.log("Resp sent, data loaded from local storage");
            sendResponse(res);
        }
        return
    }

    // Otherwise grab from DB
    var url = globals.baseUrl+'/api/1.0/application?extension_id='+userid; 
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            if (sendResponse !== null) {
                console.log("Resp sent, data loaded from DB");
                console.log(res);
                sendResponse(res);
            }
            globals.trackedApplications = res.data;
        }
    }
    http.send(null);
}

function addApp(appData,sendResponse) {
    var url = globals.baseUrl+'/api/1.0/application'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(appData);
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            // must reload from DB, so 2nd arg = true
            getUserApps(appData.extension_id,true,sendResponse);
        }
    }
    http.send(data);
}

function updateApp(appData,sendResponse=null) {
    var url = globals.baseUrl+'/api/1.0/application/update'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(appData);
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            // Run getUserApps() as a callback on success
            // must reload from DB, so 2nd arg = true
            if (sendResponse === null) {
                // Scenario 1: updating app with in_session = true or false
                    // sendResponse fires but goes nowhere b/c popup.html isn't open
                getUserApps(appData.extension_id,true);    
            } else {
                // Scenario 2: updating app with new name or url from popup.html DOM
                    // sendResponse fires updated app data back to DOM
                getUserApps(appData.extension_id,true,sendResponse);
            }
        }
    }
    http.send(data);
}

function saveSession(session,appData) {
    var url = globals.baseUrl+'/api/1.0/session'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(session);
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            updateApp(appData);
            globals.userSessions = res.data;
        }
    }
    http.send(data);
}

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

function getUserSessions(userid,from_db=false,sendResponse=null) {
    if (!from_db) {
        // fake ajax
        var res = {
            status: 'success',
            data: globals.userSessions,
            message: 'getSessions'
        }
        if (sendResponse !== null) {
            console.log("Resp sent, data loaded from local storage");
            sendResponse(res);
        }
        return
    }

    // Otherwise grab from DB
    var url = globals.baseUrl+'/api/1.0/session?extension_id='+userid; 
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            if (sendResponse !== null) {
                console.log("Resp sent, data loaded from DB");
                sendResponse(res);
            }
            globals.userSessions = res.data;
        }
    }
    http.send(null);
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



