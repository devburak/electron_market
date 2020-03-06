'use strict'
const { ipcRenderer } = require('electron');
const { webContents,BrowserWindow} = require('electron');

 const utils= require('../component/charutils');

var Chart = require('chart.js');
const {db,config}= require('../data');
var flatpickr = require("flatpickr");
var print = require('print-js')
// require("./node_modules/flatpickr/dist/flatpickr.min.css");
// require("./node_modules/flatpickr/dist/flatpickr.dark.min.css");
const TR = require("flatpickr/dist/l10n/tr").default.tr;



db.defaults({ products: [], customer: [], fis: [], satis:[] }).write()

// buraya bak

var state = {
  prevPage: 'ekran1',
  fis: [],
  satisTipi:"Nakit",
  total:0,
  iskontoRate :0,
  iskontoReal:0,
  fisno:0,
  locationCode : 101,
  sahip:{},
  yeniurunbarkod:'',
  updateurunbarkod:'',
  urunchange:{},
  updateproducthaserror : false,
  stokAlanlari:[],
}


const today =new Date( new Date().getFullYear(),new Date().getMonth(), new Date().getDate())

flatpickr("#basicDate", {
  mode: "range",
  dateFormat: "d-m-Y",
  "locale": TR,
  defaultDate : today
});


function initial(){
  document.getElementById('page').innerHTML ="Ana Ekran";
  state.prevPage= 'ekran1';
   state.sahip = config.get('sahip').value()
   state.yeniurunbarkod=''
}

function back(){
  changeEkran(state.prevPage);
}
async function printfis(){

  const fis =  document.getElementById('fis_col');

 print('fis_col','html')
}

function fisNoCreate(){
  // var canvas = document.createElement("canvas");
  if(state.fisno !=0)
  JsBarcode("#fisbarcode", state.fisno, {
    format: "code128",
    height: 40,
    textPosition:"top",
    displayValue: true
  });
  else { 
    document.getElementById('fisbarcode').innerHTML=''  
}
}
function createbarcode_miktarChange(value){
  value = ("00000" +value).slice(-5)
  
   document.getElementById('createbarcode_miktar').value = value
  createBarcodeForProduct()
}

function createBarcodeForProduct (){
  var code = state.locationCode;

  var  miktar= document.getElementById('createbarcode_miktar').value;
  var productCode = document.getElementById('createbarcode_prcode').value;

  if(miktar.length == 5 && productCode.length ==4 ) {
  code += productCode + miktar;
  JsBarcode("#prbarcode", code, {
    format: "ean13",
    height: 80,
    flat:true,
    displayValue: true
  }); 
} 
}

function colorize(opaque, hover, ctx) {
  var v = ctx.dataset.data[ctx.dataIndex];
  var c = v < -50 ? '#D60000'
    : v < 0 ? '#F46300'
    : v < 50 ? '#0358B6'
    : '#44DE28';
  var opacity = hover ? 1 - Math.abs(v / 150) - 0.2 : 1 - Math.abs(v / 150);
  return opaque ? c : utils.transparentize(c, opacity);
}
function hoverColorize(ctx) {
  return colorize(false, true, ctx);
}

function satisraporuGetir(){
  var raporDateRange = document.getElementById("basicDate").value;
  var fisNo = document.getElementById("fisno").value
  
  var dates = raporDateRange.split(' - ');
  var firstDate = dates[0].split('-');
  var satislar = [];
  if(dates.length >1)
  var secondDate = dates[1].split('-');

  if(fisNo.length ===13){    
    if (dates.length > 1) {

      var f1 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0])
      var f2 = new Date(secondDate[2], secondDate[1] - 1, secondDate[0])
      satislar = db.get('satis').filter(x => (f1 < new Date(x.Date) && f2 > new Date(x.Date) && x.timestamp == fisNo)).value()
    }
    else if (dates.length == 1 && dates[0] !== "") {
      var f1 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0])
      var f2 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0] + 1)
      satislar = db.get('satis').filter(x => (f1 < new Date(x.Date) && f2 > new Date(x.Date) && x.timestamp == fisNo)).value()
    }
    else {
      
      satislar = db.get('satis').filter(x => (x.timestamp == fisNo)).value()
    }
 
  }
  else if (raporDateRange !==""){
    
    if (dates.length > 1) {
      var f1 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0])
      var f2 = new Date(secondDate[2], secondDate[1] - 1, secondDate[0])
     
      satislar = db.get('satis').filter(x => (f1 < new Date(x.Date) && f2 > new Date(x.Date) )).value()
    }
    else if (dates.length == 1) {
      var f1 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0])
      var f2 = new Date(firstDate[2], firstDate[1] - 1, firstDate[0] + 1)
      satislar = db.get('satis').filter(x => (f1 < new Date(x.Date) && f2 > new Date(x.Date) )).value()
    }
  }

  else  satislar = db.get('satis').filter().value()
  
  var fisList = document.getElementById("fisList");
  fisList.innerHTML ="";
  var total = 0
  var rapor_urun = [];
  var html = satislar.map(x => {
    x.fis.map (f=>{
      console.log(f.code)
      var node = {code:"",name:"",t_miktar:0,t_price:0}

      if(rapor_urun.find(e=>e.code == f.code)){
        rapor_urun.find(e=>{
          e.code == f.code
        e.t_miktar += parseFloat( (parseInt(f.adet) * parseFloat(f.miktar)))
        e.t_price += parseFloat(f.fiyat)
        return e
      } )
      } 
      else {
        node.code = f.code;
        node.name = f.name;
        node.t_miktar =parseFloat( (parseInt(f.adet) * parseFloat(f.miktar)))
        node.t_price =  parseFloat(f.fiyat) 
        rapor_urun.push(node)
      }
    })
    total += x.total
    fisList.appendChild(createFisNode(x))
  });

  console.log(rapor_urun) 

  var labels = [];
  var data = [];
  var tooltip = [];
  rapor_urun.map(x=>{
    labels.push(x.name)
    data.push(x.t_price)
    tooltip.push(x.name +''+ Math.round(x.t_price*100/total))
  })
  var data = {
      labels: labels,
      tooltips:{callbacks:{label:tooltip}},
      datasets: [{
        label: 'Toplam Satış (TL)',
        backgroundColor: ["#3e95cd", "#8e5ea2","#3cba9f","#e8c3b9","#c45850"],
        data:data,
        
      }]
    
  }
  var options = {
    title: {
      display: false,
      text: 'Toplam Satış (TL)'
    },
    tooltips:{callbacks:{
      label:(item,data) =>data['datasets'][0]['data'][item['index']] + ' TL',
      afterLabel: (item,data)=>{
        var dataset = data['datasets'][0];
        var percent = Math.round((dataset['data'][item['index']] / total) * 100)
        return '( %' + percent + ' )';
      }
    }},
  };
  

  console.log(rapor_urun)
    if(total !=0)
    document.getElementById('rapor_total').innerHTML = '<div class="toast toast-primary">Toplam : <strong> '+total.toFixed(2)+'</strong> TL </div>'
   if(rapor_urun.length !=0){
    var chart = new Chart('chart-0', {
      type: 'horizontalBar',
      data: data,
      options: options
    });
   }

}

function startTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  h= checkTime(h);
  m = checkTime(m);
  s = checkTime(s);
  document.getElementById('clock').innerHTML =
  h + ":" + m + ":" + s;
  var t = setTimeout(startTime, 500);
}
function checkTime(i) {
  if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
  return i;
}

function satisTemizle(){
  state = { 
    fis: [],
    satisTipi:"Nakit",
    total:0 ,
    fisno:0,
  }
    document.getElementById("adet").value =1
    document.getElementById('list').innerHTML ='';
    document.getElementById('total').innerHTML = '';
    document.getElementById('nakit').checked=true;
    document.getElementById("barcode").value='';
    document.getElementById("barcode").focus();
    document.getElementById('create_barcode').style.display ='none'
  
}

function displayCreateBarcode(){
  document.getElementById('create_barcode').style.display ='inherit';
  var sel = document.getElementById('urunler');
  var urunler = db.get('products').value();
  urunler.map((x,index)=>{
    
    var opt = document.createElement('option');
    opt.appendChild( document.createTextNode(x.name) );
    opt.value=x.code
    sel.appendChild(opt); 
    if(index===0)  document.getElementById('createbarcode_prcode').value = x.code
  })
 
}

function urunlerChange(){
  var urunler = document.getElementById('urunler');
  console.log(urunler.options[urunler.selectedIndex])
  document.getElementById('createbarcode_prcode').value = urunler.options[urunler.selectedIndex].value
}

function satis(){
if(state.fis.length>0 || state.fisno !=0) {
  db.get('satis').push({
    fis : state.fis,
    satisTipi: state.satisTipi,
    total:parseFloat(state.total),
    iskonto: parseInt(state.iskontoRate),
    totaliskonto : parseFloat(state.iskontoReal),
    Date:Date(),
    timestamp: Date.now(),
    fisno: state.fisno
  }).write();
  satisTemizle();
}else {
  alert ("satış için en az bir ürün girilmesi gereklidir.")
}
}

function createFisNode(item){
  var div = document.createElement('div');
  div.id = item.timestamp;
  var input = document.createElement('input');
  input.type = 'checkbox'
  input.id= item.timestamp +'_acc';
  input.setAttribute('hidden','');

  var label = document.createElement('label')
  label.setAttribute('class','accordion-header')
  label.setAttribute('for',item.timestamp +'_acc')
  label.innerHTML = '<i class="icon icon-arrow-right mr-1"></i>';
  var bdy = document.createElement('div');
  bdy.className ="accordion-body";

 
  label.insertAdjacentHTML('beforeend',"Fiş No: "+ item.timestamp+" Fiyat :  <strong>"+item.total+"</strong>" ) ;
  
  div.appendChild(input);
  div.setAttribute('class','accordion');
  div.appendChild(input);
  div.appendChild(label);
  
  var ul = document.createElement('ul');
  item.fis.map(x=>{
    var li =document.createElement('li');
    li.innerHTML = x.adet +' adet '+ x.name + ' '+ x.fiyat +' TL';
    ul.appendChild(li);
  })
  bdy.appendChild(ul);
  
  div.appendChild(bdy);
  return div
}

// function gunlukSatis(){
//  var gunlukSatis= db.get('satis').filter(x=>today <new Date(x.Date)).value()
// }


  document.getElementById('newProduct').addEventListener('submit', (evt) => { 
      // prevent default refresh functionality of forms
  evt.preventDefault();
    const isPacked = evt.target.isPacked.checked
  var fiyat =0;
    try {
      fiyat=  parseFloat(evt.target.fiyat.value)

    }
    catch(e){
      alert('Bir ürünün fiyatı rakamlardan oluşmalı ve ondalık kısım nokta ile yazılmalıdır, 10.01 gibi lütfen kontrol ediniz.' , e)
    }
    var code = db.get('products').find({code:evt.target.code.value}).value()
    
    if(code !== undefined) alert('Bu ürün kodu ile bir ürün kayıtlı : '+ code.name)
    else if(evt.target.name.value =='' || evt.target.code.value == '' || evt.target.fiyat.value == '')
    alert('Bir ürünün fiyatı,adı veya kodu olmadan tanımlayamazsınız lütfen bu alanları kontrol ediniz.')
    else if( isNaN(evt.target.fiyat.value) && isFinite(evt.target.fiyat.value))
    alert('Bir ürünün fiyatı rakamlardan oluşmalı ve ondalık kısım nokta ile yazılmalıdır, 10.01 gibi lütfen kontrol ediniz.')
    else{
      fiyat= parseFloat(evt.target.fiyat.value)
    db.get('products').push({
      name:evt.target.name.value,
      slug:evt.target.slug.value,
      code:evt.target.code.value,
      birim: evt.target.birim.value,
      isPacked:evt.target.isPacked.checked,
      barkod:state.yeniurunbarkod,
      netagirlik:evt.target.netagirlik.value,
      fiyat:parseFloat(fiyat)
    }).write() }
  })

  function oninputFiyat (val){
    if(val.includes(',')){
     val= val.replace(',', '.');
    } 
    else if(val.includes('.'))
    val = val.slice(0,val.indexOf('.')+1) + val.slice(val.indexOf('.')+1,val.indexOf('.')+3);
    document.getElementById('fiyat').value = val
  }

  // document.getElementById('main').addEventListener('click', (evt) =>{
  //   console.log('main clicked')
  //     changeEkran('ekran1')
  // })
  
//   document.getElementById('barcode').addEventListener('change', (evt) =>{
//  console.log(evt)
// })
function isPackedChange(input){

}
function codeChange(input){
 
  input = ("0000" +input).slice(-4)
   document.getElementById('code').value = input

  var code = db.get('products').find({code:input}).value()
 
  if(code){
    document.getElementById('code_hint').innerText= code.name 
    document.getElementById('code_form').className ="form-group has-error"
  }else{
    document.getElementById('code_hint').innerText=''
    document.getElementById('code_form').className ="form-group"
  }
 
  yeniurunbarcodeCreate()

}

function yeniurunbarcodeCreate(){

  const code= state.sahip.trcode+ state.sahip.code + '0'+ document.getElementById('code').value
    

     const bar= JsBarcode("#yeniurunbarkod", code, {
           format: "ean13",
           height:50,
           displayValue: true
         });
         var encoded = bar._encodings[0].map(x=>x.text);
         state.yeniurunbarkod = encoded.join("");
         document.getElementById('button_group').style.display='flex'

}
function download_barcode(el){ 
  var canvas = document.getElementById("yeniurunbarkod");
  var image = canvas.toDataURL("image/png").replace(/^data:image\/[^;]/, 'data:application/octet-stream');
  el.href = image;
}
function satisTipiChange (input){
  if(input.value==="Açık Satış") alert("müşteri seçme opsiyonları gelecek bu demoda henüz yok");
  state.satisTipi = input.value
  

}
function iskontoChange(val){
 
  if(isNaN(val) || val==='') return alert('iskonto değeri % üzerinden bir sayı değeri olmalı');
  state.iskontoRate = parseInt(val);
  priceCalculate();
}

function barcodeChange(val){
 
  var adet = parseInt( document.getElementById("adet").value ) || 1;
  if(val.length===13){
   var sirketkodu = val.slice(0,3);
   var uruncodu = val.slice(3,7);
   var agirlik = parseInt( val.slice(7,12));
   var control = val.slice(12,13);
    if (state.fisno ==0) state.fisno = Date.now();
   //örnek barkod : 1230111004501
   

   var urun = db.get('products').find({code:uruncodu}).value();
   var TXT = 'ürün alınamadı';
   var fis ={};
    fis.adet = adet;
    fis.barcode = val
   if(urun){
    fis.name =urun.name 
    fis.birim = urun.birim
    fis.code = urun.code
    if(urun.birim === 'KG') {
    TXT = urun.name + ' '+ adet +'  X ' + (agirlik /1000).toFixed(3) + ' Kg,   ' + ((agirlik /1000)* urun.fiyat * adet ).toFixed(2) + ' TL'
    fis.fiyat = parseFloat((agirlik /1000)* urun.fiyat * adet ).toFixed(2) ;
    fis.miktar = parseFloat(agirlik /1000).toFixed(3);
  }
    else if(urun.birim === 'Litre'){
    TXT = urun.name + ' '+ adet +'  X ' + (agirlik /100).toFixed(3) + ' lt, fiyat : ' + ((agirlik /100)* urun.fiyat * adet ).toFixed(2)  + ' TL'
    fis.fiyat = parseFloat((agirlik /100)* urun.fiyat * adet ).toFixed(2) ;
    fis.miktar = parseFloat(agirlik /100).toFixed(3) 
  }
    else if(urun.birim === 'Adet'){
    TXT = urun.name + ' '+ adet +'  X ' + agirlik  + ' tane, fiyat : ' + (agirlik * urun.fiyat * adet).toFixed(2) + ' TL'
    fis.fiyat = parseFloat(agirlik * urun.fiyat *adet).toFixed(2) ;
    fis.miktar =parseInt(agirlik)
    
}

  state.fis.push(fis)
 priceCalculate();
}
   var ul = document.getElementById("list");
   var li = document.createElement("li");
   li.id = ul.getElementsByTagName("li").length;
   li.onclick = function() { deleteFromList(li); };
   li.appendChild(document.createTextNode(TXT));
   ul.appendChild(li);

  }
}
function priceCalculate(){
  var res = 0;
  if (state.fis.length == 0 ) {
    state.total = 0;
    state.fisno = 0;
  }
  state.fis.map((x)=> 
  {
    res = res +parseFloat( x.fiyat)
    state.total = res.toFixed(2);
    
  })
  fisNoCreate();

  if(state.iskontoRate !== 0 ){
    state.iskontoReal = (state.iskontoRate * state.total /100 ).toFixed(2);
    state.total =( state.total - state.iskontoReal).toFixed(2)
    document.getElementById('total').innerHTML = '<p> iskonto % '+state.iskontoRate + '<strong> - '+ state.iskontoReal + ' TL</strong> <p>' + '<p><strong>Toplam : '+ state.total + ' TL</strong><p>'}
  else
  document.getElementById('total').innerHTML = '<p><strong>Toplam : '+ state.total + ' TL</strong><p>'

}

function deleteFromList(li){
  var ul = document.getElementById("list");
  var lis = ul.getElementsByTagName('li');
  if (state.fis.length == 0 ) {
    state.total = 0;
    state.fisno = 0;
  }
  var index = 0;
  for (var i = 0; i < lis.length; ++i) { 
    if(lis[i]===li) index = i
  }
  state.fis.splice(index,1)
  console.log(state.fis)
  console.log(index)
  ul.removeChild(li);
 priceCalculate();
}
function urunduzenle(code){
  
  var urun = db.get('products')
  .find({ code: code }).value()
  state.urunchange = urun
  document.getElementById("updateproductname").value = urun.name
  document.getElementById("updateproductslug").value = urun.slug
  document.getElementById("updateproductcode").value = urun.code
  document.getElementById("updateproductfiyat").value = urun.fiyat
  document.getElementById("updateproductnetagirlik").value = urun.netagirlik || ""
  document.getElementById("updateproductbirim").value = urun.birim
  document.getElementById("updateproductisPacked").checked = urun.isPacked || false
}

function ekran6initialize(){
  var urunler = db.get('products').value()
  var ul = document.getElementById("urunmenulist");
  ul.innerHTML = '<p></p>'
  urunler.map((urun,index)=>{
  

    var li =  document.createElement('li')
    
    var a = document.createElement('a');
    var p = document.createElement('p');
    p.className ="form-input-hint"
    a.id=index
    a.style="cursor: pointer;"
    p.style ="margin:0"
    a.setAttribute("onclick", "urunduzenle('"+urun.code+"')") ;
    li.className="menu-item"
    a.innerText = urun.name
    li.id ="urunmenuitem_" + urun.code
    p.innerText = urun.code +( urun.isPacked? ' - '+ urun.netagirlik + ' ' + urun.birim : ' - ' +urun.slug);

    a.appendChild(p)
    li.appendChild(a)
    ul.appendChild(li)

    // <p class="form-input-hint">The name is invalid.</p>
  })
  
}


function updateproductbarkod(){

  const code= state.sahip.trcode+ state.sahip.code + '0'+ document.getElementById('updateproductcode').value
    

     const bar= JsBarcode("#updateproductbarkod", code, {
           format: "ean13",
           height:50,
           displayValue: true
         });
         var encoded = bar._encodings[0].map(x=>x.text);
         state.updateurunbarkod = encoded.join("");
}

function updatecodeChange(input){
  input = ("0000" +input).slice(-4)
   document.getElementById('updateproductcode').value = input

  var code = db.get('products').find({code:input}).value()
  
  if(code){
    state.updateproducthaserror = false
    if(code.code == state.urunchange.code){
      document.getElementById('updateproductcode_hint').innerText=code.name
      document.getElementById('updateproductcode_form').className ="form-group"
    }else{
      state.updateproducthaserror = true
    document.getElementById('updateproductcode_hint').innerText= code.name 
    document.getElementById('updateproductcode_form').className ="form-group has-error"}
  }else{
    state.updateproducthaserror = false
    document.getElementById('updateproductcode_hint').innerText=''
    document.getElementById('updateproductcode_form').className ="form-group"
  }
  updateproductbarkod()
}

document.getElementById('updateproduct').addEventListener('submit', (evt) => {
  // prevent default refresh functionality of forms
  evt.preventDefault();
  if (state.updateproducthaserror) {
    alert('Lütfen olmayan bir ürün kodu seçin')
  }
  else if( isNaN(evt.target.updateproductfiyat.value) && isFinite(evt.target.updateproductfiyat.value)){
    alert('Bir ürünün fiyatı rakamlardan oluşmalı ve ondalık kısım nokta ile yazılmalıdır, 10.01 gibi lütfen kontrol ediniz.')
  }
  else {
    var fiyat= parseFloat(evt.target.updateproductfiyat.value)
    db.get('products')
      .find({ code:state.urunchange.code})
      .assign({ 
        name:evt.target.updateproductname.value,
        slug:evt.target.updateproductslug.value,
        code:evt.target.updateproductcode.value,
        birim: evt.target.updateproductbirim.value,
        isPacked:evt.target.updateproductisPacked.checked,
        barkod:state.updateurunbarkod,
        netagirlik:evt.target.updateproductnetagirlik.value,
        fiyat:parseFloat(fiyat)

      })
      .write()
        ekran6initialize()
        
  }

})

function add_Stok_To_Alan(code){
  document.getElementById('Stok_Alani_Adi').value = ''
  document.getElementById('Stok_Alani_Nitelik').value = 'Mağaza'
  ekran4initialize()
  document.getElementById('stok_alanlari_urun').style.visibility='inherit'
  document.getElementById('add_stok_button').onclick = function(){
    addStok(code)
  }
  document.getElementById('namebutton_'+code).className = "btn btn-success active col-8"
 

}
function stok_urun_select_change(input){
  console.log(input.value)
  var selectedurun =  db.get('products').find({code:input.value}).value()
  document.getElementById("Stok_urun_miktar_addon").innerText = selectedurun.isPacked? 'Paket Sayısı :' : 'Miktar :'
}
function addStok(alancode){
  
  var date = new Date()
  var uruncode = document.getElementById('Stok_urun').value;
  
  var gerekce = document.getElementById('Stok_urun_gerekce').value;
  var miktar = document.getElementById('Stok_urun_miktar').value;
  var sorumlu =(({name,alancode}) => ({name,alancode})) (config.get('sorumlular').find({isActive:true}).value())
  db.get('stock').push({
    timestamp: Date.now(),
    date: date.toLocaleString(),
    stokAlaniCode:alancode,
    uruncode:uruncode,
    miktar:parseFloat(miktar),
    sorumlu:sorumlu
  }).write()

}

function getCurrentStock(){

}

function stok_alani_edit(code){
 
  ekran4initialize()
  
    var stok_alani = config.get('stokAlanlari').find({code:code}).value();
    document.getElementById('Stok_Alani_Adi').value = stok_alani.name
    document.getElementById('Stok_Alani_Nitelik').value = stok_alani.nitelik
  document.getElementById('editbutton_'+code).className = "btn btn-success s-circle float-right"
  document.getElementById('stok_alani_update_onay').innerText ="Güncelle"
  document.getElementById('stok_alani_update_onay').onclick = function(){
    stok_alani_update_onay(code)
  }
}
function stok_alani_update_onay(code){
  var name = document.getElementById('Stok_Alani_Adi').value
  var nitelik = document.getElementById('Stok_Alani_Nitelik').value
  config.get('stokAlanlari').find({code:code})
  .assign({
      name:name,
      nitelik:nitelik
  }).write()
  document.getElementById('Stok_Alani_Adi').value = ''
  document.getElementById('Stok_Alani_Nitelik').value = 'Mağaza'
  ekran4initialize()
}
function stok_alani_yeni(){

  var name = document.getElementById('Stok_Alani_Adi').value
  if(!name){
    return alert('Bir isim girmeniz gereklidir')
  }
  var nitelik = document.getElementById('Stok_Alani_Nitelik').value
 var last= config.get('stokAlanlari')
 .sortBy('code')
 .reverse()
 .take(1)
 .value()

 var newcode =( parseInt(last[0].code) + 1).toString()

 newcode =  ("000" + newcode).slice(-3)

   config.get('stokAlanlari').push({
    code:newcode,
    name:name,
    nitelik:nitelik
  }).write()
  
  ekran4initialize()
  document.getElementById('Stok_Alani_Adi').value = ''
  document.getElementById('Stok_Alani_Nitelik').value = 'Mağaza'
}

function stok_alani_delete(code){
  config.get('stokAlanlari')
  .remove({ code:code})
  .write()
  ekran4initialize()
}

function ekran4initialize(){
  document.getElementById('stok_alani_update_onay').innerText ="Onay"
  document.getElementById('stok_alani_update_onay').onclick = function(){
    stok_alani_yeni()
  }
  document.getElementById('stok_alanlari_urun').style.visibility='hidden'
  var stokAlanlari =  config.get('stokAlanlari').value()
  state.stokAlanlari = stokAlanlari
  var cont = document.getElementById('stok_alanlari')
  cont.innerHTML =''
  
  //sol taraf doldur
  stokAlanlari.map((alan,index)=>{
    var div = document.createElement('div');
    div.className ="columns";
    var column = document.createElement('div')
    column.className = "column"
    var buttonforname = document.createElement('button');
    buttonforname.id="namebutton_" +alan.code
    buttonforname.className = "btn btn-link active col-8";
    buttonforname.innerText = alan.name
    buttonforname.onclick = function(){ add_Stok_To_Alan(alan.code)}
    
    var buttonforEdit = document.createElement('button')
    buttonforEdit.id="editbutton_"+alan.code
    buttonforEdit.className = "btn active s-circle float-right"
    buttonforEdit.onclick= function (){stok_alani_edit(alan.code)}
    var icon = document.createElement('i')
    icon.className="icon icon-edit"

    buttonforEdit.appendChild(icon)

    var buttonfordelete = document.createElement('button')
    buttonfordelete.id="deletebutton_" +alan.code
    buttonfordelete.className = "btn s-circle float-right"
    buttonfordelete.onclick = function(){
      stok_alani_delete(alan.code)
    }
    var icondelete = document.createElement('i')
    icondelete.className="icon icon-delete"

    buttonfordelete.appendChild(icondelete)
    
    column.appendChild(buttonforname)
    column.appendChild(buttonforEdit)
    column.appendChild(buttonfordelete)
    div.appendChild(column)
   cont.appendChild(div)
  })

 //sağ Taraf 
 var urunler = db.get('products').value()

 var select = document.getElementById('Stok_urun')
 select.innerHTML=''
 urunler.map((urun,index)=>{
   var option = document.createElement('option')
   option.value = urun.code
   option.innerText = urun.name + ' ' +  urun.code +( urun.isPacked? ' - '+ urun.netagirlik + ' ' + urun.birim : ' - ' +urun.slug)
    select.appendChild(option)
 })

 
}
//bütün ekranların initialize funksiyonları



  function changeEkran(ekran){
    for(var i=1;i<10;i++){
      var id='ekran' +i 
      if( document.getElementById(id).style.display == 'inherit'){  
         state.prevPage=id 
        
        }
    }
    switch (ekran) {
        case 'ekran1': document.getElementById('ekran1').style.display ='inherit'
        document.getElementById('page').innerHTML ="Ana Ekran"
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran2': document.getElementById('ekran2').style.display ='inherit'
        document.getElementById('page').innerHTML ="Satış"
        document.getElementById("barcode").focus();
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran3': document.getElementById('ekran3').style.display ='inherit'
        document.getElementById('page').innerHTML ="Raporlar"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran4': document.getElementById('ekran4').style.display ='inherit'
        ekran4initialize()
        document.getElementById('page').innerHTML ="Stok Girişi"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran5': document.getElementById('ekran5').style.display ='inherit'
        document.getElementById('page').innerHTML ="Satış"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran6': document.getElementById('ekran6').style.display ='inherit'
        ekran6initialize()
        document.getElementById('page').innerHTML ="Ürün Düzenle"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran7': document.getElementById('ekran7').style.display ='inherit'
        document.getElementById('page').innerHTML ="Yeni Ürün"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran8': document.getElementById('ekran8').style.display ='inherit'
        document.getElementById('page').innerHTML ="Yeni Ürün"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
        break;
        case 'ekran9': document.getElementById('ekran9').style.display ='inherit'
        document.getElementById('page').innerHTML ="Yeni Ürün"
        document.getElementById('ekran1').style.display ='none'
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        break;
        default:  document.getElementById('ekran1').style.display ='inherit'
        document.getElementById('page').innerHTML ="Ana Ekran"
        document.getElementById('ekran2').style.display ='none'
        document.getElementById('ekran3').style.display ='none'
        document.getElementById('ekran4').style.display ='none'
        document.getElementById('ekran5').style.display ='none'
        document.getElementById('ekran6').style.display ='none'
        document.getElementById('ekran7').style.display ='none'
        document.getElementById('ekran8').style.display ='none'
        document.getElementById('ekran9').style.display ='none'
    }
  }