<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

if ($_POST) {
  $setlists = $_POST['setLists'];
  $ccli = $_POST['ccli'];
}
foreach ($setlists as $key => $value) {
  $myVal = null;
  foreach ($value as $oKey => $oVal) {
    $myVal[$oKey] = stripslashes($oVal);
  }
  $new[stripslashes($key)] = $myVal;
}
$new_database = str_replace(array("\\n", "\\r\\r\\n"), "\\r\\n", json_encode($new));
if (strlen(trim($new_database)) > 15) {
  require_once('connect.php');
  exit (put_data($ccli, 'setLists', $new_database));
  $message = put_data($ccli, 'setLists', $new_database)
          ? "Thanks; your changes have been saved to the central database and can be accessed from other machines."
          : "There was a problem saving the changes.";
  $mysqli->close();
  exit ($message);
} else {
  exit ("Null data passed! [$new_database]");
}
?>