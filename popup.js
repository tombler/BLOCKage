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

function countUp(i,appId) {
    var count = setInterval(function () {
        i += 1000;
        document.getElementById(appId+"_active_time").innerHTML = "<b>Active Time:</b> " + msToTime(i);
    }, 1000);
}


function setAppsOnDom(apps) {
    if (apps.length > 0) {
        var html='';
        for (var i = 0; i < apps.length; i++) {
            var live_session_html = '';
            if (apps[i].in_session) {
                // Count a live session as a session
                apps[i].sessions_today++;
                apps[i].sessions_today = apps[i].sessions_today + " (in session)";
                var now = new Date();
                var active_ms = now - new Date(apps[i].session_start);
                var active_time = msToTime(active_ms);
                live_session_html += '<div id="'+apps[i].id+'_active_time"'
                live_session_html += '<b>Active Time:</b> '
                live_session_html += active_time
                live_session_html += '</div>'
                countUp(active_ms,apps[i].id);
            }
            html += '<div><b>Name:</b> '+apps[i].name+'</div>'
            html += '<div><b>URL:</b> '
            html += '<a target="_blank" href="https://'+apps[i].url+'">'
            html += apps[i].url+'</a></div>'
            html += '<div><b>Sessions Today:</b> '+apps[i].sessions_today+'</div>'
            if (live_session_html.length > 0) {
                html += live_session_html
            }
            html += '<hr>'
        };
        document.getElementById('myapps').innerHTML = html;
    } else {
        var html = '<div><b>You are not tracking any sites right now.<br>Try adding one!</b></div>';
        document.getElementById('myapps').innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', function () {

    // as soon as DOM loads, grab the user's apps and set them in popup.html
    chrome.runtime.sendMessage({msg:'getApps'},function(resp) {
        console.log(resp);
        if (resp.status === 'success') {
            setAppsOnDom(resp.data);
        }
    });

    var addApp = document.getElementById("addApp");
    addApp.onclick = function(e) { 
        e.preventDefault();
        var data = {
            name: document.getElementById("site_name").value,
            url: document.getElementById("site_url").value
        }
        chrome.runtime.sendMessage({msg:'addApp',data: data},function(resp) {
            // in background.js: 
                // app will be added to DB
                // if success, getUserApps(userid,true) will run, retrieving user apps from DB
                // if success from ^^, response will be sent here, and we click DOM element to display 
            if (resp.status === 'success') {
                setAppsOnDom(resp.data);
                document.getElementById('myAppsAnchor').click();
            }
        });
    };

});
