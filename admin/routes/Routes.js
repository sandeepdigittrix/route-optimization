/**
 * @author Sandeep Bangarh <sanbangarh309@gmail.com>
 */
'use strict';
var SBAlert = require("js-alert");
module.exports = function(app) {
  var config = require('../../config');
  var sanban = require('../../functions');
  var VerifyLogin = sanban.san_middleware;
  // var VerifyToken = require('../../auth/VerifyToken');

  app.get('/', function(req,res){
   return res.redirect('/admin/home');
  });

/* Get File Path */
  app.get('/files/:type/:img_name', function(req,res){
      var filename = req.params.img_name; console.log(filename);
      var type = req.params.type;
      var ext  = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
      if (!ext) {
        ext = 'jpg';
      }
      if (ext == 'svg') {
        ext = 'svg+xml';
      }
      var fs = require('fs');
      var imageDir = config.directory+'/uploads/'+type+'/';
           fs.readFile(imageDir + filename, function (err, content) {
                if (err) {
                    res.writeHead(400, {'Content-type':'text/html'})
                    res.end("No such File");    
                } else {
                    //specify the content type in the response will be an image
                    res.writeHead(200,{'Content-type':'image/'+ext});
                    res.end(content);
                }
            });
  });

  // app.get('/chats', function(req, res){
  //   res.render(config.directory + '/views/partials/chat', {
  //       // users: users,
  //       page: 'chat'
  //     });
  // });


  app.get('/post', function(req,res){
   res.sendFile(config.directory + '/post.html');
  });

   

  app.get('/admin/login', function(req,res){
   res.render(config.directory + '/views/login', {
      });
  });
// VerifyLogin,
  app.get('/admin/home', function(req,res){
      var exportcsv = req.session.export_to_csv;
      if (exportcsv) {
        var csvv = exportcsv;
      }else{
        var csvv = 0;
      }
      if (req.session.invalid_addr) {
        var invalid_addr = req.session.invalid_addr;
      }else{
        var invalid_addr = 0;
      }
      if (req.query.veh || req.query.vehicle == 0) {
        if (req.query.vehicle == 0) {
          var san_available = 1;
        }else{
          var san_available = req.query.veh;
        }
      }else{
        var san_available = '';
      }
      if (req.query.export) {
        var exportdata = req.query.export;
      }else{
        var exportdata = '';
      }
      //Convert(VARCHAR(10),DateCreated,101) =  Convert(Varchar(10),'2/15/2014',101)
      //var query = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id WHERE CONVERT (date, Date) >= CONVERT (date, CURRENT_TIMESTAMP);";
        var query = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId WHERE AspNetUsers.LastName !='null' and CONVERT(DATE, Orders.Date) > CONVERT(DATE, CURRENT_TIMESTAMP) ORDER BY Orders.Date ASC;";
        sanban.sanRunQuery(req,res,query, function(data){
          var address = '';
          var display_send_btn = 0;
          var today_orders = [];
          var coming_orders = [];
          Object.keys(data).forEach(function(key) {
             var crntDate = new Date();
             var newdate = new Date();
             newdate.setDate(crntDate.getDate()+1);
             var orderDate = new Date(data[key].Date);
             // console.log('Org Date:- '+crntDate);
             // console.log('New Date:- '+newdate);
             // console.log('Order Date:- '+orderDate);
             // var crntDate = new Date('2018-06-18T07:38:27.170Z');
             // var orderDate = new Date('2018-06-18T00:00:00.000Z');
            newdate = newdate.setHours(0,0,0,0);
            orderDate = orderDate.setHours(0,0,0,0);
            if (data[key].san_address != null) {
              address = data[key].san_address;
            }else if (data[key].POAddressLine1 != null) {
              address = data[key].POAddressLine1;
            }else if (data[key].SAAddressLine1 != null) {
              address = data[key].SAAddressLine1;
            }else if (data[key].PostalAddress != null && data[key].Suburb != null) {
              address = data[key].PostalAddress+' '+data[key].Suburb+' '+data[key].Postcode;
            } 
            if (data[key].assign_to !=null && data[key].assign_to !='' ) {
              display_send_btn = 1;
            }
            if (address !='') {
              data[key].address = address;
            }
            if (orderDate == newdate) {
              today_orders.push(data[key]);
            }else if(orderDate > newdate){
              coming_orders.push(data[key]);
            }
          });
          today_orders = today_orders.sort(function (a, b) {
                        return a.distance - b.distance;
          });
          var groups = {};
          console.log(today_orders.length);
          for (var i = 0; i < today_orders.length; i++) {
            if (today_orders[i].veh_address) {
              var groupName = today_orders[i].assign_to;
                if (!groups[groupName]) {
                  groups[groupName] = [];
                }
                groups[groupName].push(today_orders[i]);
              }
          }
          //console.log(groups);
          Object.keys(groups).forEach(async(key)=> {
            var vehicle_lat_lng = JSON.parse(groups[key][parseInt(groups[key].length)-1].veh_address);
            var origin = vehicle_lat_lng.lat+','+vehicle_lat_lng.lon;
            var dest = groups[key][parseInt(groups[key].length)-1].san_address;
            var wayponits = [];
            var waypts = [];
            for(var i=0;i<groups[key].length;i++){
              if (groups[key][i].Latitude && groups[key][i].Longitude) {
                 waypts.push(groups[key][i].address);
                 wayponits.push({'lat':groups[key][i].Latitude,'lng':groups[key][i].Longitude});
              }
            }
            var fin_way = wayponits.map(function (waypt) {
                return [waypt.lat,waypt.lng].join(',');
            });
             var directm = await sanban.sanGetDirectionss(origin, dest,fin_way);
             if (directm.routes) {
              console.log(directm.routes);
             }
          });
          
          sanban.sanGetAllVehicles(req,res, function(veh){
              res.render(config.directory + '/views/index', {
                today_orders:today_orders,
                coming_orders:coming_orders,
                sanKey:config.google_key,
                address_arr : JSON.stringify(today_orders),
                user_count: 2,
                display_send_btn:display_send_btn,
                vehicles : veh,
                san_available : san_available,
                invalid_addr : invalid_addr,
                exportdata : exportdata,
                csvv : csvv,
                page : 'home'
              });
          });
          
          // SBAlert.alert("Vehicle Connection Is Off!");
        });
  });

/* Test Home Data*/
    app.get('/admin/sanmap', function(req,res){
      var exportcsv = req.session.export_to_csv;
      if (exportcsv) {
        var csvv = exportcsv;
      }else{
        var csvv = 0;
      }
      if (req.session.invalid_addr) {
        var invalid_addr = req.session.invalid_addr;
      }else{
        var invalid_addr = 0;
      }
      if (req.query.veh || req.query.vehicle == 0) {
        if (req.query.vehicle == 0) {
          var san_available = 1;
        }else{
          var san_available = req.query.veh;
        }
      }else{
        var san_available = '';
      }
      if (req.query.export) {
        var exportdata = req.query.export;
      }else{
        var exportdata = '';
      }
      //Convert(VARCHAR(10),DateCreated,101) =  Convert(Varchar(10),'2/15/2014',101)
      //var query = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id WHERE CONVERT (date, Date) >= CONVERT (date, CURRENT_TIMESTAMP);";
        var query = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId WHERE AspNetUsers.LastName !='null' and CONVERT(DATE, Orders.Date) > CONVERT(DATE, CURRENT_TIMESTAMP) ORDER BY Orders.Date ASC;";
        sanban.sanRunQuery(req,res,query, function(data){
          var address = '';
          var display_send_btn = 0;
          var today_orders = [];
          var coming_orders = [];
          Object.keys(data).forEach(function(key) {
             var crntDate = new Date();
             var newdate = new Date();
             newdate.setDate(crntDate.getDate()+1);
             var orderDate = new Date(data[key].Date);
             // console.log('Org Date:- '+crntDate);
             // console.log('New Date:- '+newdate);
             // console.log('Order Date:- '+orderDate);
             // var crntDate = new Date('2018-06-18T07:38:27.170Z');
             // var orderDate = new Date('2018-06-18T00:00:00.000Z');
            newdate = newdate.setHours(0,0,0,0);
            orderDate = orderDate.setHours(0,0,0,0);
            if (data[key].san_address != null) {
              address = data[key].san_address;
            }else if (data[key].POAddressLine1 != null) {
              address = data[key].POAddressLine1;
            }else if (data[key].SAAddressLine1 != null) {
              address = data[key].SAAddressLine1;
            }else if (data[key].PostalAddress != null && data[key].Suburb != null) {
              address = data[key].PostalAddress+' '+data[key].Suburb+' '+data[key].Postcode;
            } 
            if (data[key].assign_to !=null && data[key].assign_to !='' ) {
              display_send_btn = 1;
            }
            if (address !='') {
              data[key].address = address;
            }
            if (orderDate == newdate) {
              today_orders.push(data[key]);
            }else if(orderDate > newdate){
              coming_orders.push(data[key]);
            }
          });
          today_orders = today_orders.sort(function (a, b) {
                        return a.distance - b.distance;
          });
          sanban.sanGetAllVehicles(req,res, function(veh){
              res.render(config.directory + '/views/index', {
                today_orders:today_orders,
                coming_orders:coming_orders,
                sanKey:config.google_key,
                address_arr : JSON.stringify(today_orders),
                user_count: 2,
                display_send_btn:display_send_btn,
                vehicles : veh,
                san_available : san_available,
                invalid_addr : invalid_addr,
                exportdata : exportdata,
                csvv : csvv,
                page : 'home'
              });
          });
          
          // SBAlert.alert("Vehicle Connection Is Off!");
        });
  });
// VerifyLogin,
  app.get('/admin/vehicles', function(req,res){
    sanban.sanGetAllVehicles(req,res, function(data){
      //var colors = [{'red':0,'green':0,'blue':0,'yellow':0,'orange':0,'brown':0}];
      var colors = ['red','green','blue','yellow','orange','brown'];
      req.query.types = data;
      sanban.sanGetAllVehcileType(req,res, function(types){
         if (!types || types =='not') {
           var vehcc = []; 
           var veh_types = [];
         }else{
          var vehcc = types.types;
          var veh_types = types.userdata;
         }
         console.log(types);
        res.render(config.directory + '/views/partials/vehicles', {
          vehicles:vehcc,
          types:veh_types,
          sanKey:config.google_key,
          colors:colors,
          page : 'vehicles'
        });
      });
    });
  });

  app.get('/admin/showmap', function(req,res){
    //var query = "SELECT AspNetUsers.Id,PostalAddress,Suburb,Postcode FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id WHERE CONVERT (date, Date) >= CONVERT (date, CURRENT_TIMESTAMP) GROUP BY AspNetUsers.Id,PostalAddress,Suburb,Postcode;";
    var query = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id WHERE AspNetUsers.LastName !='null' and (AspNetUsers.POAddressLine1 !='' or AspNetUsers.POCity !='' or AspNetUsers.POPostalCode !='' or AspNetUsers.POPostalCode !='' or AspNetUsers.SAAddressLine1 !='' or AspNetUsers.PostalAddress !='' or AspNetUsers.Suburb !='') and CONVERT(DATE, Orders.Date) = CONVERT(DATE, CURRENT_TIMESTAMP) ORDER BY Orders.Id DESC;";
    sanban.sanRunQuery(req,res,query, function(customer_addr){
      var new_addr_arr = []; 
      var veh_latlng_arr = [];
      var veh_latlng_arry = [];
      Object.keys(customer_addr).forEach(function(key) { 
        new_addr_arr.push(customer_addr[key].PostalAddress+' '+customer_addr[key].Suburb+' '+customer_addr[key].Postcode);
      });
      sanban.sanGetAssigningDetails(req,res,new_addr_arr,'', function(result){
          Object.keys(result).forEach(function(key) { 
            veh_latlng_arr.push(['address '+key,result[key].lat , result[key].lng,4]);
            veh_latlng_arry.push({lat:result[key].lat,lng:result[key].lng});
          });
          res.render(config.directory + '/views/partials/maps', {
            vehicles : result,
            latlngarr : JSON.stringify(veh_latlng_arr),
            ltlng : veh_latlng_arry,
            sanKey:config.google_key,
            page : 'showmap'
          });
      });
    });  
  });
// VerifyLogin,
  app.get('/admin/types', function(req,res){
      sanban.sanGetVehcileTypeById(req,res, function(detail){
        sanban.sanGetAllVehcileType(req,res, function(data){ console.log(data);
          if (!data || data =='not') {
           data = []; 
          }
          res.render(config.directory + '/views/partials/add_type', {
            vehicle_types:data,
            sanKey:config.google_key,
            edit_detail:detail ? detail : {},
            page : 'add_type'
          });
        });
      });
    // var token = req.session.token;
    // if (!token){
    //   res.render(config.directory + '/views/login', {
    //     });
    //   //return res.status(403).send({ auth: false, message: 'No token provided.' });
    // }else{
     // } 
  });

app.get('/admin/see_items', function(req, res){
  //var query = "SELECT InventoryItem_Id FROM InventoryItemApplicationUsers where ApplicationUser_Id = '2a77171b-abe8-4c6a-a15d-103b5c952ffe'";
   // var query ="ALTER TABLE vehcile_type ADD PRIMARY KEY(id)";
   //var query ="ALTER TABLE vehcile_type ALTER COLUMN id INTEGER NOT NULL";
   // var query ="SELECT * FROM PressedOrdersLive.INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Orders'";
    //var query  = "SELECT * FROM vehicles";
    //var query1 = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId INNER JOIN OrderLines ON OrderLines.OrderId=Orders.Id INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id WHERE Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
    //var query = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId WHERE Orders.Id IN(50332,50361,50945,51497,52706,52965,53073,53272,53382,53748,53952,54002,54324,54422,54423,54512,54515,54516,54517,54518,54519,54540,54573,54577,54578,54583,54589,54597,54598,54599,54600,54601,54602,54603,54604,54607,54612,54613,54614,54616,54617,54621,54624,54625,54626,54629,54630,54631,54632,54633,54634,54637,54638,54656,54663,54669,54670,54671,54674,54675,54676,54677,54678,54679,54680,54682,54683,54684,54685,54686,54687) ORDER BY Orders.Id DESC;";
    // var query = "SELECT * FROM vehcile_type";
    //var query = "SELECT * FROM route_admin";
    //var query = "TRUNCATE TABLE vehcile_type";
    var query = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId where Orders.assign_to !='' and Orders.Id IN(57502,53959) ORDER BY Orders.Id DESC;"
    sanban.sanRunQuery(req, res,query, function(data){
      res.json(data);
    });
});

app.get('/test_items', function(req, res){
  var dataStuff = [ { Do: 53614,
    Producer: 'Cottesloe Beach Hotel',
    Timeframe: '08:00 AM-10:00 AM',
    Stockist: '1500ml greens one',
    Address: '104 Marine Parade,Cottesloe,,6011',
    Routes: '104 Marine Parade,Cottesloe,,6011',
    AssignTo: 'Pressed Whole Big Fiat' },
  { Do: 53614,
    Producer: 'Cottesloe Beach Hotel',
    Timeframe: '08:00 AM-10:00 AM',
    Stockist: '1500ml orange',
    Address: '104 Marine Parade,Cottesloe,,6011',
    Routes: '104 Marine Parade,Cottesloe,,6011',
    AssignTo: 'Pressed Whole Big Fiat' },
  { Do: 53614,
    Producer: 'Cottesloe Beach Hotel',
    Timeframe: '08:00 AM-10:00 AM',
    Stockist: '1500ml seasonal apple',
    Address: '104 Marine Parade,Cottesloe,,6011',
    Routes: '104 Marine Parade,Cottesloe,,6011',
    AssignTo: 'Pressed Whole Big Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '375ml greens one',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '375ml strawberry fields',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '375ml vitamin see',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '375ml alphabet',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '330ml greens one',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' },
  { Do: 50354,
    Producer: 'Tribe West Perth',
    Timeframe: '00:00 AM-10:00 AM',
    Stockist: '330ml vitamin see',
    Address: '4 Walker avenue West Perth,West Perth,,6005',
    Routes: '4 Walker avenue West Perth,West Perth,,6005',
    AssignTo: 'Pressed Whole Small Fiat' }],
    grouped = Object.create(null);

  dataStuff.forEach(function (a) {
      grouped[a.AssignTo] = grouped[a.AssignTo] || [];
      grouped[a.AssignTo].push(a);
  });
  res.json(grouped);
  //document.write(Object.keys(grouped));
});

};

// function getRandomNumber() {

//   return new Promise(function(resolve, reject) {

//     setTimeout(function() {

//       const randomValue = Math.random();

//       const error = randomValue > .8 ? true : false;

//       if (error) {

//         reject(new Error('Ooops, something broke!'));

//       } else {

//         resolve(randomValue);

//       }

//     }, 1000);

//   }); 

// }

// async function logNumbers() {

//   for (let x = 0; x < 3; x += 1) {

//     console.log(await getRandomNumber());

//   }

// }

// logNumbers();

// async function assigningdetailss() {

//   for(let i=0;i<5;i++){
//           try{
//               const data = await sanban.sanGetDirectionss("5/24 St Quentin's Avenue,Claremont,WA,6010", "T 16 Midland Gate Shopping Centre 274 Great Eastern Highway,Midland,WA,6056");
//           }catch(err){
//               // do something with err
//               console.log(err);
//           }
//           console.log(data);
//       }
// }