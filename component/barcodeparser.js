
const {db,config}= require('../data');

const Parse =function(code){
    var tipcode = code.substring(0,3);
    if(tipcode == "869"){
        console.log('barkodlu ürün')
    }
    else{
        console.log('tartılmış ürün')
    }
}

function CreateTartiCode(locationcode,uruncode,miktar){
    return new Promise(function(resolve,reject){

    })
}

module.exports ={Parse}