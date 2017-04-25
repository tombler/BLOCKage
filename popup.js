// This is all we need if we want the functionality of the CMS in the extension.
// To implement this instead of ajax, uncomment basicExtension() in setDomContent() && comment out searchButton click function.
// function basicExtension () {
//     var frame = document.createElement('iframe');
//     frame.setAttribute('width', '500px');
//     frame.setAttribute('height', '500px');
//     frame.setAttribute('frameborder', '0');
//     frame.setAttribute('id', 'search-results');
//     frame.setAttribute('src', 'http://cmsdart.local:8888/app');
//     document.body.appendChild(frame);
// }

// dom variables
function setDomContent(labelText) {

  // basicExtension();
  // var status = document.getElementById('status');
  var translateButton = document.getElementById('translate');
  var input = document.getElementById('textToTranslate');
  
  // status.textContent = labelText;
  translateButton.addEventListener('click', function (e) {
        emptyResults();
        xhr(input.value);
  });
}

function emptyResults() {
    
    var output = document.getElementById('output');
    if (output) {
        document.body.removeChild(output);
    }
}

function xhr(searchText) {

    var data = null;
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    // Add event listener for error message
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        parseResults(this.responseText);
        return;
      }
    });

    var url = "https://translate.yandex.net/api/v1.5/tr.json/translate?key=trnsl.1.1.20160415T025414Z.f02fe494eff89f99.fd64e2a5a6ffcf9c6d5db5be89ffee9aa4ddfeea&text=" + searchText + "&lang=en-es";

    xhr.open("GET", url);
    xhr.setRequestHeader("cache-control", "no-cache");
    xhr.send(data);
}


function parseResults(response) {
    var responseObj = JSON.parse(response);
    // Put search results into popup DOM, hidden
    // var el = document.getElementById('results-hidden');
    // el.innerHTML = response;
    // // Search popup DOM for all search results, build html for results to display
    // var displayHtml = "";
    // var results = document.querySelectorAll(".search-result");
    // for (var i=0; i<results.length; i++) {
    //     displayHtml += "<div style='border: 3px solid black; margin: 10px; height=100px;'>";
    //     displayHtml += results[i].innerHTML;
    //     displayHtml += "</div>"
    // }
    showResults(responseObj.text);
    saveResults(responseObj);
}

function showResults(translatedText) {
    var resultsEl = document.createElement('div');
    resultsEl.setAttribute('id', 'output');
    resultsEl.innerHTML = translatedText;
    document.body.appendChild(resultsEl);
}

function saveResults(results) {
    // Open a port to send saved results to background.js
    var port = chrome.runtime.connect({name:"savedResults"});
    port.postMessage({result:results});
} 

document.addEventListener('DOMContentLoaded', function() {
    setDomContent("Search for an artist: ");
});