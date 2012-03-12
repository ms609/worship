<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
require_once('connect.php');
$sql = 'SELECT name FROM users ORDER BY name;';
$result = $mysqli->query($sql);
while ($row = $result->fetch_assoc()) {
  echo addslashes($row['name']) . "\t";
}
$result->free();
$mysqli->close();