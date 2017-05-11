// TO DO:
    // - Change getApps() to return local globals.trackedApplications
    // - Add locally-stored live session info to DOM on popup, e.g.
        // Sessions today: 3
        // In session: Yes
        // Active time: 00:00:35
    // - Clear "Add a Site" form inputs on submission
    // - Session history/analytics tab
        // queries
        // graph


//globals - put in config file
globals = {};
globals.baseUrl = 'http://localhost:3000';
globals.all_tab_info = {};
globals.currentSessions = [];
globals.trackedApplications = [];

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

function getUserApps(userid,init=false) {
    var url = globals.baseUrl+'/api/1.0/application?extension_id='+userid; 
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            chrome.runtime.sendMessage(res);

            // extension is starting up, set global
            if (init) {
                globals.trackedApplications = res.data;
            }
        }
    }
    http.send(null);
}

function addApp(appData) {
    var url = globals.baseUrl+'/api/1.0/application'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(appData);
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            chrome.runtime.sendMessage(res);
        }
    }
    http.send(data);
}

function saveSession(session) {
    var url = globals.baseUrl+'/api/1.0/session'; 
    var http = new XMLHttpRequest();
    var data = JSON.stringify(session);
    http.open("POST", url, true);
    http.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            // any reason to send resp to DOM?
            // chrome.runtime.sendMessage(res);
            console.log(res);
        }
    }
    http.send(data);
}

function startSession(history_item) {
    for (var i = 0; i < globals.trackedApplications.length; i++) {
        if (history_item.url.includes(globals.trackedApplications[i].url) && !globals.trackedApplications[i].in_session) {
            console.log('started');
            globals.trackedApplications[i].in_session = true;
            globals.trackedApplications[i].session_start = new Date();
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
            var start = globals.trackedApplications[i].session_start;
            var stop = new Date();
            var duration = msToTime(stop - start);
            var application_id = globals.trackedApplications[i].id;
            var session = {
                start: start,
                stop: stop,
                duration: duration,
                application_id: application_id
            }
            globals.trackedApplications[i].in_session = false;
            globals.trackedApplications[i].session_start = null;

            // retrieve the extension ID so we can add it to the session info, then save
            chrome.storage.sync.get('userid', function(items) {
                var userid = items.userid;
                session.extension_id = userid;
                saveSession(session);
            });
        }
    };
}

// Execution/Listeners

// popup.html DOM interactions
chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
    if (message.msg === 'getApps') {
        chrome.storage.sync.get('userid', function(items) {
            var userid = items.userid;
            getUserApps(userid);
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
            addApp(appData);
        });
    }
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
    getUserApps(userid,true);
});

// listeners for tracking sessions
chrome.tabs.onUpdated.addListener(collect_tabs);
chrome.history.onVisited.addListener(startSession);
chrome.tabs.onRemoved.addListener(stopSession);




