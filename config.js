/**
 * @author Sandeep Bangarh <sanbangarh309@gmail.com>
 */
// config.js
//live key:- fde5338ece92999ac5884c048a185da9d2b502fed2bd2073
//test key:- 8e0aa09b1be583e04d7085587e443102c65f5dc97b673c46
// google key :- AIzaSyA4pGSa51pb6pzRdYL6H9Xd1ILF5TAiXCg
// googl key 2 :- AIzaSyABUgL0EM0WtQY0OXjgEz4eowfVk-raUeo
module.exports = {
  'secret': 'sandeep@bangarh',
  'google_key': 'AIzaSyA80WnFcr6zjZhO-QQ-2GiGHONXt3jGMbA',
  'google_key2': 'AIzaSyABUgL0EM0WtQY0OXjgEz4eowfVk-raUeo',
  'API_KEY' : 'AIzaSyAVG5g641cEjGsw3-g4G9awP9Z_dc0ltpk',
  'DETRACK_LIVE_KEY' : 'fde5338ece92999ac5884c048a185da9d2b502fed2bd2073',
  //'DETRACK_TEST_KEY' : '8e0aa09b1be583e04d7085587e443102c65f5dc97b673c46',
  'directory': __dirname,
  'all_veh' : 'https://app.detrack.com/api/v1/vehicles/view/all.json',
  'add_del' : 'https://app.detrack.com/api/v1/deliveries/create.json',
  'options' :  {
    provider: 'google',
    httpAdapter: 'https', 
    apiKey: 'AIzaSyA80WnFcr6zjZhO-QQ-2GiGHONXt3jGMbA', 
    formatter: null         
  },
  'google_config' :{
      "key": "AIzaSyA80WnFcr6zjZhO-QQ-2GiGHONXt3jGMbA",
      "secure": true
    },
  'test_config': {
      user: 'potest',
      password: 'potest!',
      server: 'choose4use.com', 
      database: 'polive1204',
   
      options: {
          encrypt: true 
      }
  },
  'config': {
      user: 'PWApp@qne6f4he68',
      password: '!QAZ2wsx',
      server: 'qne6f4he68.database.windows.net', 
      database: 'PressedOrdersLive',
      options: {
          encrypt: true 
      }
  },
  'tedconfig': {
      userName: 'potest',
      password: 'potest!',
      server: 'choose4use.com', // You can use 'localhost\\instance' to connect to named instance
      options: {
          database: "PressedOrders_Test1", // Use this if you're on Windows Azure
          rowCollectionOnRequestCompletion: true,
          rowCollectionOnDone: false
      },
      port: 2200
  },
   sanMail : function(req, res) {
        
    }
  // 'client' : require('@google/maps').createClient({
  //     key: 'AIzaSyA80WnFcr6zjZhO-QQ-2GiGHONXt3jGMbA',
  //     Promise: Promise
  //  })
};
