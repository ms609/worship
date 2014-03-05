// TODO here: http://code.google.com/speed/articles/optimizing-javascript.html
function Slide (title, author, copyright, text, size) {
  // If missing data, load it
  var allSlides = JSON.parse(localStorage.getItem('slides'));
  if (allSlides && allSlides[title] && typeof(author) === 'undefined') {
    author = allSlides[title]['author'];
    copyright = allSlides[title]['copyright'];
    text = allSlides[title]['text'];
    size = allSlides[title]['size'];
  }
  
  this.title = title.replace(/^\s+|\s+$/g, "");
  
  this.plainTitle = humanText(this.title);

  this.underscoreTitle = machineText(this.title);

  this.parsedTitle = (title ? parseSlideTitle(this.title) : "Untitled Slide");

  this.author = author;

  this.copyright = copyright;

  this.credit = parseCredit(author, copyright);

  if (typeof(text) !== 'undefined') this.text = text.replace(/\r/g, ""); else {
    this.text="";
    text = "";
  }

  this.printDivs = (function () {

    var openP = false;
    var openMeta = false;
    var secondColumnBegun = false;
    var parsed = "";
    var lines = text.split("\r\n");
    if (!lines[1]) {
      lines = text.split("\n");
    }

    for (var i in lines) {
      var line = lines[i];
      line = line.replace(/^[\s\(]*(bridge|chorus|intro|outro|verse)[\s\):\d;\-]*$/ig, '#$1');
      var isChords = isChordLine(line);
      if (trim(line).length == 0 || trim(line).substring(0,3) == "---") { //--- represents a column break on slides only) {
        // If empty line, close paragraph
        if (!openMeta && openP) {
          parsed += "</p>\r\n";
          openP = false;
        }
      } else if (trim(line).substring(0,3) == "===") { // === represents a break when printing tab, too
        // If we need a new column
        openMeta = false;
        if (openP) {
          parsed += "</p>";
          openP = false;
        }
        if (!secondColumnBegun) {
          secondColumnBegun = true;
        } else {
          parsed = parsed.replace(/---COLUMN BREAK---/g, "");
        }

        parsed += "---COLUMN BREAK---";
      } else if (line.substring(0,1) == "#") {
        // Metadata line
        parsed += "<p class='" + line.substring(1).toLowerCase() + "'>\r\n";
        openP = true;
        openMeta = true;
      } else {
        openMeta = false;
        // Line contains text
       if (!openP) {
         parsed += "<p class=verse>";
         openP = true;
       }
       parsed += "<span" + ((trim(line).substring(-1) == ">" || trim(line).substring(0,1) == ">")
                            ?" style='display:inline'"
                            :"")
                         + (isChords
                            ? " class='chords'>" + renderChords(line)
                            : ">" + line.replace(/>|/g, "").replace(/[.,]+\s*$/, "").replace("*", "<span class=italic>").replace("*", "</span>")
                            )
                         + "</span>\n";  // Underscores denote held words in tab, but shouldn't show on slides.
      }
    }
    if (openP) {
      parsed += "</p>";
    }
    var replaceThis = new Array (/bolded/g, /italics/g, /indented/g, /tab(bed)?/g,
         /chorus ?1/g,  /chorus ?2/g, /bridge:?/g,
         /chorus ?3/g, /middle ?8/g, /outro/g,
         // This line must appear last to avoid replacing to, e.g., "yellow 3".
         /chorus:?/g,
         // Characters:
         /  +/g, /\[/g, /\]/g, / class=\"\"/g, / "/g);
    var replaceWith = new Array ("bold", "italic",    "indent",   "indent",
        "blue", "yellow", "yellow",
        "green", "green", "green",
        "blue",
        " ", "<", ">", "", '"');

    for (i = 0; i < replaceThis.length; ++i) {
      parsed = parsed.replace(replaceThis[i], replaceWith[i]);
    }
    var parseResult = parsed.split("---COLUMN BREAK---");

    if (parseResult[1]) {
      return '<div class="leftcol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[0]
        + '</div><div class="rightcol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[1]
        + '</div>';
    } else {
      return '<div class="nocol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[0]
        + '</div>';
    }
  })();

  this.parsedText = parseSlide(text, size);
  this.parsedTextSingleColumn = parseSlide(text).join("");
  this.parsedSlide = '<h1>' + this.parsedTitle + '</h1><div class=words>'
    + parseDivs(parseSlide(text, size, false)) + '</div>';
  this.slideContent = 
      ' <h1> ' + this.parsedTitle + '</h1>'
      + '<div class="slidecontent">'
      + '  <div class="words">'
      + (text ? parseDivs(parseSlide(text), size, false) : "")
      + '  </div>'  // /words
      + '<div class="credit"><h2>'
      + this.credit
      + '</h2></div>' // /credit
      + '</div>';  // /slidecontent
 

  this.preview = parseDivs(this.parsedText, size, this.credit);

  this.size = size;
}

function renderChords (line) {
  return line.replace(/\t/g, "      ").replace(/ /g, "&nbsp;");//.replace(/([A-G])b/g, "$1&#x266D");
}

function unrenderChords(line) {
  return line.replace(/&nbsp;/g, " ").replace(/&#x266D/g, "b").replace(/&#x266F;/g, "#");
}

function array2slide (title, arr) {
  return new Slide (title, arr["author"], arr["copyright"], arr["text"], arr["size"], arr["key"], arr["capo"]);
}

function sortArray(arr) {
    // Set up Arrays
    var sortedKeys = new Array();
    var sortedObj = {};

    // Separate keys and sort them
    for (var i in arr){
        sortedKeys.push(i);
    }
    sortedKeys.sort();

    // Reconstruct sorted obj based on keys
    for (var i in sortedKeys){
        sortedObj[sortedKeys[i]] = arr[sortedKeys[i]];
    }
    return sortedObj;
}

function parseSlide(text) {
  var openP = false;
  var openMeta = false;
  var secondColumnBegun = false;
  var parsed = "";
  var lines = text.split("\r\n");
  if (!lines[1]) {
    lines = text.split("\n");
  }

  for (var i in lines) {
    var line = lines[i];
    line = line.replace(/^[\s#\(]*(bridge|chorus|intro|outro|verse)[\s\):\d;\-]*$/ig, '#$1');
    if (!isChordLine(line)) {
      if (trim(line).length == 0) {
        // If empty line, close paragraph
        if (!openMeta && openP) {
          parsed += "</p>\r\n";
          openP = false;
        }
      } else if (trim(line).substring(0,3) == "---"
               ||trim(line).substring(0,3) == "===") { // === represents a break when printing tab, too
        // If we need a new column
        openMeta = false;
        if (openP) {
          parsed += "</p>";
          openP = false;
        }
        if (!secondColumnBegun) {
          secondColumnBegun = true;
        } else {
          parsed = parsed.replace(/---COLUMN BREAK---/g, "");
        }

        parsed += "---COLUMN BREAK---";
      } else if (line.substring(0,1) == "#") {
        // Metadata line
        parsed += "<p class='" + line.substring(1).toLowerCase() + "'>\r\n";
        openP = true;
        openMeta = true;
      } else {
        openMeta = false;
        // Line contains text
       if (!openP) {
         parsed += "<p class=verse>";
         openP = true;
       }
       parsed += "<span" + ((trim(line).substring(-1) == ">" || trim(line).substring(0,1) == ">")
                            ?" style='display:inline'"
                            :"")
                         + ">" + line.replace(/>|_/g, "").replace(/[.,]+\s*$/, "").replace("*", "<span class=italic>").replace("*", "</span>") + "</span>\n";  // Underscores denote held words in tab, but shouldn't show on slides.
      }
    }
  }
  if (openP) {
    parsed += "</p>";
  }
  var replaceThis = new Array (/bolded/g, /italics/g, /indented/g, /tab(bed)?/g,
       /chorus ?1/g,  /chorus ?2/g, /bridge/g,
       /chorus ?3/g, /middle ?8/g, /outro/g,
       // This line must appear last to avoid replacing to, e.g., "yellow 3".
       /chorus/g,
       // Characters:
       /  +/g,  /\[/g, /\]/g, / class=\"\"/g, / "/g); // I replaced "" with //g, I hope that's the right thing to do!
  var replaceWith = new Array ("bold", "italic",    "indent",   "indent", 
      "blue", "yellow", "yellow",
      "green", "green", "green",
      "blue",
      " ", "<", ">", "", '"');
      
  for (i = 0; i < replaceThis.length; ++i) {
    parsed = parsed.replace(replaceThis[i], replaceWith[i]);
  }  
  return parsed.split("---COLUMN BREAK---");
}

// Parses the parsed data into divs that can go straight into a slide
function parseDivs (parseResult, size, credit) {
  if (parseResult[1]) {
      return '<div class="leftcol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[0]
        + '</div><div class="rightcol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[1]
        + '</div>'
        + (credit?'<div class=credit>' + credit + '</div>':'');
    } else {
      return '<div class="nocol" ' + (size ? 'style="font-size:' + size + '%"' : '') + '>' + parseResult[0]
        + '</div>'
        + (credit?'<div class=credit>' + credit + '</div>':'');
    }
  }

function parseSlideTitle(text) {
  text = humanText(text);
 if (text.match(/\(/) && text.length > 40) {
    var brackets = /\(.+\)/.exec(text);
    var okLength = 40 - Math.floor(brackets[0].length * .9);
    var bracketRegExp = new RegExp ("([^(]{" + okLength + "}[^(\\s]*) [^(]+");
    text = text.replace(bracketRegExp, "$1&hellip; ");
 }
 return text.replace("(", "<span class=subtitle>(").replace(")",  ")</span>");
}

function parseCredit(author, copy) {
  return author + (copy ? " &copy;" + copy : "");
}

function isChordLine(text) {
  text = text.replace(/\t/g, "     ");
  trimText = trim(text);
  if (trimText.length > 0 && (
        countSpaces(trimText) * 2 >= text.length
        || trimText.length < 3
        || (trim(text.replace(/[A-G](maj|[bm24679#\s]|sus|add|13|\/)+|[iI]ntro(duction)?:?|[xX] ?\d|\d ?[xX]|[(),.\-]/g, "")).length <= 1 && text.replace(/[\s\-]/g, '').length > 0)
        )
      ) {
    return true;
  }
  else if (/m7\b|\b\w#|\b\wsus\b/.exec(text)) {
    return true;
  } else {
    return false;
  }
}

function trim(text) {
  return text.replace(/^\s+/, "").replace(/\s+$/, "");
}

function countSpaces(text) {
  return text.split(/s/g).length - 1;
}

function machineText(text) {
  return (typeof(text) === 'string' ? text.replace(/\s/g, "_").replace(/'|&rsquo;/g, '\u2019').replace(/"/g, '\u0022') : ''); // &rsquo; or ’
}

function humanText(text) {
  return (typeof(text) === 'string' ? text.replace(/_/g, " ").replace(/'|&rsquo;/g, '\u2019') : ''); // &rsquo; or ’
}
