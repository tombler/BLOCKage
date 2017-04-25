var fb_visit_count = 0;
var gm_visit_count = 0;

var fb_tab = 0;
var gm_tab = 0;

var start = new Date();
start.setHours(6,0,0,0);

Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
};

Array.prototype.unique = function() {
    var arr = [];
    for(var i = 0; i < this.length; i++) {
        if(!arr.contains(this[i])) {
            arr.push(this[i]);
        }
    }
    return arr; 
}

function tally(results) {
    var facebook_results = [];
    var gmail_results = [];
    var fb_sortable = [];
    var gm_sortable = [];

    for (var i = 0; i < results.length; i++) {
        var res = results[i];
        if (res.url.includes('facebook.com') && res.lastVisitTime >= start) {
            facebook_results.push(res.lastVisitTime);
        } 
        else if (res.url.includes('mail.google.com') && res.lastVisitTime >= start) {
            gmail_results.push(res.lastVisitTime);
        }
    };
    
    facebook_results = facebook_results.unique().sort();
    fb_visit_count = facebook_results.length;
    // console.log(facebook_results);

    gmail_results = gmail_results.unique().sort();
    gm_visit_count = gmail_results.length;
    // console.log(gmail_results);

    // log results
    count_totals();
}


function check_totals (history_item) {
    chrome.history.search({
        text:'',
        startTime: start.getMilliseconds(),
        maxResults: 1000
    },tally);
}

chrome.history.onVisited.addListener(check_totals);

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function (tab) {
        checkTabUrl(tab.url);
    });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, updatedTab) {
    chrome.tabs.query({'active': true}, function (activeTabs) {
        var activeTab = activeTabs[0];

        if (activeTab == updatedTab) {
            checkTabUrl(activeTab.url);
        }
    });
});

function checkTabUrl(url) {
    if (url.includes('facebook.com')) {
        fb_tab += 1;
    } 
    else if (url.includes('mail.google.com')) {
        gm_tab += 1;
    }

    // log results
    count_totals();
}

// check initial totals when ext is turned on
check_totals(null);

function count_totals() {
    console.log("FB visits: ",fb_visit_count);
    console.log("Gmail visits: ",gm_visit_count);
    console.log("FB tabbed to: ",fb_tab);
    console.log("Gmail tabbed to: ",gm_tab);
    
    if ((fb_visit_count + fb_tab) > 10) {
        alert("Facebook limit reached!");
    }
    if ((gm_visit_count + gm_tab) > 10) {
        alert("Gmail limit reached!");
    }
}

