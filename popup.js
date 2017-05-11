document.addEventListener('DOMContentLoaded', function () {
    
    chrome.extension.onMessage.addListener(function(message, messageSender, sendResponse) {
        if (!message.hasOwnProperty('message')) {
            document.getElementById('myapps').innerHTML = 'Sorry! Something went wrong!';
            return
        }

        if (message.message === 'getApps' && message.status === 'success') {
            var apps = message.data;
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
        else if (message.message === 'addApp' && message.status === 'success') {
            console.log(message);
            chrome.runtime.sendMessage({msg:'getApps'});
            document.getElementById('myAppsAnchor').click();
        }
        // else message.status !== 'success', error handle
        
    });

    chrome.runtime.sendMessage({msg:'getApps'});

    var addApp = document.getElementById("addApp");
    addApp.onclick = function(e) { 
        e.preventDefault();
        var data = {
            name: document.getElementById("site_name").value,
            url: document.getElementById("site_url").value
        }
        chrome.runtime.sendMessage({msg:'addApp',data: data});
    };

});
