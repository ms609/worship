<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
$ccli = $_POST['ccli'];
if (!is_numeric($ccli)) exit ('{"put_data PHP error": "Non-numeric CCLI #"}');
require_once('connect.php');
$ccli = $mysqli->real_escape_string($_POST['ccli']);
$json = $_POST['json'];
foreach ($json as $key => $value) {
  $result = put_data($ccli, $key, $value);
  if (!$result) {
    print $mysqli->error . "\n";
  }  
}
$mysqli->close();