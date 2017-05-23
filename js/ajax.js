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
        } else {
            console.log("Error:",http.responseText);
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
        } else {
            console.log("Error:",http.responseText);
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
        } else {
            console.log("Error:",http.responseText);
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
        } else {
            console.log("Error:",http.responseText);
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
        } else {
            console.log("Error:",http.responseText);
        }
    }
    http.send(data);
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
        } else {
            console.log("Error:",http.responseText);
        }
    }
    http.send(null);
}

function getDailySessions(userid,from_db=false,sendResponse=null) {
    if (!from_db) {
        console.log("not retrieving daily sessions from db");
        return
    }

    // Otherwise grab from DB
    var url = globals.baseUrl+'/api/1.0/session/daily?extension_id='+userid; 
    var http = new XMLHttpRequest();
    http.open("GET", url, true);
    http.setRequestHeader("Accept", "application/json");
    http.onreadystatechange = function()
    {
        if(http.readyState == 4 && http.status == 200) {
            var res = JSON.parse(http.responseText);
            if (sendResponse !== null) {
                console.log("Resp sent, daily sessions loaded from DB");
                sendResponse(res);
            }
            // can set globals.dailySessions here
        } else {
            console.log("Error:",http.responseText);
        }
    }
    http.send(null);
}