var fb_visit_count = 0;
var gm_visit_count = 0;

// var fb_tab = 0;
// var gm_tab = 0;

var start = new Date();
start.setHours(6,0,0,0);

var gmail_in_session = false;
var gmail_session_start;
var gmail_session_end;
var fb_in_session = false;
var fb_session_start;
var fb_session_end;
var all_tab_info = {};


function start_session(history_item) {
    if (!gmail_in_session && history_item.url.includes('mail.google.com')) {
        gmail_in_session = true;
        gmail_session_start = new Date();
        // nullify old session end time if there was one.
        gmail_session_end = null;
        console.log("Gmail session started!");
    }
    if (!fb_in_session && history_item.url.includes('facebook.com')) {
        fb_in_session = true;
        fb_session_start = new Date();
        // nullify old session end time if there was one.
        fb_session_end = null;
        console.log("Facebook session started!");
    }
}

function close_session(tabId,removeInfo) {
    if (!all_tab_info.hasOwnProperty(tabId)) {
        return
    }

    if (gmail_in_session && all_tab_info[tabId].url.includes('mail.google.com')) {
        gmail_in_session = false;
        gmail_session_end = new Date();
        var st = calculate_session_time(gmail_session_start,gmail_session_end);
        console.log("SESSION TIME:",msToTime(st));
        alert("Your gmail session time was "+msToTime(st));
        // Hit some sort of data store to track session times
        // log_session_time(st);
        gmail_session_end = new Date();
        console.log("Gmail session ended!");
    }

    if (fb_in_session && all_tab_info[tabId].url.includes('facebook.com')) {
        fb_in_session = false;
        fb_session_end = new Date();
        var st = calculate_session_time(fb_session_start,fb_session_end);
        console.log("SESSION TIME:",msToTime(st));
        alert("Your Facebook session time was "+msToTime(st));
        // Hit some sort of data store to track session times
        // log_session_time(st);
        fb_session_end = new Date();
        console.log("Facebook session ended!");
    }
}

function collect_tabs(tabId, changeInfo, tab) {
    // Note: this event is fired twice:
    // Once with `changeInfo.status` = "loading" and another time with "complete"
    all_tab_info[tabId] = tab;
}

function calculate_session_time(session_start,session_end) {
    return Math.abs(session_end - session_start);
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

chrome.tabs.onUpdated.addListener(collect_tabs);
chrome.history.onVisited.addListener(start_session);
chrome.tabs.onRemoved.addListener(close_session);


// Clean up:
// clear all_tab_info every day




// Array.prototype.contains = function(v) {
//     for(var i = 0; i < this.length; i++) {
//         if(this[i] === v) return true;
//     }
//     return false;
// };

// Array.prototype.unique = function() {
//     var arr = [];
//     for(var i = 0; i < this.length; i++) {
//         if(!arr.contains(this[i])) {
//             arr.push(this[i]);
//         }
//     }
//     return arr; 
// }

// function tally(results) {
//     var facebook_results = [];
//     var gmail_results = [];
//     var fb_sortable = [];
//     var gm_sortable = [];

//     for (var i = 0; i < results.length; i++) {
//         var res = results[i];
//         if (res.url.includes('facebook.com') && res.lastVisitTime >= start) {
//             facebook_results.push(res.lastVisitTime);
//         } 
//         else if (res.url.includes('mail.google.com') && res.lastVisitTime >= start) {
//             gmail_results.push(res.lastVisitTime);
//         }
//     };
    
//     facebook_results = facebook_results.unique().sort();
//     fb_visit_count = facebook_results.length;
//     // console.log(facebook_results);

//     gmail_results = gmail_results.unique().sort();
//     gm_visit_count = gmail_results.length;
//     // console.log(gmail_results);

//     // log results
//     count_totals();
// }


// function check_totals (history_item) {
//     chrome.history.search({
//         text:'',
//         startTime: start.getMilliseconds(),
//         maxResults: 1000
//     },tally);
// }

// chrome.history.onVisited.addListener(check_totals);

// chrome.tabs.onActivated.addListener(function(activeInfo) {
//     chrome.tabs.get(activeInfo.tabId, function (tab) {
//         checkTabUrl(tab.url);
//     });
// });

// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
//     chrome.tabs.query({'active': true}, function (activeTabs) {
//         var activeTab = activeTabs[0];

//         if (activeTab == updatedTab) {
//             checkTabUrl(activeTab.url);
//         }
//     });
// });

// function checkTabUrl(url) {
//     if (url.includes('facebook.com')) {
//         fb_tab += 1;
//     } 
//     else if (url.includes('mail.google.com')) {
//         gm_tab += 1;
//     }

//     // log results
//     count_totals();
// }

// // check initial totals when ext is turned on
// check_totals(null);

// function count_totals() {
//     console.log("FB visits: ",fb_visit_count);
//     console.log("Gmail visits: ",gm_visit_count);
//     console.log("FB tabbed to: ",fb_tab);
//     console.log("Gmail tabbed to: ",gm_tab);
    
//     if ((fb_visit_count + fb_tab) > 10) {
//         alert("Facebook limit reached!");
//     }
//     if ((gm_visit_count + gm_tab) > 10) {
//         alert("Gmail limit reached!");
//     }
// }

