/**
 * @author Sandeep Bangarh <sanbangarh309@gmail.com>
 */
 var express = require('express');
 var router = express.Router();
 var bodyParser = require('body-parser');
 router.use(bodyParser.urlencoded({ extended: true }));
 router.use(bodyParser.json());
 var fs = require('fs');

 var config = require('../../config');
 var sanban = require('../../functions');
 var sess;

 /* Login User */
 router.post('/login', function(req, res) {
  sess=req.session;
  var username = req.body.username;
  var pwd = req.body.password;
  var query = "SELECT * FROM route_admin where username='"+username+"' and password='"+pwd+"'";
  sanban.sanDoLogin(req,res,query, function(result){
    if (result =='found') {
      sess.token = username;
      return res.redirect('home');
    }else{
      return res.redirect('login');
    }
  });
});


 /* Add Vehicle Type */
 router.post('/add_type', function(req,res){
  if (req.body.edit_id) {
    var set = '';
    if (req.body.name) {
      set += "name='"+req.body.name+"'san@ban";
    }
    if (req.body.capacity) {
      set += "capacity='"+req.body.capacity+"'san@ban";
    }
    if (req.body.available) {
      set += "available='"+req.body.available+"'san@ban";
    }
    if (req.body.available_from) {
      set += "available_from='"+req.body.available_from+"'san@ban";
    }
    if (req.body.available_to) {
      set += "available_to='"+req.body.available_to+"'san@ban";
    }
    if (req.body.s_available_from) {
      set += "s_available_from='"+req.body.s_available_from+"'san@ban";
    }
    if (req.body.s_available_to) {
      set += "s_available_to='"+req.body.s_available_to+"'san@ban";
    }
    strVal = set.split('san@ban').join(',').slice(0, -1);
    var sql = "UPDATE vehcile_type SET "+strVal+" where id = "+req.body.edit_id;
  }else{
    var values = [];
    /* Generate unique id */
    var _sym = '1234567890',
    uniqueid = '';

    for(var i = 0; i < 8; i++) {
      uniqueid += _sym[parseInt(Math.random() * (_sym.length))];
    }
    // values.push("'"+uniqueid+"'");
    /**********************/
    Object.keys(req.body).forEach(function(key) {
      var val = req.body[key];
      values.push("'"+val+"'");
    });
    var sql = "INSERT INTO vehcile_type (name, capacity, available, available_from, available_to, s_available_from, s_available_to) VALUES ("+values.join(',')+")";
  }
  console.log(sql);
  sanban.sanInsertQuery(req,res,sql, function(result){
    if (result !='not') {
          //res.json(result);
          return res.redirect('types');
        }else{
        //res.json(result);
        return res.redirect('types');
      }
    });
});
 /* Add Vehicle Type */
 router.get('/get_types', function(req,res){
  var sql = "SELECT * FROM vehcile_type";
  sanban.sanRunQuery(req,res,sql, function(result){

    if (result.message !='err') {
      if (result[0].name) {
        return res.redirect('add_type');
      }
    }else{
      return res.redirect('add_type');
    }
  });
});

 /* Logout*/
 router.get('/logout',function(req,res){
  req.session.destroy(function(err) {
    return res.redirect('/login');
  })
});
 router.get('/assign_single_vehicle', function(req, res){
  var sql = require('mssql');
  var order_id = req.query.order_id;
  var name = req.query.veh_name;
  var san_address = req.query.san_address;
  var color = req.query.san_color;
  var dest = {lat: req.query.san_lat, lon: req.query.san_lng};
  var query = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId INNER JOIN OrderLines ON OrderLines.OrderId=Orders.Id INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id WHERE Orders.Id = "+order_id+" ORDER BY Orders.Id DESC;";
  sanban.sanRunQuery(req,res,query, function(order){
    var new_addr_arr = [];
    var address = ''; 
    if (order) {
     if (order[0].san_address && order[0].san_address != null) {
       address = order[0].san_address;
     } 
     if (address !='') {
       var geodist = require('geodist');
       var NodeGeocoder = require('node-geocoder');
       var geocoder = NodeGeocoder(config.options);
       geocoder.geocode(address, function(err, data) {
        var lat = data[0].latitude; 
        var lng = data[0].longitude;
        var current_loc = {lat: lat, lon: lng};
        var distance = geodist(current_loc, dest, {exact: true, unit: 'km'});
        var update = "UPDATE Orders SET assign_to = '"+name+"',distance='"+distance+"',color='{san@ban}',veh_address='"+JSON.stringify(dest)+"' where Id='"+order_id+"'";
        sanban.sanUpdateOrderWithVehicle(name,update,order[0],function(resss){
          if (resss !='not') {
            return res.redirect('/admin/home');
          }else{
            return res.redirect('/admin/home?veh=1');      
          }
        });
      });
     }
   }else{
     res.json({'msg':'customer not exist'});
   } 
 });
});

 /* Assign Vehicles */
// WHERE CONVERT (date, Orders.EndTime) <= CONVERT (date, CURRENT_TIMESTAMP)
router.get('/assign_vehicle', function(req, res){
  var order_ids = req.query.order_ids;
  var query1 = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId WHERE Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
  var query2 = "SELECT * FROM vehicles INNER JOIN vehcile_type ON vehicles.type = vehcile_type.id";  
  sanban.sanRunPromises(req,res,query1,query2, function(customer_addr){
    var new_addr_arr = [];
    var new_ids = [];
    var dates = [];
    var address = '';
    Object.keys(customer_addr[0]).forEach(function(key) { 
      if (customer_addr[0][key].san_address != null) {
        address = customer_addr[0][key].san_address;
      }
      if (address !='' && !new_ids.includes(customer_addr[0][key].Id)) {
        new_addr_arr.push(address);
        new_ids.push(customer_addr[0][key].Id);
        dates.push(customer_addr[0][key].Date);
      }
    });
    // sanban.san_UpdateDistancee(customer_addr[0]);
    if (new_addr_arr.length > 0 ) {
      sanban.sanGetAssigningDetails(req,res,new_addr_arr,new_ids,customer_addr[1],dates, function(result){
        if (result.length >0 ) {
          return res.redirect('/admin/home');
        }else{
          return res.redirect('/admin/home?vehicle=0');
        }
      });
    }else{
      res.json({'msg':'customer not exist'});
    }
    
  });
});
/*******************/

/* Add Deleveries */
router.get('/send_orders', function(req, res){
  var order_ids = req.query.order_ids;
  var query = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN OrderLines ON OrderLines.OrderId=Orders.Id INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId where Orders.assign_to !='' and Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
  var query1 = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId where Orders.assign_to !='' and Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
  sanban.sanRunPromises(req,res,query,query1, function(data){ 
  // sanban.sanRunQuery(req,res,query, function(data){
    var new_order = [];
    var grouped = Object.create(null);
    /*******************************/
    var groups = {};
    for (var i = 0; i < data[0].length; i++) {
      var groupName = data[0][i].Id[0];
      if (!groups[groupName]) {
        groups[groupName] = [];
      }
      var items = {'sku':groupName,'qty':data[0][i].Quantity,'desc':data[0][i].Name};
      //data[i].items = items; 
      groups[groupName].push(items);
    }
    Object.keys(data[1]).forEach(function(key) {
      data[1][key].items = groups[data[1][key].Id[0]];
    });
    //res.json(data[1]);
    sanban.sanaddDeliveries(data[1]);
  });

});
/*******************/

/* Clear Assignments */
router.get('/clear_all_assigns', function(req, res){
  sanban.sanClearAssignments(function(reult){
    return res.redirect('/admin/home');
  });
});
router.post('/clear_assigns', function(req, res){
  var orderid = req.body.orderid;
  sanban.sanClearAssign(orderid);
  res.json('done');
});
/*******************/

/* Save Vehicle Color */
router.post('/save_color', function(req, res){
  sanban.sanSelectVehiclesFromDb(req, res, function(chk){
    if (chk.length > 0 && chk !='not') {
      var sql = "UPDATE vehicles SET color='"+req.body.color+"' WHERE name='"+req.body.veh_name+"'";
    }else{
      var sql = "INSERT INTO vehicles (name, color) VALUES ('"+req.body.veh_name+"','"+req.body.color+"')";    
    }
    sanban.sanRunQuery(req,res,sql, function(result){
      if (result !='not') {
        res.json({msg:'done'});
      }else{
        res.json({msg:'failed'});
      }
    });
  });
});
/**********************/
router.get('/download_csv', function(req, res){
 var http = require("http");
 fs.readdir(config.directory+'/uploads/orders/', function (err, files) {
    //handling error
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    } 
    file_links = [];
      //listing all files using forEach
      files.forEach(function (file) {
        file_links.push('http://work4brands.com/route-opt/uploads/orders/'+file+'.zip'); 
      });
      var header = {
        "Content-Type": "application/x-zip",
        "Pragma": "public",
        "Expires": "0",
        "Cache-Control": "private, must-revalidate, post-check=0, pre-check=0",
        "Content-disposition": 'attachment; filename="' + file + '"',
        "Transfer-Encoding": "chunked",
        "Content-Transfer-Encoding": "binary"
      };


      res.writeHead(200, header);
      res.end();
      // http.get(url, function(response) {
      //   response.on('data', function (data) {
      //     fs.appendFileSync(tmpFilePath, data)
      //   });
      //   response.on('end', function() {
      //      zip.extractAllTo(dbconfig.directory+'/uploads/orders/' + uniqid());
      //      fs.unlink(tmpFilePath);
      //   })
      // });
    });
});

router.get('/export_ro_csv',async (req, res, next) => {
  var order_ids = req.query.order_ids;
  var query = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN OrderLines ON OrderLines.OrderId=Orders.Id INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId where Orders.assign_to !='' and Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
  var query1 = "SELECT *,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId where Orders.assign_to !='' and Orders.Id IN("+order_ids+") ORDER BY Orders.Id DESC;";
  console.log(query1);
  sanban.sanRunPromises(req,res,query,query1,async (data) => { 
  // sanban.sanRunQuery(req,res,query, function(data){
    var new_order = [];
    var grouped = Object.create(null);
    /*******************************/
    var groups = {};
    for (var i = 0; i < data[0].length; i++) {
     var groupName = data[0][i].Id[0];
     if (!groups[groupName]) {
       groups[groupName] = [];
     }
	  //var items = {'Quantity':data[0][i].Quantity,'Price':data[0][i].Price,'Name':data[0][i].Name};
	  //data[i].items = items; 
    groups[groupName].push(data[0][i].Name);
  }


	// console.log(groups);
	// myArray = [];
	// for (var groupName in groups) {
	//   myArray.push({group: groupName, color: groups[groupName]});
	// }
  /*******************************/
  for(let i=0;i<data[1].length;i++){
    var veh_address = JSON.parse(data[1][i].veh_address);
      // try{
      //   var dist = await sanban.sanGetDirectionss(veh_address.lat+','+veh_address.lon, data[1][i].san_address);
      // }catch(err){
      //   var dist = '';
      // }
      var dist = 12.00;
      if (data[1][i].StartTime && data[1][i].EndTime && data[1][i].san_address) {
        var start = sanban.sanDateAmPm(data[1][i].StartTime[0]);
        var end = sanban.sanDateAmPm(data[1][i].EndTime[0]);
        var address = data[1][i].san_address.replace(/,/g, " ");
        var id = data[1][i].Id[0];
        var new_colms = {'Do':data[1][i].Id[0],'Producer':data[1][i].CafeName,'Timeframe':start+'-'+end,'Stockist':data[1][i].CafeName,'Items':JSON.stringify(groups[id].join(',')),'Address':address,'AssignTo':data[1][i].assign_to,'Distance':data[1][i].distance};
        new_order.push(new_colms);
      }
    }
    var new_order = new_order.sort(function (a, b) {
      return a.Distance - b.Distance;
    });
    //var new_order = new_order.sort(sanban.san_SortDistance);
    if (new_order.length > 0 ) {
      new_order.forEach(function (a) {
        grouped[a.AssignTo] = grouped[a.AssignTo] || [];
        grouped[a.AssignTo].push(a);
      });

      if (grouped != null && grouped != undefined && grouped) {
        // Object.keys(grouped).forEach(async (key) => {
        //   var wayponits = [];
        //   var waypts = [];
        //   var limit_arr = [];
        //   var limit_arrr = [];
        //   for(let i=0;i<grouped[key].length;i++){
        //     if(grouped[key][i] && waypts.indexOf(grouped[key][i].Address) == -1 && grouped[key][i].Address){
        //       waypts.push(grouped[key][i].Address);
        //       wayponits.push(grouped[key][i].Address); 
        //     } 
        //     // if(grouped[key][i] && waypts.indexOf(grouped[key][i].address) == -1 && i > 23 && i < 45 && grouped[key][i].san_address){
        //     //   waypts.push(grouped[key][i].address);
        //     //   limit_arr.push({
        //     //      location: grouped[key][i].address,
        //     //      stopover: true
        //     //    });
        //     // }
        //     // if(grouped[key][i] && waypts.indexOf(grouped[key][i].address) == -1 && i > 45 && grouped[key][i].san_address){
        //     //   waypts.push(grouped[key][i].address);
        //     //   limit_arrr.push({
        //     //      location: grouped[key][i].address,
        //     //      stopover: true
        //     //    });
        //     // }
        //   }
        
        //   try{
        //     var dist = await sanban.sanGetDirectionss(grouped[key][parseInt(grouped[key].length)-1].veh_address.lat+','+grouped[key][parseInt(grouped[key].length)-1].veh_address.lon, grouped[key][parseInt(grouped[key].length)-1].Address,wayponits);
        //   }catch(err){
        //     var dist = '';
        //   }
        //   //console.log(dist);
        // });

// {location: value[i].address,stopover: true}
      sanban.sanExportOrders(req, res, grouped,function(uid){
        var file_url = 'http://work4brands.com/route-opt/uploads/orders/'+uid+'.zip';
        setTimeout(() => sanban.san_RemoveFilesInDir(config.directory+'/uploads/orders/'), 5000);
        return res.redirect(file_url);
      });
    } 
  }else{
    return res.redirect('/admin/home?export=0');
  } 
});
});
/* Save Vehicle */
router.post('/saveVehicle',function(req,res){
  var name = req.body.veh_name;
  var type = req.body.type_id;
  var lt = req.body.lat;
  var lng = req.body.lng;
  var status = req.body.status;
  // res.json(req.body);
  // console.log(req.body);
  sanban.sanSelectVehiclesFromDb(req, res, function(chk){

    if (chk.length > 0 && chk !='not') {
      var sql = "UPDATE vehicles SET type='"+type+"' WHERE name='"+name+"'";
      
    }else{
      //var sql = "SELECT * FROM AspNetUsers";
      var sql = "INSERT INTO vehicles (name, type) VALUES ('"+name+"','"+type+"')";

    }
    
    sanban.sanRunQuery(req,res,sql, function(result){
            //console.log(result);
            if (result !='not') {
                //res.json(result);
                return res.redirect('vehicles');
              }else{
                res.json({msg:'failed'});
                return res.redirect('vehicles');
              }
            });
  }); 
});


/* Save Routes */
router.post('/save_routes',function(req,res){
  var orderid = req.body.orderid;
  var start = req.body.start;
  var end = req.body.end;
  var veh_name = req.body.veh_name;
  var route = {'start':start,'end':end}
  var sql = "UPDATE Orders SET route='"+type+"' WHERE name='"+name+"'";
  // sanban.sanRunQuery(req,res,sql, function(result){
  //     if (result !='not') {
  //         res.json({msg:'done'});
  //     }else{
  //         res.json({msg:'failed'});
  //     }
  // });
});
//sanban.san_new_function();
module.exports = router;