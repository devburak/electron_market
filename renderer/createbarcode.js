'use strict'

const {db,config}= require('../data');
var flatpickr = require("flatpickr");
const TR = require("flatpickr/dist/l10n/tr").default.tr;
const fs = require('fs')
var print = require('print-js')
const { remote } = require('electron');

var state ={
    sahip:{},
    urunler:{},
    urun:{},
    barcodetip:'urun',
    magaza:{},
    user:{},
    conf:{
        addName:true,
        addSTT:true,
        STT:'12/12/2020'
    }
}

function openModal() {
  let win = new remote.BrowserWindow({
    parent: remote.getCurrentWindow(),
    modal: true,
    
    transparent: true, frame: false
  })

  var theUrl = 'file://' +remote.app.getAppPath()+'/component/modal/login.html'
  console.log('url', theUrl);

  win.loadURL(theUrl);
}

const today =new Date( new Date().getFullYear(),new Date().getMonth(), new Date().getDate())

flatpickr("#STT", {
  dateFormat: "d/m/Y",
  minDate: "today",
  "locale": TR,
  defaultDate : today
});
  function urunlerLoading(value){

    document.getElementById("urunler_loading").style.display= value?'inherit':'none'
  }

  function tartiloading(value){
    document.getElementById("tarti_loading").style.display= value?'inherit':'none'
  }

function initial(){ 
   state.sahip = config.get('sahip').value()
   state.urunler = db.get('products').value()
   state.user = config.get('sorumlular').find({isActive:true}).value()

   if(!state.user) {
    openModal()
   }
    document.getElementById("sahip_name").value = state.sahip.name
    document.getElementById("uretici_cod").value = state.sahip.code
    document.getElementById("ulke_cod").value = state.sahip.trcode
    var sel = document.getElementById('urunler');
  
    state.conf.STT = document.getElementById('STT').value
    state.urunler.map((x,index)=>{
    
        var opt = document.createElement('option');
        opt.appendChild( document.createTextNode(x.name) );
        opt.value=x.code
        sel.appendChild(opt); 
        if(index===0) {
         document.getElementById('createbarcode_prcode').value = x.code 
         state.urun =x
         createBarcode()
        }
        
      })

}

function print() {
    
        if(state.barcodetip === 'urun') {
      const c = document.getElementById("urunbarcode");
     print('urunbarcode','html') 
    }
    else if(state.barcodetip ==='tarti'){
      print('tartibarcode','html') 
    }
    
}


function barcodetipchange(input){
    if(input.value ==='tarti')
        {
            document.getElementById("urun_panel").style.display = "none";
            document.getElementById("tarti_panel").style.display = "inherit";
            state.barcodetip = 'tarti'
        }
        else{
            document.getElementById("urun_panel").style.display = "inherit";
            document.getElementById("tarti_panel").style.display = "none";
            state.barcodetip = 'urun'
        }
        state.barcodetip = input.value;
}

function urunlerChange(){
    var urunler = document.getElementById('urunler');
    console.log(urunler.options[urunler.selectedIndex])
    document.getElementById('createbarcode_prcode').value = urunler.options[urunler.selectedIndex].value

    state.urun = db.get('products').find({code: urunler.options[urunler.selectedIndex].value}).value();
    console.log(state.urun)
    createBarcode()

}
function createbarcode_miktarChange(value){
    value = ("00000" +value).slice(-5)
    
     document.getElementById('createbarcode_miktar').value = value
     createBarcode()
  }

  function  createBarcode(){
    if(state.barcodetip==='urun') {
        urunlerLoading(true);
        
        const code = state.sahip.trcode+ state.sahip.code + '0'+ state.urun.code
      
       
       JsBarcode("#urunbarcode", code, {
            format: "ean13",
            height:50,
            marginTop:40,
            displayValue: true
          }); 
    if(state.conf.addName){
       var canvas = document.getElementById("urunbarcode");
       var ctx = canvas.getContext("2d");
       ctx.textAlgin="left"
       ctx.font = "18px Arial";
       ctx.fillText(state.urun.name.substr(0,20),-100,18);
    }
    if(state.conf.addSTT){
        var canvas = document.getElementById("urunbarcode");
       var ctx = canvas.getContext("2d");
       ctx.textAlgin="start"
       ctx.font = "bold  14pt Arial";
       ctx.fillText('STT: ' + state.conf.STT,-100,39);
    }
     
    } else if(state.barcodetip==='tarti' ) {
      tartiloading(true);
      const miktar = document.getElementById('createbarcode_miktar').value
      const code = state.user.alancode + state.urun.code +miktar

      console.log('code ' , code)
     JsBarcode("#tartibarcode", code, {
          format: "ean13",
          height:50,
          marginTop:40,
          flat:true,
          displayValue: true
        }); 

        if(state.conf.addName){
          var canvas = document.getElementById("tartibarcode");
          var ctx = canvas.getContext("2d");
          ctx.textAlgin="left"
          ctx.font = "18px Arial";
          ctx.fillText(state.urun.name.substr(0,20),-100,18);
       }
       if(state.conf.addSTT){
           var canvas = document.getElementById("tartibarcode");
          var ctx = canvas.getContext("2d");
          ctx.textAlgin="start"
          ctx.font = "bold  14pt Arial";
          ctx.fillText('STT: ' + state.conf.STT,-100,39);
       }

    }
    
    tartiloading(false)
    urunlerLoading(false);
   
  
  }

  function STTchange(){
      state.conf.addSTT= document.getElementById("addSTT").checked
      console.log( state.conf.addSTT)
      if(!state.conf.addSTT){
          console.log('here')
        document.getElementById("sttdiv").style.display="none"
      }
      else
      document.getElementById("sttdiv").style.display="inherit"

      createBarcode()
  }
  function addnamechange(input){
    state.conf.addName = input.checked
    createBarcode()
  }
  function sttdatechange(input){
      console.log(input.value)
      state.conf.STT = input.value
      createBarcode()
  }
  function download_barcode(el){
  if(state.barcodetip==='urun') {
    var canvas = document.getElementById("urunbarcode");
    var image = canvas.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    el.href = image;
  }
  else if(state.barcodetip==='tarti') {
    var canvas = document.getElementById("tartibarcode");
    var image = canvas.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
    el.href = image;
  }
  }