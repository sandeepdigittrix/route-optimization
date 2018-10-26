var dbconfig = require('./config');
const sql = require('mssql');
var Connection = require('tedious').Connection;
var myconnection = new Connection(dbconfig.tedconfig);
myconnection.on('connect', function(err){
	
	if (err) {
		console.log(err);	
	}else{
		//console.log('connected');
	}
});