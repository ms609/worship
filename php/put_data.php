<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
if (!is_numeric($_POST['ccli'])) exit ('{"error": "Non-numeric CCLI #"}');
require_once('connect.php');
$ccli = $mysqli->real_escape_string($_POST['ccli']);
unset($_POST['ccli']);
foreach ($_POST as $key => $value) {
  $result = put_data ($ccli, $key, $value);
  if (!$result) {
    print $mysqli->error . "\n";
  }  
}
$mysqli->close();