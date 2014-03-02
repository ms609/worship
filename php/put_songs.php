<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
require_once ("connect.php");

header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
/*if (!is_numeric($_POST['ccli'])) exit ('{"error": "Non-numeric CCLI #"}');*/
require_once('connect.php');
/*$ccli = $_POST['ccli'];
unset ($_POST["ccli"]);*/
$ccli = 11038982;
foreach ($_POST as $key => $value) {
  foreach ($value as $oKey => $oVal) {
    $myVal[$oKey] = stripslashes($oVal);
  }
  $new[stripslashes($key)] = $myVal;
}
$new_database = str_replace(array("\\n", "\\r\\r\\n"), "\\r\\n", json_encode($new));
if (strlen(trim($new_database)) > 15) {  
  $sql = 'UPDATE users SET lastModified=\''
  . $mysqli->real_escape_string(time()) . '\', songs=\''
  . $mysqli->real_escape_string($new_database)
  . '\' WHERE ccli = \'' . $ccli . '\';';
  $result = $mysqli->query($sql);
  if ($result) {
    echo "Thanks; your changes have been saved to the central database and can be downloaded to other machines.";
  } else {
    echo $mysqli->error . "\n # # #\n";
  }
} else {
  echo "Null data passed! [$new_database]";
}
$mysqli->close();
?>