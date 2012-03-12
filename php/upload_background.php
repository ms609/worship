<!DOCTYPE html>
<html>
<head>
  <meta HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8" />
  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"></script>
  <script src="../js/ini.js"></script> <!-- contains initialization variables required by other files -->
  <link rel="stylesheet" href="../css/form.css" type="text/css" media="screen" id="editFields" />
  <link rel="stylesheet" href="../css/control.css" type="text/css" media="screen" />
  <link rel="stylesheet" href="../css/backend.css" type="text/css" media="screen" />
  <link rel="stylesheet" href="../css/outline.css" type="text/css" media="screen" />
</head>
<body>
<form enctype="multipart/form-data" method="POST">
  <label for=bg>Background image: </label><output name="status" for="bg">Select</output>
  <input type="hidden" name="ccli" id="ccli" value="<?=1*$_GET['ccli']?>"></input>
  <input name="bg" id="bgImage" type="file"
          alt="Upload an image to use as a slide background" />
  <input type=submit value="Upload" name="background" onclick="status.value='Uploading...';">
</form>
    <span id="bgStatus" style="position: absolute; text-align: right; top:0; right:0;"><?
if ($_POST) {
  $file_type = $_FILES['bg']['type'];
  $ccli = $_POST['ccli'];
  if (is_numeric($ccli) && substr($file_type, 0, 5) == 'image') {
    $file_content = fread(fopen($_FILES['bg']['tmp_name'], 'r'), $_FILES['bg']['size']);
    $base64_image = 'data:' . $file_type . ';base64,' . base64_encode($file_content);
    require_once('connect.php');
    put_data($ccli, 'background', $base64_image);
    $mysqli->close();
  } else echo 'Error uploading [' . substr($file_type, 0, 5) . '] for [' . $ccli . ']' . is_numeric($ccli);
  echo htmlentities($_FILES['bg']['name']);
} ?></span>
