/**
 * @author Sandeep Bangarh <sanbangarh309@gmail.com>
 */
var express = require('express');
var session = require('express-session')
var app = express();
var db = require('./db');
var sanban = require('./functions');
app.set('view engine', 'ejs');
app.use(session({secret: 'sandeep@bangarh',resave: true,
    saveUninitialized: true}));
/*Middleware*/
var VerifyLogin = sanban.san_middleware;
//app.use(VerifyLogin);
/**/
var AdminController = require('./admin/controllers/AdminController');
app.use('/admin', AdminController);
app.use(express.static(__dirname + '/public'));
// app.get('/get_result', function(req,res){
//   //var query = "SELECT * FROM InventoryItems WHERE DateCreated <= CURRENT_TIMESTAMP;";
//   var query = "SELECT top 3 * FROM Orders;";
//   sanban.sanRunQuery(req,res,query, function(data){
//   	res.json(data);
//   });
// });

// var query = "DELETE FROM vehicles WHERE ID IN(5,6,7)";
// sanban.sanInsertQuery('','',query, function(data){
//   console.log('done');
// });

// var date = sanban.sanDateAmPm(new Date());
// console.log(date);
// app.get('/insert_into', function(req,res){
//   var query = "CREATE TABLE vehcile_type( id int IDENTITY(1,1) PRIMARY KEY,name VARCHAR(50) NOT NULL,capacity VARCHAR(50),vehicle_name VARCHAR(100),available VARCHAR(100),available_from VARCHAR(100), available_to VARCHAR(100),s_available_from VARCHAR(100),s_available_to VARCHAR(100));";
//   sanban.sanInsertQuery(req,res,query, function(data){
//     console.log(data);
//     //res.json(data);
//   });
// });
// app.get('/insert_into', function(req,res){
//   var query = "CREATE TABLE vehicles( ID int IDENTITY(1,1) PRIMARY KEY,name VARCHAR(50) NOT NULL,type VARCHAR(255));";
//   sanban.sanInsertQuery(req,res,query, function(data){
//     console.log(data);
//     res.json(data);
//   });
// });
// app.get('/insert_into', function(req,res){
//   var sql = "INSERT INTO route_admin (username, password) VALUES ('route_admin','pass@123')";
//   sanban.sanInsertQuery(req,res,sql, function(data){
//     console.log(data);
//     res.json(data);
//   });
// });

// app.get('/insert_into', function(req,res){
//   var query = "ALTER TABLE Orders ADD lat VARCHAR(255),lng VARCHAR(255);";
//   sanban.sanInsertQuery(req,res,query, function(data){
//     console.log(data);
//     res.json(data);
//   });
// });

// app.get('/xls', function(req,res){
//   sanban.sanGetaDataFromXls(req,res, function(data){
//   	res.json(data);
//   });
// });
/* Get get Countries */
var routes = require('./admin/routes/Routes');
 routes(app);

module.exports = app;