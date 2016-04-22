<?php
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
if (!is_numeric($_REQUEST['ccli'])) exit ('Non-numeric CCLI #');
require_once('connect.php');
$sql = 'SELECT * FROM users WHERE ccli = \'' . $mysqli->real_escape_string($_REQUEST['ccli']) . '\';';
$result = $mysqli->query($sql);
if ($result) {
  $return = $result->fetch_assoc();
  unset($return['background']);
  echo json_encode($return);
  $result->free();
} else {
  print $mysqli->error;
}
$mysqli->close();
?>