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
    var html='';
    var analytics_opts_html = '';
    if (apps.length > 0) {
        for (var i = 0; i < apps.length; i++) {

            // build html for any sessions that are currently live
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
            
            // display common name and url
            html += '<div><b>Name:</b> '+apps[i].name+'</div>'
            html += '<div><b>URL:</b> '
            html += '<a target="_blank" href="https://'+apps[i].url+'">'
            html += apps[i].url+'</a></div>'
            html += '<div><b>Sessions Today:</b> '+apps[i].sessions_today+'</div>'
            if (live_session_html.length > 0) {
                html += live_session_html
            }
            html += '<hr>'

            // add the app to the select box options in analytics tab
            analytics_opts_html += '<option value="'+apps[i].id+'">'
            analytics_opts_html += apps[i].name+'</option>'
        }
    } else {
        html = '<div><b>You are not tracking any sites right now.<br>Try adding one!</b></div>';
        analytics_opts_html += '<option>No apps available</option>';
    }
    document.getElementById('myapps').innerHTML = html;
    document.getElementById('analytics_app').innerHTML = analytics_opts_html;
}

function setChartsOnDOM(chartData) {
    var line_colors = [
        'rgba(255,99,132,1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)'
    ];
    // as soon as DOM loads, grab daily session data for past week and load into a chart
    for (var i = 0; i < chartData.datasets.length; i++) {
        chartData.datasets[i].fill = false;
        chartData.datasets[i].borderColor = line_colors[i];
        chartData.datasets[i].borderWidth = 3;
    };
    // console.log(chartData);

    var ctx = document.getElementById("dailySessions");
    var myChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            scales: {
                yAxes: [{
                  ticks: {
                    beginAtZero: true,
                    stepSize: 1
                  }
                }]
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', function () {

    // to-do: combine all DOM-load messages into a single message sent to background.js

    // as soon as DOM loads, grab the user's apps and set them in popup.html
    chrome.runtime.sendMessage({msg:'getApps'},function(resp) {
        if (resp.status === 'success') {
            setAppsOnDom(resp.data);
        }
    });
    
    chrome.runtime.sendMessage({msg:'getCharts'},function(resp) {
        if (resp.status === 'success') {
            console.log(resp.data);
            setChartsOnDOM(resp.data);
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
                document.getElementById("site_name").value = '';
                document.getElementById("site_url").value = '';
                setAppsOnDom(resp.data);
                document.getElementById('myAppsAnchor').click();
            }
        });
    };

    var getAnalytics = document.getElementById("getAnalytics");
    getAnalytics.onclick = function(e) { 
        e.preventDefault();
        console.log("retrieving analytics....");
    };

});
