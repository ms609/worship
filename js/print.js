/*
* Newlife worship manager
* Author: Martin S, at Gmail.com
* Open source and free to use
* Song content only available under terms of the CCLI.
*/

var slidesAtLoad = new Array();

// Generates slide content  and edit-boxes from json file / localStorage.
$(document).ready(function(){
  if (localStorage.getItem("slideCount")) {
    parseDisplaySlides($('.presentation'), getStoredSlides(), printFormat);
  } else {
    parseDisplaySlides($('.presentation'), slideDatabase, printFormat);
  }
  $('#showChords').change(function() {
    $('.page').toggleClass('no-chords');
    $('.page').toggleClass('show-chords');
    $('#content').toggleClass('columns');
  });
});

function parseDisplaySlides(anchor, JSONData) {
  var div;
  var html = "";
  var song;
  JSONData = sortArray(JSONData);
  for (var i = 0; i < localStorage.getItem("setListLength"); i++) {
    song = machineText(localStorage.getItem("slide" + i));
    //console.log(i + " of " + localStorage.getItem("setListLength") + ": " + song);
    if (song && JSONData[song] && JSONData[song]["text"]) {
      slidesAtLoad[i] = machineText(song);
      switch (printFormat) {
        case "Chords":
          div = $(document.createElement('div'));
          div.attr('id', 'slide' + i);
          div.attr('class', ($('#showChords').val() ? 'show' : 'no') + '-chords autogenerated page');
          div.html(pageContents(i, array2slide(song, JSONData[song])));
          $('.transposeTarget').each(function () {
            transpose($(this).attr('page'), this.value, null);
            });
          $('#content').append(div);
        break;
        case "Words":
          console.log("TODO: Is this ever used!");
          html += fitContents(i, array2slide(song, JSONData[song]));
        break;
      }
    } else {
      // else untitled slide.
      console.log("Couldn't add slide: " + song);
      console.log(JSONData);
      console.log(JSONData[song]);
    }
  }
  if (html) {
    div = $(document.createElement('div'));
    div.attr('class', 'autogenerated onepage');
    div.html(html);
  }
  if (printFormat == "Words") {
    // Fit words to columns
    console.log(div);
    var oCol = new Array();
    oCol[0] = $(document.createElement('div'));
    var columnWidth = paperWidth - 6 - 25 - 25; // leave central padding and margins
    var c = 0; var counter = 29;
    while (div.first() && counter < 100) {
      ++counter;
      oCol[c].append(div.first());
      div.first().remove();
      console.log(oCol[c].height());
      if (oCol[c].height() > 1.15 * (paperHeight - 50)) {// leave room for margins
        oCol[++c] = $(document.createElement('div'));
        oCol[c].css({
          'border' : 'solid 1px coral',
          'width': columnWidth,
          'float': (c%2 ? 'right' : 'left'),
          'margin-right': (c%2 ? 25 : 3) + "mm",
          'margin-left': (c%2 ? 3 : 25) + "mm"
        });
        oCol[c].append(oCol[c-1].last().first());
        oCol[c-1].last().remove();
      }
    }
    div.append(oCol);
  }
  $('#content').append(div);
}

// content is json array of slide details.
function pageContents(pageNumber, song) {
  if (song.text)
  return ('<div class="newPage">'
      + ' <h1 id="songTitle' + pageNumber + '"> ' + song.parsedTitle + '</h1>'
      + ' <div class="credit"><h2>'
      + song.credit
      + ' </h2></div>' // /credit
      + ' <div class="ccli">CCLI license # ' + local.ccli + '</div>'
      + ' <div class="screenOnly transpose">Change first chord to:'
      + ' <input type=text class="transposeTarget" page="' + pageNumber
        + '" id="transposeTarget' + pageNumber
        + '" maxlength=2 onkeyup="transpose(' + "'" + pageNumber
        + "', this.value, '" + song.underscoreTitle + "')" + '" value="'
        + (localStorage.getItem('key_' + song.underscoreTitle) || "")
        + '" /></div>'
      + ' <div class="words" id="slideText' + pageNumber + '">'
      + song.printDivs
      + ' </div>'  // /words
      + '</div>');  // /newPage
  else return false;
}

// content is json array of slide details.
function fitContents(pageNumber, song) {
  if (song.text)
  return ('<div class="oneSong">'
      + ' <h1 id="songTitle' + pageNumber + '"> ' + song.parsedTitle + '</h1>'
      + ' <div class="credit"><h2>'
      + song.credit
      + ' </h2></div>' // /credit
      + ' <div class="words" id="slideText' + pageNumber + '">'
      + song.parsedTextSingleColumn
      + ' </div>'  // /words
      + '</div>');  // /newPage
  else return false;
}

function toSharps (text) {
  return text.replace(/Bb/g, "A#").replace(/Db/g, "C#").replace(/Eb/g, "D#").replace(/Gb/g, "F#").replace(/Ab/g, "G#")
    .replace(/VII/, 'B')
    .replace(/VI/, 'A')
    .replace(/IV/, 'F')
    .replace(/V/, 'G')
    .replace(/III/, 'E')
    .replace(/II/, 'D')
    .replace(/I/, 'C')
    .replace(/vii/, 'Bm')
    .replace(/vi/, 'Am')
    .replace(/iv/, 'Fm')
    .replace(/v/, 'Gm')
    .replace(/iii/, 'Em')
    .replace(/ii/, 'Dm')
    .replace(/i/, 'Cm')
  ;
}

function toKeyOf(text, target) {
  switch (target) {
    case "A":
    case "B":
    case "C#":
    case "Db":
    case "D":
    case "E":
    case "F#":
    case "Gb":
      return text.replace(/A#/g, "A#")
                 .replace(/Bb/g, "A#")

                 .replace(/C#/g, "C#")
                 .replace(/Db/g, "C#")

                 .replace(/D#/g, "D#")
                 .replace(/Eb/g, "D#")

                 .replace(/F#/g, "F#")
                 .replace(/Gb/g, "F#")

                 .replace(/G#/g, "G#")
                 .replace(/Ab/g, "G#");
    case "G#":
    case "Ab":
    case "A#":
    case "Bb":
    case "C":
    case "D#":
    case "Eb":
    case "F":
    case "G":
      return text.replace(/A#/g, "Bb")
                 .replace(/Bb/g, "Bb")

                 .replace(/C#/g, "Db")
                 .replace(/Db/g, "Db")

                 .replace(/D#/g, "Eb")
                 .replace(/Eb/g, "Eb")

                 .replace(/F#/g, "Gb")
                 .replace(/Gb/g, "Gb")

                 .replace(/G#/g, "Ab")
                 .replace(/Ab/g, "Ab");
 }
}

function toRoman(text) {
  return text
             .replace(/di[mM]/g,  "\u00b0")
             .replace(/Ab[mM]/g, "\u266Dvi")
             .replace(/A[mM]/g,  "vi")
             .replace(/Bb[mM]/g, "\u266Dvii")
             .replace(/B[mM]/g,  "vii")
             .replace(/C[mM]/g,  "i")
             .replace(/Db[mM]/g, "\u266Dii")
             .replace(/D[mM]/g,  "ii")
             .replace(/Eb[mM]/g, "\u266Diii")
             .replace(/E[mM]/g,  "iii")
             .replace(/F[mM]/g,  "iv")
             .replace(/Gb[mM]/g, "\u266Dv")
             .replace(/G[mM]/g,  "v")
             .replace(/Ab/g,  "\u266DVI")
             .replace(/A/g,   "VI")
             .replace(/Bb/g,  "\u266DVII")
             .replace(/B/g,   "VII")
             .replace(/C/g,   "I")
             .replace(/Db/g,  "\u266DII")
             .replace(/D/g,   "II")
             .replace(/Eb/g,  "\u266DIII")
             .replace(/E/g,   "III")
             .replace(/F/g,   "IV")
             .replace(/Gb/g,  "\u266DV")
             .replace(/G/g,   "V")
             .replace(/(\d)(?!<)/g,   "<sup>$1</sup>")
             .replace(/([iv])\s(\s*)/gi, "$1\u00b7$2")
}

function transpose(i, target, songTitle) {
  var romanNotation = false;
  localStorage.setItem('key_' + songTitle, target);
  target = target.substr(0, 1).toUpperCase() + target.substr(1);
  if (target === 'I') {
    target = 'C';
    romanNotation = true;
  }
  var original;
  var shift;
  var originalPos; var targetPos;
  var order = new Array('A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#');
  var replace = /replace-([A-GIViv]+[b\#]?)-replace/;
  $("#slideText" + i + " .chords").each(function (index) {
    var line = unrenderChords(this.innerHTML).replace(/\b([A-GIViv]+[b\#]?)/g, "replace-$1-replace");
    if (!original) {
      console.log(line)
      original = replace.exec(line);
      console.log(original);
      original = original[1];
      var originalSharped = toSharps(original);
      var targetSharped = toSharps(target);
      for (var note in order) {
        if (order[note] == originalSharped) {
          originalPos = note;
        }
        if (order[note] == targetSharped) {
          targetPos = note;
        }
      }
      if (!targetPos) {
        return false;
      } else {
        shift = targetPos - originalPos;
        if (shift < 0) {
          shift += 12;
        }
      }
    }
    while (line.match(replace)) {
      var old = replace.exec(line);
      old = old[1];
      var oldSharped = toSharps(old);
      var oldPosition = (function () {
        for (note in order) {
          if (order[note] == oldSharped) {
            return note;
          }
        }
        return false;
        } )();
        //console.log(old + "->" + order[1*oldPosition + shift]);
      line = line.replace("replace-" + old + "-replace", order[1*oldPosition + shift]);
    }
    line = toKeyOf(line, target);
    if (romanNotation) line = toRoman(line);
    $(this).html(renderChords(line));
    return true;
  });
}

// Removes null values and returns list of unique values
function array_unique(arr) {
  var unique = [];
  var output = [];
  for (var str in arr) {
    if (arr[str]) {
      unique[arr[str]] = arr[str];
    }
  }
  for (var uni in unique) {
    output.push(uni);
  }
  return output;
}

function refreshSlides() {/*
  var slides = getStoredSlides();
  if (slides) {
    $("div.newPage").each( function (i) {
      this.innerHTML = slideContents(i,
      slidesAtLoad[i],
      slides[slidesAtLoad[i]]);
    });
  } else {
    console.log("Eek! Error getting slides in refreshSlides()");
  }*/
}
