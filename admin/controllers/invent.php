<?php
// $myServer = 'qne6f4he68.database.windows.net';
// $myUser = 'PWApp@qne6f4he68';
// $myPass = '!QAZ2wsx';

$serverName = "qne6f4he68.database.windows.net";
$connectionInfo = array( "Database"=>"PressedOrdersLive", "UID"=>"PWApp@qne6f4he68", "PWD"=>"!QAZ2wsx");
$san_db = sqlsrv_connect( $serverName, $connectionInfo);


// $con = mssql_connect($myServer, $myUser, $myPass) or die("Could not connect to database: ".mssql_get_last_message()); 
if($san_db){
echo "connected";
}
// Select a database:
// mssql_select_db('PressedOrdersLive') 
//     or die('Could not select a database.');
?>