const { remote } = require('electron');
const {db,config}= require('../../data');


var close = document.getElementById("close")

close.addEventListener( "click", e => {
    var window = remote.getCurrentWindow()
    window.close()
   } )

function giris(){
    var name = document.getElementById('kullanici_adi').value
    var password = document.getElementById('parola').value

    config.get('sorumlular').find({name:name, password:password}).assign({isActive:true}).write()

    var window = remote.getCurrentWindow()
    window.close()
}