function setAppsOnDom(apps) {
    if (apps.length > 0) {
        var html=''
        for (var i = 0; i < apps.length; i++) {
            html += '<div><b>Name:</b> '+apps[i].name+'</div>'
            html += '<div><b>URL:</b> '
            html += '<a target="_blank" href="https://'+apps[i].url+'">'
            html += apps[i].url+'</a></div>'
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
