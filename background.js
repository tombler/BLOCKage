// var gmail_in_session = false;
// var gmail_session_start;
// var gmail_session_end;
// var fb_in_session = false;
// var fb_session_start;
// var fb_session_end;
// var all_tab_info = {};


// function start_session(history_item) {
//     if (!gmail_in_session && history_item.url.includes('mail.google.com')) {
//         gmail_in_session = true;
//         gmail_session_start = new Date();
//         // nullify old session end time if there was one.
//         gmail_session_end = null;
//         console.log("Gmail session started!");
//     }
//     if (!fb_in_session && history_item.url.includes('facebook.com')) {
//         fb_in_session = true;
//         fb_session_start = new Date();
//         // nullify old session end time if there was one.
//         fb_session_end = null;
//         console.log("Facebook session started!");
//     }
// }

// function close_session(tabId,removeInfo) {
//     if (!all_tab_info.hasOwnProperty(tabId)) {
//         return
//     }

//     if (gmail_in_session && all_tab_info[tabId].url.includes('mail.google.com')) {
//         gmail_in_session = false;
//         gmail_session_end = new Date();
//         var st = calculate_session_time(gmail_session_start,gmail_session_end);
//         console.log("SESSION TIME:",msToTime(st));
//         alert("Your gmail session time was "+msToTime(st));
//         // Hit some sort of data store to track session times
//         // log_session_time(st);
//         gmail_session_end = new Date();
//         console.log("Gmail session ended!");
//     }

//     if (fb_in_session && all_tab_info[tabId].url.includes('facebook.com')) {
//         fb_in_session = false;
//         fb_session_end = new Date();
//         var st = calculate_session_time(fb_session_start,fb_session_end);
//         console.log("SESSION TIME:",msToTime(st));
//         alert("Your Facebook session time was "+msToTime(st));
//         // Hit some sort of data store to track session times
//         // log_session_time(st);
//         fb_session_end = new Date();
//         console.log("Facebook session ended!");
//     }
// }

// function collect_tabs(tabId, changeInfo, tab) {
//     // Note: this event is fired twice:
//     // Once with `changeInfo.status` = "loading" and another time with "complete"
//     all_tab_info[tabId] = tab;
// }

// function calculate_session_time(session_start,session_end) {
//     return Math.abs(session_end - session_start);
// }

// // http://stackoverflow.com/questions/19700283/how-to-convert-time-milliseconds-to-hours-min-sec-format-in-javascript
// function msToTime(duration) {
//     var milliseconds = parseInt((duration%1000)/100)
//         , seconds = parseInt((duration/1000)%60)
//         , minutes = parseInt((duration/(1000*60))%60)
//         , hours = parseInt((duration/(1000*60*60))%24);

//     hours = (hours < 10) ? "0" + hours : hours;
//     minutes = (minutes < 10) ? "0" + minutes : minutes;
//     seconds = (seconds < 10) ? "0" + seconds : seconds;

//     return hours + ":" + minutes + ":" + seconds;
// }

// chrome.tabs.onUpdated.addListener(collect_tabs);
// chrome.history.onVisited.addListener(start_session);
// chrome.tabs.onRemoved.addListener(close_session);


// // Clean up:
// // clear all_tab_info every day



// function start_session(history_item) {
//     if (!gmail_in_session && history_item.url.includes('mail.google.com')) {
//         gmail_in_session = true;
//         gmail_session_start = new Date();
//         // nullify old session end time if there was one.
//         gmail_session_end = null;
//         console.log("Gmail session started!");
//     }
//     if (!fb_in_session && history_item.url.includes('facebook.com')) {
//         fb_in_session = true;
//         fb_session_start = new Date();
//         // nullify old session end time if there was one.
//         fb_session_end = null;
//         console.log("Facebook session started!");
//     }
// }


//globals
var baseUrl = 'http://localhost:3000';


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

//To do: refactor authUser,getUserApps, addApp to common func
function authUser(userData) {
    var url = baseUrl+'/api/1.0/user'; 
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

function getUserApps(userid) {
    var url = baseUrl+'/api/1.0/app?userid='+userid; 
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            chrome.runtime.sendMessage(res);
        }
    }
    http.send(null);
}

function addApp(appData) {
    var url = baseUrl+'/api/1.0/app'; 
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

function startSession() {
    // set flag on app DB object? or just locally?
}

function stopSession() {
    // calculate time
    // create session in db w/ start time + end time + duration
}



// Execution/Listeners


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

// Get user's extension ID on startup
// If it doesn't exist in the DB, backend will create it
chrome.storage.sync.get('userid', function(items) {
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
});


