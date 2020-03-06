    
'use strict'

const { ipcRenderer } = require('electron');
const {config}= require('../data');

var state ={
    magaza:{},
    app:{},
    sorumlu:{}
}

function initial(){
  
  state.app = config.get('app').value()
  state.sorumlu = config.get('sorumlular').find({isActive:true}).value()
  state.magaza= config.get('stokAlanlari').find({code:state.sorumlu.alancode}).value()
  var srnode = createSorumluNode(state.sorumlu);
  var sorumlulardiv = document.getElementById('sorumlular');
  sorumlulardiv.appendChild(srnode);

  document.getElementById("magaza_name").value=state.magaza.name;
  document.getElementById("magaza_code").value=state.magaza.code;
  document.getElementById("magaza_adres").value=state.magaza.adres;
  
  document.getElementById('version').innerHTML ="version : "+state.app.version
}



function confirm(){
    state.magaza.name = document.getElementById("magaza_name").value;
    state.magaza.code = document.getElementById("magaza_code").value;
    state.magaza.adres = document.getElementById("magaza_adres").value

    

    config.set({magaza:state.magaza}).write();
}

function createSorumluNode(item){
    var tile = document.createElement('div');
    tile.className="tile"
    tile.id=item.id;
    var tileicon = document.createElement('div');
    tileicon.className="tile-icon";
    var figure = document.createElement('figure');
    figure.className="avatar";
    figure.setAttribute('data-initial' ,item.name.slice(0,1))
    tileicon.appendChild(figure);
    tile.appendChild(tileicon);
    var tilecontent = document.createElement('div');
    tilecontent.className="tile-content";
    var title = document.createElement('p');
    title.className="tile-title text-bold";
    title.innerHTML=item.name
    tilecontent.appendChild(title);
    tile.appendChild(tilecontent);
    return tile

}