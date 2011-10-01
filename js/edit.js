// Generates slide content and edit-boxes from json file or localStorage
var lastJSON = {};


$(document).ready(function(){
  if (localStorage.getItem("slideCount") > 0) {
   parseEditSlides($('.presentation'), getStoredSlides(true), false);
  } else { 
   parseEditSlides($('.presentation'), slideDatabase, true);
  }
});

$(window).blur(function() {
  updateStoredSlides();
});

$(window).unload(function() {
  updateStoredSlides();
});

function parseEditSlides(anchor, JSONData, fromJSON) {
  // Set global "lastJSON", so that we can revert to the original JSONdata if necessary
  if (fromJSON) {
    lastJSON = JSONData;
  }
  JSONData = sortArray(JSONData);
  var i = 0;
  var div;
  var html;
  var header;
  var handout;
  var divSlideContent;
  var slide;
  console.log(JSONData);
  for (var song in JSONData) {
    if (song) {
      div = $(document.createElement('div'));
      div.attr('id', 'slide' + ++i);
      div.attr('class', 'slide');
      header = '<h1 id="sectionTitle' + i + '">' + (song?parseSlideTitle(song):"Untitled slide") + '</h1>';
      slide = array2slide(song, JSONData[song]);

      handout = "<div class=handout>"
      + "<p style='float:right; width:43%'>"
      + '<label for="title">Title: </label><input type="text" class="title" name="title" id="songTitle' + i + '" tabindex='
      + (i * 8 + 1) + (song ? ' value="' + slide.plainTitle : ' placeholder="Add new slide')
      + '" onKeyUp="updateSlide(' + i + ', true);"/>'
      + '                                  <input type="hidden" name="former_title" id="formerTitle' + i + '"'
      + '                                         value="' + song + '"/>'
      + '                                 <input type="hidden" name="anchor"'
      + '                                    value="' + i + '"/>'
      + '<br />'
      + '<label for="size">Display font size: </label><input type="text" id="fontSize' + i + '"'
      + '                                               onKeyUp="updateSlide(' + i + ', true);"'
      +       '             name="size" size="3" maxlength="5" tabindex=' + (i * 8 + 2)
      + '                                          value="' + slide["size"] + '"/>%'
      + ' <br />'
      + ' <label for="author">Author: </label><input type="text" name="author" id="authorName' + i + '"'
      + '                                           onKeyUp="updateSlide(' + i + ', true);" tabindex=' + (i * 8 + 3)
      + '                                           value="' + slide["author"] + '"/>'
      + ' <br />'
      + ' <label for="copyright">Copyright: &copy;</label><input type="text" id="copy' + i + '"'
      + '                                           name="copyright" onKeyUp="updateSlide(' + i + ', true);" tabindex=' + (i * 8 + 4)
      + '                                          value="' + slide["copyright"] + '"/>'
      + ' <input type="hidden" name="key" id="modified' + i + '" '
      + '                                          value="' + (slide["modified"] ? 1 : 0) + '"/>'
      + ' <br /><span style="visibility:hidden">'
      + ' </span><br />'
      + ' <input type="button" value="Undo changes" onclick="resetSlide(' + i + ')" tabindex=' + (i * 8 + 7) + '/>'

      + ' </p><p  style="float:left; width:55%">'
      + '   <textarea name="text" id="editText' + i + '" rows="20" cols="80" tabindex=' + (i * 8 )
      + ' onKeyUp="updateSlide(' + i + ', true);">' + slide["text"] + '</textarea>'
      + ' </p>'
      + '</div>';
      // handout (i.e. edit form) html over; print slide preview and close slide
      divSlideContent = '<div class="slidecontent" style="clear:both">'
      + ' <h1 id="previewTitle' + i + '"> ' + (song?parseSlideTitle(song):"Untitled Slide") + '</h1>'
      + '  <div class="words" id="slideText' + i + '">'
      + '  </div>'
      + ' </div>';
      html = header + handout + divSlideContent;
      div.html(html);
      anchor.append(div);
      updateSlide(i);
    } // Don't show untitled songs.
  }
}

function updateSlide(i, modified) {
  $('#slideText' + i).html(function() {
    var size = $('#fontSize' + i).val();
    var author =  $('#authorName' + i).val();
    var copy = $('#copy' + i).val();
    var text = $('#editText' + i).val();
    var parseResult = parseSlide(text);
    return parseDivs(parseResult, size, parseCredit(author, copy));
  });
  if (modified) {
    $('#modified' + i).val(1);
  }
  var parsedTitle = $('#songTitle' + i).val() ? parseSlideTitle($('#songTitle' + i).val()) : "Untitled slide";
  $('#sectionTitle' + i).html(parsedTitle);
  $('#previewTitle' + i).html(parsedTitle);
}

function resetSlide(i) {
  var originalTitle = $("#formerTitle" + i).val(); // will be in humanText format
  var slide = slideDatabase[originalTitle];
  $("#sectionTitle" + i).html(parseSlideTitle(originalTitle));
  $("#previewTitle" + i).html(parseSlideTitle(originalTitle));
  $("#songTitle" + i).val(originalTitle);
  $("#fontSize" + i).val(slide["size"]);
  $("#authorName" + i).val(slide["author"]);
  $("#capo" + i).val(slide["capo"]);
  $("#copy" + i).val(slide["copyright"]);
  $("#key" + i).val(slide["key"]);
  $("#editText" + i).val(slide["text"]);
  updateSlide(i);
}
