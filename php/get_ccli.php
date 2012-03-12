<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
require_once('connect.php');
$sql = 'SELECT ccli FROM users WHERE name = \'' . $mysqli->real_escape_string($_REQUEST['name']) . '\';';
$result = $mysqli->query($sql);
if ($result) {
  $return = $result->fetch_assoc();
  echo $return['ccli'];
  $result->free();
}
$mysqli->close();