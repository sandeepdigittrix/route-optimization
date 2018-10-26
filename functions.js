/**
 * @author Sandeep Bangarh <sanbangarh309@gmail.com>
 */
"use strict"
var dbconfig = require('./config');
var https = require("https");
var Promise = require("bluebird");
var sql = Promise.promisifyAll(require("mssql"));
global.using = Promise.using;
var Request = require('request');
var Client = require('node-rest-client').Client; // Get the rest client that will be used to send the request
var Api_Request = new Client();
var moment = require('moment');
var fs = require('fs'),
_ = require('underscore');
var sess;
var geodist = require('geodist');
/****test*****/
// var assert = require('assert'),
// GoogleMapsAPI = require('./admin/map/map'),
// config = dbconfig.google_config;
// var gm = new GoogleMapsAPI(config);
/************/

/* Google Client */
// var san_Google = dbconfig.client;
/*******End *****/
/* Asynchronous Functions */
const san_new_function = async () => {
   var ids = ['55270','55980'];
   for(let i=0;i<ids.length;i++){
	          try{
	              // var data = await module.exports.sanGetDirectionss("5/24 St Quentin's Avenue,Claremont,WA,6010", address[i]);
	            var data = await module.exports.sanGetInventoryItemss(ids[i]);
	          }catch(err){
	            var data = '';    
	            console.log(err);
	          }
	          console.log(data);
	  }
}

/* Export Orders */
const san_UpdateDistance = async (data) => {
	for(let i=0;i<data.length;i++){
			 // var veh_address = JSON.parse(data[i].veh_address);
			  try{
	             var dist = await module.exports.sanGetDirectionss(data[i].Latitude+','+data[i].Longitude, data[i].san_address);
	           }catch(err){
	            var dist = '';
	          }
	          console.log(parseFloat(dist));
	          if (dist) {
	          	  var update = "UPDATE Orders SET distance='"+parseFloat(dist)+"' where Id='"+data[i].Id[0]+"'";
			      var result = await module.exports.sanRunPromiseQuery(update);
			      data[i].distance = parseFloat(dist);
	          }
	}
	return data;
}
/* Export Orders */
const san_UpdateDistancee = async (data) => {
	        for(let i=0;i<data.length;i++){
				  try{
		             var dist = await module.exports.sanGetDirectionss(data[i].Latitude+','+data[i].Longitude, data[i].san_address);
		           }catch(err){
		            var dist = '';
		          }
		          console.log(parseFloat(dist));
		          if (dist) {
		          		
		          		var update = "UPDATE Orders SET distance='"+parseFloat(dist)+"' where Id='"+data[i].Id[0]+"'";
				      	module.exports.sanRunPromiseQuery(update);
		          }
		          data[i].distance = parseFloat(dist);
			}
	
	return data;
}
/*End*/
/************************/

module.exports = {
	sanRunPromises : function(req, res,query1,query2, callback){
		var final_arr = [];
    	new sql.ConnectionPool(dbconfig.config).connect().then(pool => {
		  	return pool.request().query(query1)
		  	.then( rows => {
		        let someRows = rows.recordset;
		        final_arr.push(someRows);
		        return pool.request().query(query2);
		    } )
		    .then( rows => {
		        let otherRows = rows.recordset;
		        final_arr.push(otherRows);
		    } )
		    .then( () => {
		        callback(final_arr);
		        sql.close();
		    } );
		  })
    },

    sanGetInvDetails : function(req, res){
		var final_arr = [];
		var inventory_items = [];
		var query1 = "SELECT distinct Orders.Id,AspNetUsers.*,concat(AddressLine, ',', City,',',Region,',',PostalCode) as san_address FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN Locations ON Locations.Id=Orders.LocationId WHERE AspNetUsers.LastName !='null' and Orders.Id= 50328 ORDER BY Orders.Date ASC;";
    	new sql.ConnectionPool(dbconfig.config).connect().then(pool => {
		  	return pool.request().query(query1).then(function(orders){
		          return orders.recordset;
		    });
		});
    },

	sanRunQuery : function(req, res,query, callback) {
		  /* Remote Connection */
      	  new sql.ConnectionPool(dbconfig.config).connect().then(pool => {
		  	return pool.request().query(query)
		  }).then(result => {
		    let rows = result.recordset
		    callback(rows);
		    sql.close();
		  }).catch(err => {
		  	callback({ message: err});
		    sql.close();
		  });
    },
    sanInsertQuery : function(req, res,query, callback){
    	sql.connect(dbconfig.config, function (err) {
    
	        if (err) console.log(err);

	        // create Request object
	        var request = new sql.Request();
	        // query to the database and get the records
	        request.query(query, function (err, recordset) {
	            if (err) {
	            	callback('not');
	            }
	            if (recordset && recordset.length <= 0) {
	            	callback('not');
	            }else{
	            	callback(recordset);
	            }
	            // send records as a response
	            sql.close();
	        });
	    });
    },

    sanDeleteQuery : function(req, res,query, callback){
    	sql.connect(dbconfig.config, function (err) {
    
	        if (err) console.log(err);

	        // create Request object
	        var request = new sql.Request();
	           console.log(query);
	        // query to the database and get the records
	        request.query(query, function (err, recordset) {
	            
	            if (err) console.log(err)

	            // send records as a response
	            callback(recordset);
	            
	        });
	    });
    },

    sanDoLogin : function(req, res, query, callback){
    	module.exports.sanRunQuery(req, res,query, function(result){
    		if (result.length > 0) {
    			callback('found');
    		}else{
    			callback('not_found');
    		}
    	});
    },

    sanAddVehcileType : function(req, res, query, callback){
    	module.exports.sanInsertQuery(req, res,query, function(result){
    		if (result.length > 0) {
    			callback(result);
    		}else{
    			callback('not');
    		}
    	});
    },

    sanGetAdressofCustomer : function(req, res, callback){
    	  var query = "SELECT PostalAddress,Suburb,Postcode FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id LEFT JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id WHERE CONVERT (date, Date) >= CONVERT (date, CURRENT_TIMESTAMP);";
	      sanban.sanRunQuery(req,res,query, function(data){
	         callback(data);
	      });
    },

    /* Function to get Inventory Id */
    sanGetInventoryIds : function(req, res, callback){
    	// 2a77171b-abe8-4c6a-a15d-103b5c952ffe
    	var query = "SELECT InventoryItem_Id FROM InventoryItemApplicationUsers where ApplicationUser_Id = '"+req.id+"'";
    	module.exports.sanRunQuery(req, res,req.query, function(result){
    		if (result.length > 0) {
    			callback('found');
    		}else{
    			callback('not_found');
    		}
    	});
    },
    sanGetAssigningDetails : function(req, res,addr,ids,vehh_data,dates, callback){
    	sess=req.session;
    	sess.invalid_addr = 0;
    	var NodeGeocoder = require('node-geocoder');
    	var geocoder = NodeGeocoder(dbconfig.options);
    	geocoder.batchGeocode(addr, function (err, data) {
		  // Return an array of type {error: false, value: []}
		  module.exports.sanGetAllVehicles(req, res, function(veh_data){
		  	var looping = 0;
		  	var dist_array = [];
		  	var cust_veh_array = [];
		  	var vehicle_avail = ''; 
		  	Object.keys(data).forEach(function(key) { 	
		  		if (data[key].value && data[key].value.length > 0 && data[key].value !=null && !data[key].error) {
		  			var lat = data[key].value[0].latitude;
			  		var lng = data[key].value[0].longitude;
			  		var id = ids[key];
			  		var order_date = dates[key];
			  		var current_loc = {lat: lat, lon: lng};
			  		Object.keys(veh_data).forEach(function(key) {
			          var dest = {lat: veh_data[key].lat, lon: veh_data[key].lng};
			          // console.log('customer:- '+JSON.stringify(current_loc));
			          // console.log('vehicle:- '+JSON.stringify(dest));
			          var distance = geodist(current_loc, dest, {exact: true, unit: 'km'});
			       //    try{
				      //       var distt = module.exports.sanGetDirectionss(veh_data[key].lat+','+veh_data[key].lng,lat+','+lng);
				      // }catch(err){
				      // 	     var distt = '';
				      //       // do something with err
				      //       console.log(err);
				      // }
				      // console.log(distt);
			          var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              		  var day = days[order_date.getDay()];
              		  Object.keys(vehh_data).forEach(function(key2) {
              		  	if (vehh_data[key2].name[0] == veh_data[key].name) {
              		  		 var time = module.exports.sanDateAmPm(new Date());
              		  		 var currentTime= moment(time, "HH:mm a");
              		  		 var startTime = moment(vehh_data[key2].available_from, "HH:mm a");
  							 var endTime = moment(vehh_data[key2].available_to, "HH:mm a");

  							  /* Second Shift */
  							 var startTime1 = moment(vehh_data[key2].s_available_from, "HH:mm a");
  							 var endTime1 = moment(vehh_data[key2].s_available_to, "HH:mm a");
  							 var currentTime1 = currentTime;
  							 if ( (startTime1.hour() >=12 && endTime1.hour() <=12 ) || endTime1.isBefore(startTime1) )
								{
									endTime1.add(1, "days");       // handle spanning days endTime
									if (currentTime1.hour() <=12 )
									{
										currentTime1.add(1, "days");       // handle spanning days currentTime
									}
								}
  							 /****************/

  							 if ( (startTime.hour() >=12 && endTime.hour() <=12 ) || endTime.isBefore(startTime) )
								{
									endTime.add(1, "days");       // handle spanning days endTime

									if (currentTime.hour() <=12 )
									{
										currentTime.add(1, "days");       // handle spanning days currentTime
									}
								}
							
              		  		var isBetween = currentTime.isBetween(startTime, endTime);
              		  		var isBetween1 = currentTime1.isBetween(startTime1, endTime1);
         //      		  		console.log(currentTime1);console.log(startTime1);console.log(endTime1);
  							// console.log(isBetween1);
  							// console.log('next start');
  							// console.log(currentTime1);console.log(startTime1);console.log(endTime1);
  							// console.log(isBetween1);
              		  		if (veh_data && ids && vehh_data[key2].available.includes(day) && isBetween) {
					          cust_veh_array.push({'cust_id':id,'vehicle_name':veh_data[key].name,'distance':distance,'lat_lng':dest,'color':vehh_data[key2].color,'cust_ltlng':current_loc});	
					        }else if(veh_data && ids && vehh_data[key2].available.includes(day) && isBetween1){
					          cust_veh_array.push({'cust_id':id,'vehicle_name':veh_data[key].name,'distance':distance,'lat_lng':dest,'color':vehh_data[key2].color,'cust_ltlng':current_loc});
					        }else{
					          vehicle_avail = 1; 
					          veh_data[key].dist_from_cust = distance;	
					        }
              		  	}
              		  });
              		});	
		  		}else{
		  			sess.invalid_addr = 1;
		  		}
		      	// Math.min.apply(Math,each_cust_array)
		      	// dist_array.push(each_cust_array);
		  	});
			if (ids) { 
				if (cust_veh_array.length > 0 ) {
					var values = cust_veh_array.sort(function (a, b) {
						  return (a.distance < b.distance) ? -1 : 1;
					});	
					var obj = [];
					var chkids = [];
					var orderids = [];
					var customer = [];
					for ( var i=0; i < values.length;i++ ){
						if (chkids && !orderids.includes(values[i]['cust_id'][0])) {
							orderids.push(values[i]['cust_id'][0]);
							chkids.push(values[i]['cust_id'][1]);
							obj.push(values[i]);
						}
					}
					var deldata = []; 
					module.exports.sanQueryLoop(chkids,orderids,obj, function(resultt){
						callback(resultt);
					});
				}else{
					callback([]);
				}
			}else{
			  	var values = veh_dta.vehicles.sort(function (a, b) {
				    return (a.dist_from_cust < b.dist_from_cust) ? -1 : 1;
			    });
				callback(values);
			}
		  });
		  
		});
    },
    sanGetDirections : function(origin,dest,sb){
    	gm.directions({
			origin: origin,
			destination: dest
		}, function(err, data) {
			assert.ifError(err);
			if (data.routes[0] && data.routes[0].legs) {
				 sb(data.routes[0].legs[ 0 ].distance.text);
			}		        
		})
    },
    sanGetDirectionss: function (origin, dest,waypts=[]) {
    	 	return new Promise(function (resolve, reject) {
    	 		console.log('Origin:- '+origin);
    	 		console.log('Dest:- '+dest);
    	 		console.log(waypts);
			  	 // if (Array.isArray(data)) {
		            var data = {waypoints: waypts};
			      // }
			      if (!data.mode) {
			        data.mode = 'driving';
			      }
			      var url = 'https://maps.googleapis.com/maps/api/directions/json?origin='+encodeURIComponent(origin)+'&destination=' + encodeURIComponent(dest) +'&waypoints=optimize:true|' + data.waypoints.map(encodeURIComponent).join('|')+'&optimizeWaypoints=true&mode=' + data.mode+'&key='+dbconfig.google_key;
					resolve(module.exports.SanGetRequest({
					      url: url,
					      json: true
					}));
		   	});
	},

	SanGetRequest : function(data){
		return new Promise(function (resolve, reject) {
		    Request.get(data, function (err, response) {
		      if (err) {
		        reject(err);
		      } else {
		        if (response.statusCode !== 200) {
		          return reject(new Error('Unexpected response code: ' +
		                                  response.statusCode));
		        }
		        resolve(response.body);
		      }
		    });
		});
	},

	sanRunPromiseQuery : function(query){
		return new Promise((res, rej) => {
	        new sql.ConnectionPool(dbconfig.config).connect().then(pool => {
			  	return pool.request().query(query)
			  }).then(result => {
			    let rows = result.recordset
			    res(rows);
			    // sql.close();
			  }).catch(err => {
			  	//rej('error');
			    // sql.close();
			  });
	    });
    },

    sanExportOrders : function(req,res,data,sb){
    	// var csv_export=require('csv-export');
    	var uniqid = require('uniqid');
    	const csvdata = require('csvdata');
    	var fs = require('fs');
    	var files = [];
		var archiver = require('archiver');
	    var output = fs.createWriteStream(dbconfig.directory+ '/uploads/orders/files.zip');
		var archive = archiver('zip', {
		  zlib: { level: 9 } // Sets the compression level.
		});
		archive.pipe(output);
		// if (!fs.existsSync(dbconfig.directory+'/uploads/orders')){
		//     fs.mkdirSync(dbconfig.directory+'/uploads/orders');
		//     fs.chmodSync(dbconfig.directory+'/uploads/orders', '0777');
		// }
		Object.keys(data).forEach(function(key) {
			csvdata.write(dbconfig.directory+'/uploads/orders/'+key+'.csv', data[key], {header: 'Do,Producer,Timeframe,Stockist,Items,Address,AssignTo,Distance',encoding: 'utf8'})
			files.push(key);
		});
		files.forEach(function(filename){
			var file = dbconfig.directory+'/uploads/orders/'+filename+'.csv';
			archive.append(fs.createReadStream(file), { name: filename+'.csv' });
		});
		archive.finalize();
		sb('files');
    },
    sanClearAssignments : function(sb){
    	var query = "UPDATE Orders SET assign_to = '',distance='',veh_address='',color=''";
	    module.exports.sanInsertQuery('','',query, function(data){
	    	sb('done');
	    });
    },

    sanClearAssign : function(id){
	    var query = "UPDATE Orders SET assign_to = '',distance='',veh_address='',color='' where Id = '"+id+"'";
	    module.exports.sanInsertQuery('','',query, function(data){
		  	
		});
    },

    sanGetInventoryItems : function(orderid){
    	var query = "SELECT InventoryItems.* FROM OrderLines INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id where OrderLines.OrderId = "+orderid+" ORDER BY OrderLines.OrderId DESC;";
		  module.exports.sanRunQuery('','',query, function(data){
		  	return data;
		  });
    },

    sanQueryLoop : function(uids,oids,obj, cb){ 
    	sql.connect(dbconfig.config, function (err) {
	        if (err) console.log(err);
	        var students = [];
	        var pending = oids.length;
	        var request = new sql.Request();
	        // ,distance='"+obj[i].distance+"'
	        for(var i in oids) { 
	        	var query  = "SELECT * FROM Orders INNER JOIN AspNetUsers ON Orders.ApplicationUserId=AspNetUsers.Id INNER JOIN OrderLines ON OrderLines.OrderId=Orders.Id INNER JOIN InventoryItems ON OrderLines.InventoryItemId=InventoryItems.Id WHERE ApplicationUserId='"+uids[i]+"' and Orders.Id='"+oids[i]+"'";
	        	var update = "UPDATE Orders SET assign_to = '"+obj[i].vehicle_name+"',color='"+obj[i].color+"',lat='"+obj[i].cust_ltlng.lat+"',lng='"+obj[i].cust_ltlng.lon+"',veh_address='"+JSON.stringify(obj[i].lat_lng)+"' where Id='"+oids[i]+"'";
		        request.query(update);
		        request.query(query, function(err, stu){
		        	if (stu) {
		        		students.push(stu.recordset);
			            if( 0 === --pending ) { 
			                cb(students); //callback if all queries are processed
			            }
		        	}
		        });
		    }
	    });
    },

    sanDateAmPm : function(date){
    	var hours = date.getHours() > 12 ? date.getHours() - 12 : date.getHours();
		var am_pm = date.getHours() >= 12 ? "PM" : "AM";
		hours = hours < 10 ? "0" + hours : hours;
		var minutes = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
		var seconds = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
		var time = hours + ":" + minutes + " " + am_pm;
		return time;
    },

    sanGetAllVehcileType : function(req, res, callback){ 
    	//var sql = "SELECT * FROM vehcile_type";
    	var sql = "SELECT * FROM vehcile_type LEFT JOIN vehicles ON vehcile_type.id = vehicles.type"; 
    	module.exports.sanRunQuery(req, res,sql, function(result){ 
    		if (result.length > 0) {
    			var userdata = [];
    			var idss = [];
    			var names = [];
    			// !idss.includes(result[key].id) &&
    			if (req.query.types) {
    				Object.keys(req.query.types).forEach(function(key2) {
	    				Object.keys(result).forEach(function(key) {
		    				if(!names.includes(result[key].name[1]) && result[key].name[1] != 'undefined'){
		    					idss.push(result[key].id);
		    					result[key].select = 0;
					          	if (result[key].name[1] !=null) {
					          		names.push(result[key].name[1]);
					            	result[key].select = result[key].name[1];
					          	}
					          	result[key].type_name = result[key].name[0];
		    					userdata.push(result[key]);
		    				}
		    				if (req.query.types[key2].name == result[key].name[1]) {
		    					req.query.types[key2].color = result[key].color;
		    				}
				        });
	    			});
    			}else{
	    				Object.keys(result).forEach(function(key) {
		    				if(!names.includes(result[key].name[1]) && result[key].name[1] != 'undefined'){
		    					idss.push(result[key].id);
		    					result[key].select = 0;
					          	if (result[key].name[1] !=null) {
					          		names.push(result[key].name[1]);
					            	result[key].select = result[key].name[1];
					          	}
					          	result[key].type_name = result[key].name[0];
		    					userdata.push(result[key]);
		    				}
				        });
    			}
    			  
		        //console.log(userdata);
		        if (req.query.types) {
		        	userdata = {
		        		userdata : userdata,
		        		types : req.query.types
		        	}
		        }
    			callback(userdata);
    		}else{
    			callback('not');
    		}
    	});
    },

    sanUpdateOrderWithVehicle : function(name,query,orders, sb){
    	var sql = "SELECT * FROM vehcile_type INNER JOIN vehicles ON vehcile_type.id = vehicles.type where vehicles.name='"+name+"'"; 
    	module.exports.sanRunQuery('', '',sql, function(result){  
    		  /* Time Limit */
    		  var time = module.exports.sanDateAmPm(new Date());
    		  console.log(time);
              		  		 var currentTime= moment(time, "HH:mm a");
              		  		 var startTime = moment(result[0].available_from, "HH:mm a");
  							 var endTime = moment(result[0].available_to, "HH:mm a");
  							 /* Second Shift */
  							 var startTime1 = moment(result[0].s_available_from, "HH:mm a");
  							 var endTime1 = moment(result[0].s_available_to, "HH:mm a");
  							 var currentTime1 = currentTime;
  							 if ( (startTime1.hour() >=12 && endTime1.hour() <=12 ) || endTime1.isBefore(startTime1) )
								{
									endTime1.add(1, "days");       // handle spanning days endTime

									if (currentTime1.hour() <=12 )
									{
										currentTime1.add(1, "days");       // handle spanning days currentTime
									}
								}
  							 /****************/
  							 if ( (startTime.hour() >=12 && endTime.hour() <=12 ) || endTime.isBefore(startTime) )
								{
									endTime.add(1, "days");       // handle spanning days endTime

									if (currentTime.hour() <=12 )
									{
										currentTime.add(1, "days");       // handle spanning days currentTime
									}
								}
              		  		//console.log(currentTime);console.log(startTime);console.log(endTime);
              		  		var isBetween = currentTime.isBetween(startTime, endTime);
              		  		var isBetween1 = currentTime1.isBetween(startTime1, endTime1);
  							//console.log(isBetween)
    		  /* End */
    		  var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
              var day = days[orders.Date.getDay()];
              query = query.replace('{san@ban}', result[0].color);
                    		// console.log(currentTime);console.log(startTime);console.log(endTime);
  							// console.log(isBetween);
  							// console.log('next start');
  							// // console.log(startTime1);console.log(endTime1);
  							// console.log(isBetween1);
              if (result && result[0].available.includes(day) && isBetween) {
              	// console.log(day);
              	module.exports.sanRunQuery('', '',query, function(result){});
              	 sb(result);
              }else if(result && result[0].available.includes(day) && isBetween1){
              	module.exports.sanRunQuery('', '',query, function(result){});
              	 sb(result);
              }else{
              	sb('not');
              }
    	});
    },

    // sanGetVehcileName : function(req, res, callback){
    // 	var sql = "SELECT name FROM vehicles where name";
    // 	// var sql = "SELECT * FROM vehcile_type INNER JOIN vehicles ON vehcile_type.id = vehicles.type"; 
    // 	module.exports.sanRunQuery(req, res,sql, function(result){
    // 		console.log(result);
    // 		if (result.length > 0) {
    // 			callback(result);
    // 		}else{
    // 			callback('not');
    // 		}
    // 	});
    // },

    sanGetVehcileTypeById : function(req, res, callback){
    	if (req.query.edit_id) {
    		var sql = "SELECT * FROM vehcile_type where id="+req.query.edit_id;
    	}else if (req.query.del_id) {
    		var sql = "DELETE FROM vehcile_type where id="+req.query.del_id;
    	}
    	module.exports.sanRunQuery(req, res,sql, function(result){
    		if (result.length > 0) {
    			callback(result[0]);
    		}else{
    			callback('not');
    		}
    	});
    },

    sanSelectVehiclesFromDb : function(req, res, callback){
    	var sql = "SELECT name FROM vehicles where name='"+req.body.veh_name+"'";
    	module.exports.sanRunQuery(req, res,sql, function(result){
    		if (result.length > 0) {
    			callback(result);
    		}else{
    			callback('not');
    		}
    	});
    },

    sanSelectAllVehiclesFromDb : function(req, res, callback){
    	var sql = "SELECT * FROM vehicles INNER JOIN vehcile_type ON vehicles.type = vehcile_type.id";
    	module.exports.sanRunQuery(req, res,sql, function(result){
    		if (result.length > 0) {
    			callback(result);
    		}else{
    			callback('not');
    		}
    	});
    },

    sanGetApiResponse : function(req, res, callback){
    	Request.post({
		    "headers": { "content-type": "application/json","Accept":"application/json","X-API-KEY": dbconfig.DETRACK_LIVE_KEY },
		    "url": dbconfig.all_veh,
		    "body": JSON.stringify({})
		}, (error, response, body) => {	
		    if(error) {
		        return console.log(error);
		    }
		    callback(JSON.parse(body));
		});
    },
    /* Function To Get all Vehicles */
    sanGetAllVehicles : function(req, res, callback){
    		var postData = {}; // Prepare the rest data that will be used in the post request. In case of ViewAllVehicles, it will be empty body
		    // set content-type header and data as json in args parameter 
		    var args = {
		        data: postData,
		        headers: {
		            'X-API-KEY': dbconfig.DETRACK_LIVE_KEY,
		            'Content-Type': 'application/json' //How the Data will be returned from API. In case of Detrack API it will be JSON format
		        }
		    };
		    Api_Request.post(dbconfig.all_veh, args, function (data, response) {
					callback(data.vehicles);
			});
    },

    sanGetDataLoop : function(veh, cb){
    	sql.connect(dbconfig.config, function (err) {
	        if (err) console.log(err);
	        var students = [];
	        var pending = veh.length;
	        var request = new sql.Request();
	        for(var i in veh) {
	        	var sql = "SELECT * FROM vehicles INNER JOIN vehcile_type ON vehicles.type = vehcile_type.id where vehicles.name='"+veh[i].name+"'";
	        	request.query(sql, function(err, stu){
		        	if (stu) {
		        		students.push(stu.recordset);
			            if( 0 === --pending ) { 
			                cb(students); //callback if all queries are processed
			            }
		        	}
		        });
		    }
	    });
    },

    /* Function to add deliveries */
    sanaddDeliveries : function(data) { 
	    // Prepare the rest data that will be used in the post request.
	    Object.keys(data).forEach(function(key) { 
	    	var start = module.exports.sanDateAmPm(data[key].StartTime[0]);
	    	var end = module.exports.sanDateAmPm(data[key].EndTime[0]);
	    	var postData = [
		        {
		            "date": data[key].Date,
		            "do": 'SANDO'+data[key].Id[0],
		            "address": data[key].san_address,
		            "delivery_time": start+" - "+end,
		            "deliver_to": data[key].BussinessName,
		            "phone": data[key].TelephoneNumber,
		            "notify_email": data[key].NotifyEmail,
		            "assign_to": data[key].assign_to,
		            "instructions": "Call customer upon arrival.",
		            "zone": "East",
		            "items": data[key].items
		        }
		    ];
		    var args = {
		        data: postData,
		        headers: {
		            'X-API-KEY': dbconfig.DETRACK_LIVE_KEY,
		            'Content-Type': 'application/json',
		        }
		    };
		    Api_Request.post(dbconfig.add_del, args, function (data, response) {
		        if (data["results"]) {
		        	console.log("Do: " + data["results"][0]["do"]);	
		        }
		         //Return data is in JSON array format. Access the individual Elements with index or iterate over it to access the individual property
		    });
	    });
	    
	},

    sanGetApiResponseByData : function(req, res, callback){
    	Request.post({
		    "headers": { "content-type": "application/json","Accept":"application/json","X-API-KEY": dbconfig.DETRACK_LIVE_KEY },
		    "url": dbconfig.all_veh,
		    "body": JSON.stringify({
		        "firstname": "Nic",
		        "lastname": "Raboy"
		    })
		}, (error, response, body) => {
		    if(error) {
		        return console.dir(error);
		    }
		    console.dir(JSON.parse(body));
		});
    },

    sanGetaDataFromXls : function(req, res, callback){
    	var XLSX = require('xlsx');
		var workbook = XLSX.readFile(dbconfig.directory+'/uploads/items.xlsx');
		var sheet_name_list = workbook.SheetNames;
		sheet_name_list.forEach(function(y) {
		    var worksheet = workbook.Sheets[y];
		    var headers = {};
		    var data = [];
		    worksheet.forEach(function(san) {
		    	//console.log(san);
		    });
		    // for(z in worksheet) {
		    //     if(z[0] === '!ref') continue;
		    //     //parse out the column, row, and value
		    //     var col = z.substring(0,1);
		    //     var row = parseInt(z.substring(1));
		    //     var value = worksheet[z].v;

		    //     //store header names
		    //     if(row == 1) {
		    //         headers[col] = value;
		    //         continue;
		    //     }

		    //     if(!data[row]) data[row]={};
		    //     data[row][headers[col]] = value;
		    // }
		    //drop those first two rows which are empty
		    data.shift();
		    data.shift();
		    callback(worksheet);
		});
    },

    sanImageUpload : function(req, res, id) {
        var fs = require('fs');
		  var path = require('path');
		  var formidable = require("formidable");
		  var appDir = path.dirname(require.main.filename);
		   var form = new formidable.IncomingForm();
		      form.parse(req, function (err, fields, files) {
		      	if (files.img.name !='') {
		      		var oldpath = files.img.path;
			        var newpath = appDir+'/uploads/' + files.img.name;
			        fs.rename(oldpath, newpath);
			        res.json(files.img.name);
		      	}else{
		      		res.json('failed');
		      	}
		        
		   });
    },

    sanGenerateQRCode : function(req, res,id, callback) {
    	//console.log(id);
        var qr = require('qr-image');
        var realpath = 'http://work4brands.com:4200/files/qrcodes/'+ObjectId(id)+'.svg';
        var path = './uploads/qrcodes/'+ObjectId(id)+'.svg';
		var qr_svg = qr.image(ObjectId(id)+'san@#ban', { type: 'svg' });
		qr_svg.pipe(require('fs').createWriteStream(path));
		callback(realpath);
    },

    sanSendMessage : function(req, res, id) {
       var message = new gcm.Message({
	       	priority: 'high',
		    contentAvailable: true,
		    delayWhileIdle: true,
		    timeToLive: 3,
		    data: { key1: 'msg1', key2: 'message2'},
		    notification: {
		        title: "Hello, World",
		        icon: "ic_launcher",
		        body: "This is a notification that will be displayed if your app is in the background."
		    }
		});
       // message.addData('key1','message1');
       var registrationTokens = [];
       registrationTokens.push('regToken1');
       sender.send(message, { registrationTokens: registrationTokens }, function (err, response) {
		    if (err) console.error(err);
		    else console.log(response);
		});
    },

    sanCountriesInfo : function(req, res, callback) {
        User.find({}, function (err, users) {
        if (err) return res.status(500).send("There was a problem finding the events.");
	        if (!users) return res.status(404).send("No user found.");
	        var userdata = [];
	        Object.keys(users).forEach(function(key) {
	            if (users[key].country) {
	            	 var id = userdata.length + 1;
					  var found = userdata.some(function (el) {
					    return el.name === users[key].country;
					  });
					  if (!found) { userdata.push({ image: id, name: users[key].country }); }
	            }
	        });
			callback(userdata); 
	    }).sort( { _id: -1 } );
    },

    sanGetAllCountries : function(req, res, callback) {
    	var moment = require('moment-timezone');
    	Country.find({delete:0}, function (err, cntries) {
    		var timeZones = moment.tz.names();
			var offsetTmz=[];

			for(var i in timeZones)
			{
			    offsetTmz.push(" (GMT"+moment.tz(timeZones[i]).format('Z')+")" + timeZones[i]);
			}
			var data = { 
				    countries: cntries,
				    timezones: offsetTmz
				};
	          callback(data);
	     });
    },

    sanSendMail : function(req, res, mailOptions) {
        var nodemailer = require('nodemailer');
		var transporter = nodemailer.createTransport({
		      service: 'gmail',
		      auth: {
		        user: 'sandeep.digittrix@gmail.com',
		        pass: 'dqubzvltrejhcelg'
		      }
		});
		transporter.sendMail(mailOptions, function(error, info){
		        if (error) {
		        	var http = require('http');
		        	var querystring = require("querystring");
					var qs = querystring.stringify(mailOptions);
					var qslength = qs.length;
		        	var options = {
				        host : 'work4brands.com',
				        port : 80,
				        path : '/sanmail.php',
				        method : 'POST',
				        headers:{
					        'Content-Type': 'application/x-www-form-urlencoded',
					        'Content-Length': qslength
					    }
				    };
				    var buffer = "";
					var req = http.request(options, function(res) {
					    res.on('data', function (chunk) {
					       buffer+=chunk;
					    });
					    res.on('end', function() {
					        console.log(buffer);
					    });
					});

					req.write(qs);
					req.end();
		          
		        } else {
		          console.log('Email sent: ' + info.response);
		        }
		});
    },
    
    sanKey : function(req, res, next) {
        res.json("78d88993fd997052c0e58415a838b30e2a459b21");
    },
    /* Remove All files Inside Any directory */
    san_RemoveFilesInDir : function(path){ 
    	fs.readdir(path, function(err, files) {
		   if (err) {
		       console.log(err.toString());
		   }
		   else {
		       if (files.length == 0) {
			   		fs.rmdir(path, function(err) {
						if (err) {
	                        console.log(err.toString());					    
						}
				    });
		       }
		       else {
			   _.each(files, function(file) { 
				      var filePath = path + file;
				      fs.stat(filePath, function(err, stats) {
						  if (stats && stats.isFile()) {
						      fs.unlink(filePath, function(err) {
								    if (err) {
                                                                        console.log(err.toString());
								    }
								});
						  }
						  if (stats && stats.isDirectory()) {
						      removeDirForce(filePath);
						  }
					      });
				  });
		       }
		   }
	    });
    },

    san_SortDistance : function(a, b){
        if (a.Distance < b.Distance)
            return -1;
        if (a.Distance > b.Distance)
            return 1;
        return 0;
    },
    /* Middleware */
    san_middleware : function(req, res,next){
    	  var token = req.session.token;
		  if (!token && req.path != '/admin/login' && !req.path.includes("assets")){
		    return res.redirect('login');
		  }
		  next();
    },
    san_new_function,
    san_UpdateDistance,
    san_UpdateDistancee
}