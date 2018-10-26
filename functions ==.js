/*
* Author : Sandeep Bangarh
* Email : sanbangarh309@gmail.com
*/
"use strict"
var dbconfig = require('./config');
var https = require("https");
var sql = require('mssql');
// var dbConn = new sql.Connection(dbconfig.config);
// var Connection = require('tedious').Connection;
// var poolConfig = {
//     min: 1,
//     max: 3,
//     log: true
// };
// var pool = new ConnectionPool(poolConfig, dbconfig.tedconfig);



// var myconnection = new Connection(dbconfig.tedconfig); 
// var Request = require('tedious').Request  
// var TYPES = require('tedious').TYPES; 
// var NodeGeocoder = require('node-geocoder');
module.exports = {
	sanRunQuery : function(req, res,query, callback) {
		  /* Local Connection */
      	  new sql.ConnectionPool(dbconfig.config).connect().then(pool => {
		  	return pool.request().query(query)
		  }).then(result => {
		    let rows = result.recordset
		    callback(rows);
		    sql.close();
		  }).catch(err => {
		  	callback({ message: "err"});
		    sql.close();
		  });
		 /* Remote Connection */
    },

    sanExecuteQuery : function(req, res, query, callback){
    	var actarra = {};
    	var realarrr = [];

    	var request = new Request(query, function(err, count, rows) {  
        if (err) {  
            console.log(err);} 
            if (count <= 0) {
            	return res.status(200).send({result: 'not_found'});
            }else{
            	callback(rows[0]);
            }
            //console.log(rows[0]);
        });  

        // request.on('done', function (rowCount, more, rows) {
        // 	console.log(rows);
        // });
        
        // request.on('row', function(columns) {
        //     columns.forEach(function(column) {  
        //       if (column.value === null) {
        //       } else {  
        //       	actarra[column.metadata.colName] = column.value;
        //       } 
        //       realarrr.push(actarra); 
        //     });  
        //     callback(realarrr);
        // }); 
        myconnection.execSql(request);
    },

    sanDoLogin : function(req, res, query, callback){
    	var actarra = {};
    	var request = new Request(query, function(err, count) {  
        if (err) {  
            console.log(err);} 
            if (count <= 0) {
            	callback('not_found');
            }else{
            	callback('found');
            }
            console.log(count);
        });
        myconnection.execSql(request);
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
		    	console.log(san);
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
    	console.log(id);
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
    }
}