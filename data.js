const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('db.json')
const db = low(adapter)

const configAdapter = new FileSync('config.json');
const config = low(configAdapter);


    // Set some defaults (required if your JSON file is empty)
    // initialize with todos or empty array
    db.defaults({ products: [], customer: [], fis: [], satis:[] })
  .write()
 
  config.defaults({
    sahip:{name:'',code:'',trcode:''},
    magaza:{name:'',code:0,adres:''},
    sorumlular:[{name:'',password:''}],
    stokAlanlari:[{name:'',code:'',nitelik:''}],
    app:{version:'1.0.1',published:'2019',author:'Burak İmrek'}
}).write()
 


module.exports ={db,config};