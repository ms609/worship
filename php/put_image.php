<?
header("Content-type: text/html; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

switch (null) {
  case $_POST['ccli'] : exit ('{error: "No CCLI sent."}');
  case $_POST['field']: exit ('{error: "Image field name not specified."}');
  case $_POST['image']: exit ('{error: "No image data sent."}');
}
require_once('connect.php');
print ($_FILES['image']['type']);
print_r($_FILES);
die ('# # #');

if ($filename) {
    $imgbinary = fread(fopen($filename, "r"), filesize($filename));
    return 'data:image/' . $filetype . ';base64,' . base64_encode($imgbinary);
}
put_data($ccli, $field, $base64_image);
$mysqli->close();
