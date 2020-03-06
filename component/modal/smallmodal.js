
const { remote } = require('electron');


var close = document.getElementById("close")

close.addEventListener( "click", e => {
    var window = remote.getCurrentWindow()
    window.close()
   } )

function initial(){
    
    var currentWindow = remote.getCurrentWindow();
    console.log(currentWindow.args)
    const {title='başlık',content,footer='<p></p>'} = currentWindow.args
    document.getElementById("footer").innerHTML = footer 
    document.getElementById("footer").innerHTML = content;
    document.getElementById("title").value= title;


}
  