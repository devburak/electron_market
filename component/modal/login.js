const { remote } = require('electron');

var close = document.getElementById("close")

close.addEventListener( "click", e => {
    var window = remote.getCurrentWindow()
    window.close()
   } )