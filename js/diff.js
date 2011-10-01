if (!navigator.appVersion.match(/\bChrome\//)) {
  alert("Please use Google Chrome to access the worship manager.");
  document.body.innerHTML = "Please use <a href='http://chrome.google.com' title='Download Google Chrome'>Google Chrome</a> to access the worship manager.";
  throw "Not using Chrome.";
}

  
$(document).ready(function() {
  var showServerList = function (myList) {
    var text = '</ul><h4 listName="' + machineText(myList) + '">Server version of "' + humanText(myList)
      + '" <a onclick="downloadList(this)">download</a>'
      + ' <a onclick="deleteList(this)">delete</a></h4><ul>'
    for (var i in serverLists[myList]) {
        text += '<li>' + humanText(serverLists[myList][i]) + '</li>';
      }
    return text;
  };
  var list = $("#differentSlides");
  if (!connection || connection == '0') {
    list.append("<h2>Error</h2><p>Could not connect to central server.  Check your connection to the internet</p>");
  } else {
    $('#differentLists').append(function () {
      var setLists = '';
      var newListsOnServer = 0;
      var localLists = JSON.parse(localStorage.getItem("setLists") || '{}');
      for (var serverList in serverLists) {
        if (!localLists[serverList]) {
            setLists += showServerList(serverList);
            ++newListsOnServer;
        }
      }
      setLists = '<h2 style="margin-top:3em;">Set list synchronization</h2>'
        + (newListsOnServer ? '<div><h3>' + newListsOnServer 
        + ' lists on server, but not this machine</h3><ul class="startCollapsed">' 
        + setLists + '</ul></div>' : '');
      for (var list in localLists) {
        setLists += '<div><h3 value="' + machineText(list) + '">' + humanText(list)
        + ' <a onclick="uploadList(this)">upload</a> <a onclick="toggleUl(this);">show</a></h3>'
        + '<ul class="startCollapsed">';
        for (var i in localLists[list]) {
          setLists += '<li>' + humanText(localLists[list][i]) + '</li>';
        }
        if (serverLists[list]) {
          setLists += showServerList(list);
        }
        setLists += '</ul>'
        + '</div>';
      }
      return setLists;
    });
       
    // Setlists done; now do slides.  Last svn downloaded are saved as "slideDatabase"
    var locallyStored = localStorage.getItem("slideCount") ? getStoredSlides() : slideDatabase;
    var forImmediateUpdate = locallyStored;
  
    var i = 0;
    for (var oSlide in serverDatabase) {
      if (locallyStored[oSlide]) {} else {
        var newSlide = array2slide(oSlide, serverDatabase[oSlide]);
        list.append(choice(++i, oSlide, 'Extra slide on server'));
        addChange(i, "Slide", "(nothing)", slidePreview(newSlide));
      }
    }

    for (oSlide in locallyStored) {
      // Load slide details
      var mySlide = new Slide(oSlide,
                          locallyStored[oSlide]["author"],
                          locallyStored[oSlide]["copyright"],
                          locallyStored[oSlide]["text"],
                          locallyStored[oSlide]["size"]);

      if (serverDatabase[oSlide]) {
        // A slide of this name exists on server
        var serverSlide = new Slide(oSlide,
                                serverDatabase[oSlide]["author"],
                                serverDatabase[oSlide]["copyright"],
                                serverDatabase[oSlide]["text"],
                                serverDatabase[oSlide]["size"]);
        if (locallyStored[oSlide]['modified']) {
          if (mySlide.text == serverSlide.text) {
            var modifications = $(document.createElement("div"));
            modifications.append("<h2>Modified slide in local storage" + 
              locallyStored[oSlide]['modified'] + ".</h2>");
            var modified = false;
            var props = Array("author", "copyright", "size");
            for (var prop in props) {
              if (serverDatabase[oSlide][props[prop]] != locallyStored[oSlide][props[prop]]) {
                if (!modified) {
                  list.append(choice(++i, oSlide, "Properties modified in local storage"));
                  modified = true;
                }
                addChange(i, props[prop], locallyStored[oSlide][props[prop]], serverDatabase[oSlide][props[prop]])
              }
            }
          } else {
            // Text modified
            list.append(choice(++i, oSlide, "Content modified in local storage")); // Header row
            addChange (i, "Slides", slidePreview(mySlide, "_mine", serverSlide), slidePreview(serverSlide, "_serv", mySlide));
          }
        } else {
          // Update from server without prompting
          forImmediateUpdate[oSlide] = (serverDatabase[oSlide] || locallyStored[oSlide])
          forImmediateUpdate[oSlide]['modified'] = false;
        }
      } else {
        // This is a new slide
        if (oSlide) {
          list.append(choice(++i, oSlide, "Extra slide in local storage"));
          addChange(i, "Slide", slidePreview(mySlide), "(nothing)");
        }
      }
    }
    setStoredSlides(forImmediateUpdate);
    list.append('<h2 style="margin-top:3em;">Enact the above changes</h2>'
      //+ '<form id="commitForm" method="post" action="http://www.geological-supplies.com/nlife/php/commit.php" onsubmit="commitChanges();">'
      //+ '<form id="commitForm" method="post" action="php/commit.php" onsubmit="commitChanges();">'
      //+ '<input type="button" class="bigButton" name="preview" value="Preview!" onclick="commitChanges();" />'
      //+ '<textarea name="newJSON" id="newJSON" rows=10></textarea>'
      //+ '<input type="text" name="newJSON" id="newJSON" />'
      + '<input type="button" class="bigButton" name="commit" value="Synchronize!" onclick="commitChanges();" />'
      + '<label for=commit id=ajaxResult>[Click to update the server]</label>'
      //+ '</form>'
      );
  }
  if (!document.location.href.match(serverURL)) {
    $('#flush').append('<br /><span>It might be worth running a SVN update before flushing.</span>');
  }   
 });

function choice(id, title, caption) {
  var out = $(document.createElement("div"));
  out.attr("id", "choice" + id);
  out.attr("choice", "none");
  out.attr("slideTitle", title.replace(/\s/g, "_"));
  out.append("<h2>" + parseSlideTitle(title) + ": " + caption + "</h2>");
  var row = $(document.createElement("div"));
  row.css("display", "table-row");
  row.addClass("shady");
  row.append("<div class='changelabel' id='label" + id + "' onclick='choose(\"none\", " + id + ")'><h3>Attribute</h3></div>")
  row.append("<div class='local changes' id='local" + id + "' onclick='choose(\"local\", " + id + ")'><h3>On this PC</h3></div>")
  row.append("<div class='server changes' id='server" + id + "' onclick='choose(\"server\", " + id + ")'><h3>On server</h3></div>")
  out.append(row);
  return out;
}

function addChange(i, label, pc, server) {
  var row = $(document.createElement("div"));
  var labelDiv = $(document.createElement("div"));
  var localDiv = $(document.createElement("div"));
  var serverDiv = $(document.createElement("div"));
  row.css("display", "table-row");
  labelDiv.addClass("changelabel");
  localDiv.addClass("local changes");
  serverDiv.addClass("server changes");
  localDiv.attr("i", i);
  serverDiv.attr("i", i);
  labelDiv.attr("i", i);
  serverDiv.attr("chosen", "server");
  localDiv.attr("chosen", "local");
  labelDiv.attr("chosen", "none");
  serverDiv.click(function() {choose("server", i);});
  localDiv.click(function() {choose("local", i);});
  labelDiv.click(function() {choose("none", i);});
  labelDiv.css("background-color", "rgba(255,80,0,0.2)");
  labelDiv.append(label);
  localDiv.append(pc);
  serverDiv.append(server);
  row.append(labelDiv); row.append(localDiv); row.append(serverDiv);
  $('#choice' + i).append(row);
}

function choose (choice, i) {
  $('[i="' + i +'"]').each(function(index) {
    $(this).css("background-color", ($(this).attr("chosen") == choice ? "rgba(" + (choice == "none" ? "255,0" : "0,255") + ",0,0.3)" : "inherit"));
  });
  $('#choice' + i).attr("choice", choice);
}

function commitChanges() {
  var toCommit = serverDatabase;
  var locallyStored = localStorage.getItem("slideCount") ? getStoredSlides() : slideDatabase;
  var forLocal = locallyStored;
  var addedSlides = '';
  var deletedSlides = '';
  var modifiedSlides = '';
  var serverModified = false;
  $("[i]").each(function (i) {
    var oSlide = $('#choice' + i).attr("slideTitle"); // This contains underscores
    switch ($('#choice' + i).attr("choice")) {
      case  "local":
        serverModified = true;
        if (locallyStored[oSlide]) {
          if (typeof serverDatabase[oSlide] != "undefined") {
            modifiedSlides += oSlide + "; ";
          } else {
            addedSlides += oSlide + "; ";
          }
          toCommit[oSlide] = (locallyStored[oSlide] || null);
        } else {
          deletedSlides += oSlide + "; ";
          delete toCommit[oSlide];
        }
        break;
      case "server":
        if (serverDatabase[oSlide]) {
          forLocal[oSlide] = (serverDatabase[oSlide] || null);
        } else {
          delete forLocal[oSlide];
        }
        break;
      case "none":
        // Do nothing;
        break;
    }
  });
  setStoredSlides(forLocal);
  var logMessage = (addedSlides ? "Added: " + addedSlides : "")
                 + (deletedSlides ? "Deleted: " + deletedSlides : "")
                 + (modifiedSlides ? "Modified (/added): " + modifiedSlides : "");

  // Add svn_log_message last; this will both provide a log message for the svn commit,
  // and act as a "end of file" marker to confirm that the connection has not been interrupted.
  toCommit["svn_log_message"] = (logMessage || "No details generated");
  if (serverModified) {
    $('#ajaxResult').html("Communicating with server; please don't close the window...");
    $('#commitButton').attr("disabled", "true");
    $.ajax({
      "url": "http://www.geological-supplies.com/nlife/php/commit.php",
      "data": toCommit,
      "type": "POST",
      "success": function (data) {
        $('#ajaxResult').html(data);
        $('#ajaxResult').css("opacity", "0");
        $('#ajaxResult').animate({"opacity":"1"}, 1800);
        $('#commitButton').attr("disabled", "false");
        }
    });
  } else {
    $('#ajaxResult').html("Slides in local storage updated from server.");
  }
}

function slidePreview(slide, id, cfSlide) {
  id = slide.underscoreTitle + (id || "");
  var text = "";
  var lines = slide.text.split("\n");
  var cfLine = cfSlide ? cfSlide.text.split("\n") : lines;
  for (var i in lines) {
    text += "<span class='newline" + (lines[i] == cfLine[i] ? "":  " differentline")
         + "'>" + lines[i].replace(/ /g, "&nbsp;") + "&nbsp;</span>";

  }
  return '<div class="slidewords">'
    + text
//    + ' <p class=toggle onclick="$(\'#' + id + '\').toggle()">[Toggle preview]</p>'
    + '</div>'
    + '<div class="slidecontent diffslide" id="' + id + '">'
    + '  <h1> ' + slide.parsedTitle + '</h1>'/*
    + ' <div><pre>[' + mySlide.text + ']</pre>'/**/
    + ' <div class="words">' + slide.preview /**/
    + ' </div>'
    + '</div>';
}

/* Generates slide content  and edit-boxes from json file / localStorage.

  if (localStorage.getItem("slideCount")) {
    parseDisplaySlides($('.presentation'), getStoredSlides());
  } else {
    parseDisplaySlides($('.presentation'), slideDatabase);
  }
});*/


function toggleUl(item) {
  var ul = $(item).parent().next("ul");
  if (ul.height() == 0) {
    ul.css('display', 'block');
    ul.css('height', 'inherit');
    var newHeight = ul.height();
    ul.css('height', '0');
    ul.animate({height:newHeight}, '300');
    $(item).html("hide")
  } else {
    ul.animate({height:'0px'}, '300');
    $(item).html("show")
  }
}

function uploadList(item) {
  var upList = machineText($(item).parent().attr('value'));
  var localLists = JSON.parse(localStorage.getItem('setLists') || '{}');
  serverLists[upList] = localLists[upList];
  console.log(serverLists);
  commitServerLists(function(data) {
      $(item).html('uploaded');
      console.log(data);
    });
}

function downloadList(item) {
  var downList = $(item).parent().attr('listName');
  var localLists = JSON.parse(localStorage.getItem('setLists') || '{}');
  console.log(localLists);
  console.log(serverLists[machineText(downList)]);
  localLists[machineText(downList)] = serverLists[machineText(downList)];
  console.log(localLists);
  localStorage.setItem('setLists', JSON.stringify(localLists));
  $(item).html('Downloaded');
}

function deleteList(item) {
  var list = $(item).parent().attr('listName');
  var sure = confirm('Are you sure you want to delete the set list "' + list
    + '"?  This cannot be undone!');
  if (sure) {
    serverLists[list] = undefined;
    commitServerLists(function (data) {
      $(item).html('Deleted from server');
      console.log(data);
    });
  }
}

function commitServerLists(callback) {
  $.ajax({
    url: "http://www.geological-supplies.com/nlife/php/setlists.php",
    //url: "../php/setlists.php",
    type: 'POST',
    data: serverLists,
    success: callback
  });
}