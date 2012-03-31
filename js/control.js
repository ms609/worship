/* localStorage variables: 
//
// setListLength:  slides in set list
// slide# : name of slide at position # in list.  First slide is 0.
// unusedSlideCount: number of (unused) slides in full list
// slideCount: total number of slides in presentation
// currentSlide: points to position of displayed slide in setListLength.  -1 is "welcome slide", 0 is top of setlist.
//
*/

var allSongTitles = [];
var slideshow;
var onScreenNow = '';
var slidePosition = {'sermon' : 0, 'announcements' : 0};

// Esoteric settings
var pathToAnnouncements = '../../announce/Announcements-ohp.html'; // Path to an announcements file using the S5 slideshow technique
var filesDir = '/announce/images'; // Files (JPGs, vidoes) put in this directory can be displayed in the slideshow window with the "Files" button.

$(document).ready(function() {
  if (!navigator.appVersion.match(/\bChrome\//)) {
    alert("You should use Google Chrome to access the worship manager.");
  }
  
  // Load user-specific settings
  if (!local.ccli) {
    addCoverFrame('Identify church', '<p>You need to specify the name of your \
    church, so that we can access your song database.</p>\n\
    <p><label for=churchName>Church name:</label>\
    <input id=churchName name=churchName></input></p><p id=confirmChurch></p>');
    $.ajax({
      url: serverURL + 'php/list_churches.php',
      success: function(list) {/*
        var myList = {};
        myList = list.split('\t');
        console.log(myList);*/
        $('#churchName').autocomplete({source: list.split('\t')});
      }
    }); 
    $('#churchName').on('click change keyup mouseover', allowChurchSelection);
    $('ul').on('click keyup keypress', allowChurchSelection);
  } else {
    personalize();
  }
  
  backToWelcomeSlide();
  if (localStorage.getItem('slideCount') > 0) {
    populateLists(JSON.parse(localStorage.getItem("slides")));
  } else {
    populateLists(slideDatabase);
  }
  var currentSetList = localStorage.getItem('currentSetList') || "New";
  $('#selectSetList option[innerHTML="' + titleSetList(currentSetList) + '"]').attr('selected', 'selected');
  $('#selectSetList').change(function() {
    loadSetList($(this).val());
  });
  $('#selectSetList').mousedown(function() {
    saveSetList(false);
  });
  
  $('#addWordsBox').keyup(function() {updateBlankSlide();});
  
  // Set up welcome slide button
  var welcomeButton = $('.setListItem').filter(':first');
  welcomeButton.bind('dragenter', function() {welcomeButton.addClass('over');});
  welcomeButton.bind('dragleave', function() {welcomeButton.removeClass('over');});
  welcomeButton.bind('dragover', function () {welcomeButton.addClass('over'); return false;});
  welcomeButton.bind('drop', function () {dragSource.css('opacity', 1);
    moveSetListItem(dragSource, welcomeButton);
  });
  
  // Set up announcement frame, which will start hidden
  var announcementFrame = $(document.createElement('iframe'));
  announcementFrame.attr('src', pathToAnnouncements + '#slide0');
  announcementFrame.attr('id', 'announcementPreview');
  announcementFrame.css('width', '100%');
  announcementFrame.css('height', '333px');
  announcementFrame.css('display', 'none');
  announcementFrame.load(function() {
    var ap = document.getElementById('announcementPreview').contentWindow;
    if (ap.document.getElementById('slideProj')) {
      ap.document.getElementById('slideProj').disabled = false;
      ap.toggle();
      ap.fontSize('0.66em');
    }
  });
  $('#setList').after(announcementFrame);
  
  var filesFrame = $(document.createElement('iframe'));
  filesFrame.attr('src', filesDir);
  filesFrame.attr('id', 'filesFrame');
  filesFrame.css('display', 'none');
  filesFrame.addClass('panel');
  $('#setList').after(filesFrame);
  $('#setList').after('<div class=setList id=filesList><ul id=filesUl></ul></div>');
  filesFrame.load(function() {
    var filesDoc = document.getElementById('filesFrame').contentWindow.document;
    var countLinks = filesDoc.links.length;
    var link = "";
    var linkLi = [];
    for (var i = 1; i < countLinks; i++) {
      link = filesDoc.links[i].href;
      linkLi[i] = $(document.createElement('li'));
      linkLi[i].html(link.replace(/^.*\//, ''));
      linkLi[i].attr('link', link);
      linkLi[i].bind('click', function() {
        onScreenNow = 'file'
        slideshow.location.href = $(this).attr('link');
      });
      $('#filesUl').append(linkLi[i]);
    }
  });
  activeView('setList');
  
  activatePreviews();
});


$(window).focus(function() {
  if (slideshow && onScreenNow == 'songs' && localStorage.getItem('currentSlide') > -1) {
    showSlideCalled(localStorage.getItem('slide'
      + localStorage.getItem('currentSlide')), true);
  }
});

$(window).bind('beforeunload', function() {
  var slidesClosed = slideshow 
                    ? (confirm("Really close slide-show?")
                      ? closeSlides(true)
                      : false)
                    : true;
  if (slidesClosed) {
    return null;
  } else {
    return "Stay on this page?!";
  }
});

function allowChurchSelection(event) {
  setTimeout(function() {$.ajax({
    url: serverURL + 'php/get_ccli.php',
    data: {name: $('#churchName').val()},
    success: function (data) {
      if (data) {
        $('#confirmChurch').html("CCLI#: <span id=CCLI>" + data + '</span> <input id=confirmButton\
         onclick="confirmCCLI()" value="Confirm" type="button" />');
      } else if ($('#churchName').val().length > 3) {
        $('#confirmChurch').html('Add church? (not implemented)'); // TODO!
      } else $('#confirmChurch').html('');
    }
  });}, 100);
}

function confirmCCLI() {
$('#confirmButton').val('Confirming...');
$.ajax({
  url: serverURL + 'php/get_data.php',
  data: {ccli: $('#CCLI').html()},
  success: function (data) {
    local = JSON.parse(data);
    localStorage.setItem('ccli', local.ccli);
    localStorage.setItem('churchName', local.name);
    localStorage.setItem('background', local.background);
    localStorage.setItem('worshipSlide', local.worship);
    clearSetList();
    $('#fullList option').remove(); 
    slideDatabase = JSON.parse(local.songs);
    populateLists(slideDatabase);

    personalize();
    removeCoverFrame();
  }});
}

function personalize() {
  document.title = 'Worship Slide Control | ' + local.name;
  if (local.background) $('.slidecontent').css({'background-image': 'url(' + local.background + ')'});
}

function addToSetList() {
  var selected = $.map($('#fullList :selected'), function(e) {return machineText($(e).text());});
  $('#fullList :selected').remove();
  $('#searchBox').val("");
  updateSearch();
  var i = localStorage.getItem('setListLength');
  for (var item in selected) {
    newSetListItem(selected[item], i); // don't increment yet, because numbering started at 0
    localStorage.setItem('slide' + i++, machineText(selected[item]));
  }
  localStorage.setItem('setListLength', i);
  updateHilite();
  activatePreviews();
}

function newSetListItem(item, i) {
  var add = $(document.createElement("div"));
  add.addClass("setListItem");
  add.val(item);
  add.attr("position", i);
  add.attr("id", "setListSong" + i);
  add.attr("draggable", true);
  add.css("opacity", "0.1"); // will be animated in
  add.dblclick(function() {toSelected(this);});
  add.bind('dragstart', function () {add.css('opacity', '0.4');
      dragSource = add;
    });
  add.bind('dragend', function () {add.animate({'opacity' : 1});});
  add.bind('dragenter', function() {add.addClass('over');});
  add.bind('dragleave', function() {add.removeClass('over');});
  add.bind('dragover', function () {add.addClass('over'); return false;});
  add.bind('drop', function () {
    if (dragSource != add) moveSetListItem(dragSource, add);
  });
  add.bind('dragend', function() {$('.setListItem').removeClass('over');});
  
  var title = $(document.createElement("span"));
  title.html(parseSlideTitle(item));
  title.addClass("setListTitle");

  var x = $(document.createElement("span"));
  x.html("&times;");
  x.addClass("rmButton");
  x.click(function () {removeSetListItem($(this).parent());});

  var ed = $(document.createElement("span"));
  ed.html("&#9997;");
  ed.addClass("editButton");
  ed.click(function () {editSong($(this).parent());});

  var showNow = $(document.createElement("span"));
  showNow.html("&#9654;");
  showNow.addClass("showNowButton");
  showNow.click(function () {itemToScreen($(this).parent().attr('position'));});

  add.append(x);
  add.append(ed);
  add.append(title);
  add.append(showNow);
  $("#setList").append(add);
  add.animate({opacity:1}, 150);
  $('#fullList option[value="' + machineText(item) + '"]').remove() ;
}

function moveSetListItem(from, to) {
  to.after(from);
  var newPosition = function () {
    var oldPos = from.attr('position');
    var newPos = to.attr('position');
    var currentSlide = localStorage.getItem('currentSlide');
    if (currentSlide == oldPos) return (oldPos > newPos ? ++newPos : newPos);
    if (currentSlide == newPos) return (oldPos > newPos ? currentSlide : --currentSlide);
    if (currentSlide > oldPos && currentSlide < newPos) return --currentSlide;
    if (currentSlide < oldPos && currentSlide > newPos) return ++currentSlide;
    return currentSlide; 
  };
  localStorage.setItem('currentSlide', newPosition());
  var i = -1; // to include the welcome slide
  $('#setList').children().each(function() {
    if (i > -1) {
      $(this).attr('position', i);
      $(this).attr('id', 'setListSong' + i);
      localStorage.setItem('slide' + i, $(this).val());
    }
    ++i;
  });
  updateHilite();
}

function clearSetList() {
  $('.setListItem').each(function (index) {
    if (index > 0) {
      addFullListItem($(this).val());
      localStorage.removeItem('slide' + index);
      $(this).remove();
    }
  });
  var fullList = document.getElementById('fullList');
  var replaceFullList = removeToInsertLater(fullList);
  sortFullList();
  replaceFullList();
  updateSearch();
  activatePreviews();
  localStorage.setItem("setListLength", 0);
}

// item should be an $ object
function removeSetListItem(item) {
  addFullListItem(machineText(item.find('.setListTitle').html()));
  var fullList = document.getElementById('fullList');
  var replaceFullList = removeToInsertLater(fullList);
  sortFullList();
  replaceFullList();
  updateSearch($("#fullTextSearch").val);
  activatePreviews();
  var iPosition = -1;
  var oPosition = item.attr("position");
  if (oPosition == localStorage.getItem('currentSlide')) {
    localStorage.setItem('currentSlide', localStorage.getItem('currentSlide') - 1);
  } // TODO:  allow use of slides not in list
  $('.setListItem').each( function (index) {
    var listItem = $(this);
    iPosition = 1 * listItem.attr("position");
    if (iPosition > oPosition) {
      listItem.attr("position", iPosition - 1);
      localStorage.setItem('slide' + (1 * iPosition - 1), machineText(listItem.attr("value")));
    }
  });
  
  localStorage.setItem('setListLength', (1 * localStorage.getItem('setListLength') - 1));
  localStorage.removeItem('slide' +  localStorage.getItem("setListLength")); // after reduction, because slides start at 0
  
  item.animate({
    opacity: '0',
    left: '-=300'
    }, 280, function () {item.remove();});
}

function renameSetListItem(oldName, newName) {
  var myItem = $('#setList').find('[value="' + oldName + '"]');
  if (newName) {
    myItem.val(newName);
    myItem('setListTitle').html(parseSlideTitle(newName));
  } else {
    myItem.destroy();
  }
}

// item should be an $ object
function moveUpSetList(item) {
  var oPosition = item.attr("position");
  if (oPosition > 0) {
    var theAbove = $('#setList').find("[position=" + (1 * oPosition - 1) + "]");
    item.attr("position", oPosition - 1);
    theAbove.attr("position", oPosition);
    localStorage.setItem("slide" + oPosition, machineText(theAbove.attr("value")));
    localStorage.setItem("slide" + (1 * oPosition - 1), machineText(item.attr("value")));
    theAbove.animate({top: "40"}, 200);
    item.animate({top: "-40"}, 200, function () {
      item.insertBefore(theAbove);
      item.css("top", 0);
      theAbove.css("top", 0);
    });
    var currentSlide = localStorage.getItem('currentSlide');
    if (oPosition == currentSlide) {
      localStorage.setItem('currentSlide', --currentSlide);
    } else if (oPosition == ++currentSlide) {
      localStorage.setItem('currentSlide', currentSlide);
    }
    updateHilite();
  }
}

// item should be an $ object
function moveDownSetList(item) {
  var oPosition = item.attr("position");
  if (oPosition < localStorage.getItem('setListLength') - 1) {
    var theBelow = $('#setList').find("[position=" + (1 * oPosition + 1) + "]");
    item.attr("position", 1 * oPosition + 1);
    theBelow.attr("position", oPosition);
    localStorage.setItem("slide" + oPosition, machineText(theBelow.attr("value")));
    localStorage.setItem("slide" + (1 * oPosition + 1), machineText(item.attr("value")));
    theBelow.animate({top:'-40'}, 200);
    item.animate({top: "40"}, 200, function () {
      item.insertAfter(theBelow);
      item.css("top", 0);
      theBelow.css("top", 0);
    });
    var currentSlide = localStorage.getItem('currentSlide');
    if (oPosition == currentSlide) {
      localStorage.setItem('currentSlide', ++currentSlide);
    } else if (oPosition == --currentSlide) {
      localStorage.setItem('currentSlide', currentSlide);
    }
    updateHilite();
  }
}

function populateSetListSelector() {
  // Populate list of saved setlists
  var setListTitles = [];
  var setLists = JSON.parse(localStorage.getItem('setLists'));
  for (var list in setLists) {
    setListTitles[list] = $(document.createElement("option"));
    setListTitles[list].html(titleSetList(list));
    setListTitles[list].val(titleSetList(list));
    $('#selectSetList').append(setListTitles[list]);
  }
  var activeList = localStorage.getItem('currentSetList') || "New";
  $('#selectSetList option:selected').removeAttr("selected");
  $("#selectSetList option[value='" + titleSetList(activeList) + "']").attr("selected", "selected");
}

function populateLists(JSONData) {
  var i = 0;
  var setSongs = [];
  var options = [];
  var val = localStorage.getItem('slide' + i);
  populateSetListSelector();
  
  // Populate the current set list //

  // Items currently in our localStorage as a slide, i.e. in set list.  Start numbering at 0.
  // val is the song's name
  while (val) {
    newSetListItem(val, i);
    setSongs[val] = true;
		// Increment val to next song
    val = localStorage.getItem("slide" + ++i)
  }
  localStorage.setItem("setListLength", i);

  var j = 0;
  var k = 1;
  JSONData = sortArray(JSONData);
  var fragment = document.createDocumentFragment();
  for (var title in JSONData) {
    if (title) {
      allSongTitles[++j] = machineText(title);
    }
    if (title.length > 0 && !setSongs[title]) {
      options[k] = document.createElement("option");
      options[k].value = title;
      options[k].innerHTML = humanText(title);
      options[k].id = "unusedSong" + k;
      $(options[k]).dblclick (function() {optionToSelected(this);});
      fragment.appendChild(options[k++]);
    }
  }
  $("#fullList").append(fragment);
  var fullList = document.getElementById('fullList');
  var replaceFullList = removeToInsertLater(fullList);
  sortFullList();
  replaceFullList();
  localStorage.setItem('unusedSlideCount', k);
  localStorage.setItem('slides', JSON.stringify(JSONData));
  localStorage.setItem('slideCount', i + k);
}

function addSearchResult() {
  var results = $('#fullList option');
  if ($('#searchBox').val() && $(results[0]).css('visibility') == 'visible') {
    if ($('#fullList option:selected').length == 0) {
      $(results[0]).attr('selected', 'selected');
    }
    addToSetList();
  }
  return false; // to stop form submission
}

function addFullListItem(song) {
  if ($('#fullList option[value="' + machineText(song) + '"]').length == 0) {
    var listItem = $(document.createElement("option"));
    listItem.val(machineText(song));
    listItem.html(humanText(song));
    var listLength = localStorage.getItem('unusedSlideCount');
    listItem.attr("id", "unusedSong" + listLength);
    localStorage.setItem('unusedSlideCount', ++listLength);
    $("#fullList").append(listItem);
  }
}

function highlight(item) {
  item.css("padding", "10px");
  item.css("opacity", "0.6");
  item.animate({
    padding: "2px",
    opacity: "1"
    });
}

// moveOptionsUp
//
// move the selected options up one location in the select list
//
function moveOptionsUp(selectId) {
 var selectList = document.getElementById(selectId);
 var selectOptions = selectList.getElementsByTagName('option');
 for (var i = 1; i < selectOptions.length; i++) {
  var opt = selectOptions[i];
  if (opt.selected) {
   selectList.removeChild(opt);
   selectList.insertBefore(opt, selectOptions[i - 1]);
     }
    }
   setListToStorage();
}

// moveOptionsDown
//
// move the selected options down one location in the select list
//
function moveOptionsDown(selectId) {
 var selectList = document.getElementById(selectId);
 var selectOptions = selectList.getElementsByTagName('option');
 for (var i = selectOptions.length - 2; i >= 0; i--) {
  var opt = selectOptions[i];
  if (opt.selected) {
   var nextOpt = selectOptions[i + 1];
   opt = selectList.removeChild(opt);
   nextOpt = selectList.replaceChild(opt, nextOpt);
   selectList.insertBefore(nextOpt, opt);
     }
    }
   setListToStorage();
}

function setListToStorage() {
	// Wipe memory
	var unusedSlideCount = localStorage.getItem("unusedSlideCount");
	for (var i = 0; i <= unusedSlideCount; ++i) {
		localStorage.setItem('slide' + i, '');
	}
	
	// Save each song as its own localStorage item
	var setListItems = $('.setListItem');
  var setListLength = setListItems.length;
	for (i = 0; i < setListLength; ++i) {
		localStorage.setItem('slide' + i, machineText(setListItems[i].val));
	}
	// Save number of slides
	localStorage.setItem('setListLength', setListLength);
}

function startSlideshow(callback) {
  slideshow = window.open(getUrl(onScreenNow || 'welcome'), "SlideShowWindow", "resizable=1,width=400,height=300,location=0");
  slideshow.moveTo(1138,0);
  if (callback) {
    setTimeout(callback, 250);
  }
  document.getElementById("nextButton").disabled = false;
  document.getElementById("previousButton").disabled = false;
  document.getElementById("closeButton").disabled = false;  
}

function backToWelcomeSlide() {
  localStorage.setItem("currentSlide", "-1"); // TODO use a global var instead of local Storage
  setScreen('welcome');
  updateHilite();
}

function getSlide (posInList) {
  return $('[position=' + posInList + ']').attr('value');
}

function previousSlide() {
  var i = localStorage.getItem("currentSlide");
  // -1 is the welcome slide; first slide is #0
  if (i < 1) {
    backToWelcomeSlide();
    i = -1;
  } else {
    var prevSlideName = localStorage.getItem("slide" + --i);
    if (prevSlideName) {
      showSlideCalled(prevSlideName);
    } else {
      // Slides must have been removed from setlist; re-set i...
      i = localStorage.getItem("setListLength") - 1;
      showSlideCalled(localStorage.getItem("slide" + i));
    }
    hiliteItem(i);
  }
  localStorage.setItem("currentSlide", i);
}

function advanceSlide() {
  var i = 1 * localStorage.getItem("currentSlide");
  if (++i >= 1 * localStorage.getItem("setListLength")) {
    if (i - 1 >= 1 * localStorage.getItem("setListLength")) {
      i = 1 * localStorage.getItem("setListLength");
    }
    var nextSlide = localStorage.getItem('slideCount') * 1 + 1; // go to final slide.  Add 1 because of the blank slide.
    showSlideCalled(nextSlide);
  } else {
    showSlideCalled(localStorage.getItem("slide" + i));
    hiliteItem(i);
  }
  localStorage.setItem("currentSlide", i);
  return true;
}

function advanceAnnouncements() {
  // copied from slideshow.clicker()
 if (!slideshow.incrementals[slideshow.snum] || slideshow.incpos >= slideshow.incrementals[slideshow.snum].length) {
    slideshow.go(1);
  } else {
    slideshow.subgo(1);
    document.getElementById('announcementPreview').src = document.getElementById('announcementPreview').src.replace(/slide\d+/, 'slide' + slideshow.snum)
  }
  slidePosition[onScreenNow] = slideshow.snum;
}

function reverseAnnouncements() {
  if (!slideshow.incrementals[slideshow.snum] || slideshow.incpos <= 0) {
    slideshow.go(-1);
  } else {
    slideshow.subgo(-1);
  }
}

function itemToScreen(itemNumber) {
  if (screenOpen()) {
    setScreen('songs');
    showSlideNumbered(itemNumber);
    hiliteItem(itemNumber);
    localStorage.setItem("currentSlide", itemNumber);
  } else {
    onScreenNow = 'songs';
    startSlideshow('itemToScreen(' + itemNumber + ')');
  }
}

function previewSlide(title) {
  var slide = new Slide (title);
  $('#preview').html(slide.parsedSlide);
}

function activatePreviews () {
  $('.setListItem').not(':first').mouseover(function() {
    previewSlide(machineText($(this).find('.setListTitle').html()));
  });
  
  $('#fullList option').mouseover(function() {
    previewSlide(this.value);
  });
}

function showSlideNumbered (i) {
  if (localStorage.getItem('slide' + i) != "") {
    showSlideCalled(localStorage.getItem('slide' + i));
  }
}

function showSlideCalled(title) { 
  if (title) {
    var slide = new Slide(machineText(title));
    if (screenOpen()) {
      if (onScreenNow != 'songs') {
        setScreen('songs');
      }
      if (slideshow.document.getElementById('slide')) {
        var screen = $(slideshow.document.getElementById('slide'));
        screen.html(slide.slideContent);
        if (screen.is(':hidden')) {
          screen.fadeIn(300);
        }
      } else {
        setTimeout('showSlideCalled("' + title + '")', 80);
      }
    } else {
      startSlideshow();
      setTimeout('showSlideCalled("' + title + '")', 250);
    }
  } else {
    setScreen('welcome');
  }
}

function updateBlankSlide() {
  if (slideshow && onScreenNow == 'blankSlide') {
    var slide = $(slideshow.document.getElementById('slide'));
    slide.html(parseDivs(parseSlide($('#addWordsBox').val())));
  }
}

function showCurrentSlide() {
  if (localStorage.getItem('currentSlide') > -1) {
    showSlideCalled(localStorage.getItem("slide" + localStorage.getItem("currentSlide")));
  } else {
    setSlide('welcome');
  }
}

function updateHilite() {
  hiliteItem(localStorage.getItem("currentSlide"));
}

function hiliteItem(i) {
  i = 1 * i;
  $(".setListItem").each(function (t) {
    var oItem = $(this);
    switch(1 * oItem.attr("position")) {
      case i:
        oItem.css("background-color", "#abed51");
        oItem.animate({
          left: 5
        });
      break;
      case 1 * 1 + i:
          oItem.css("background-color", "#bfbbbb");
          oItem.animate({
            left: 2
          });
      break;
      default:
        oItem.css("background-color", "#eee");
        oItem.animate({
          left: 0
        });
    }
  });
}

function closeSlides(confirmed) {
  if (screenOpen()) {
    if (!confirmed) {
      confirmed = confirm("Really?  This will close the slideshow window...");
    }
    if (confirmed) {
      slideshow.close();
      slideshow = null;
      $("option").css("background-color", "");
      document.getElementById("nextButton").disabled = true;
      document.getElementById("previousButton").disabled = true;
      document.getElementById("closeButton").disabled = true;
      return true;
    } else return false;
  }
  return true;
}

function toSelected(caller) {
  if (!$("#closeButton").attr("disabled")) {
    showSlideCalled($(caller).val());
    var i = $(caller).attr("position");
    hiliteItem(i);
    localStorage.setItem("currentSlide", i);
  }
}

function optionToSelected(caller) {
  if (!$("#closeButton").attr("disabled")) {
    showSlideCalled($(caller).val());
  } else {
    addToSetList();
  }
}

function titleSetList(name) {
  return (humanText(name) || "Untitled") + " set list";
}
function detitleSetList(name) {
  return name ? name.substr(0, name.length - titleSetList("1").length + 1) : "Untitled";
}

function setListContents() {
  var contents = {};
  for (var i = 0; i < localStorage.getItem('setListLength'); ++i) {
    contents[i] = localStorage.getItem('slide' + i);
  }
  return contents;
}

function saveSetList(fromButton) {
  var oldName = detitleSetList($("#selectSetList option:selected").html());
  var newName = oldName;
  if (fromButton) {
    newName = prompt("Name this setlist?", (oldName == "New")?"":oldName);
  }
  while (newName == "") {
    newName = prompt("You need to provide a name:", "Unnamed ");
  }
  if (!newName) return false;
  // Cancel will return without doing anything.
  oldName = machineText(oldName);
  newName = machineText(newName);
  var setLists = JSON.parse(localStorage.getItem('setLists')) || {};
  localStorage.removeItem(oldName);
  var contents = setListContents();
  setLists[newName] = (contents[0] || newName == "New") ? contents : undefined;
  $("#selectSetList option").remove();
  localStorage.setItem('currentSetList', newName);
  localStorage.setItem('setLists', JSON.stringify(setLists));
  populateSetListSelector();
  return true;
}
// TODO.  If SETLIST A is loaded in control.html, then go to diff.html to download an updated version of SETLIST A,
//  then the one that was in control.html will override the downloaded version.
function loadSetList(title) {
  //var oldList = localStorage.getItem('currentSetList');
  var listName = machineText(detitleSetList(title));
  var setLists = JSON.parse(localStorage.getItem('setLists'));
  var newList = setLists[listName];
  clearSetList();
  for (var song in newList) {
    newSetListItem(newList[song], song);    
    localStorage.setItem("slide" + song, newList[song])
  }
  var fullList = document.getElementById('fullList');
  var replaceFullList = removeToInsertLater(fullList);
  sortFullList();
  replaceFullList();
  updateSearch();
  activatePreviews();
  localStorage.setItem("setListLength", song * 1 + 1);
  localStorage.setItem('currentSetList', listName);
}

function toFiles() {
  activeView('files');
}

function toAnnouncements() {
  setScreen('announcements');
}

function toSermon() {
  setScreen('sermon');
  $("#launchButton").val("Worship");
  activeView('announcementPreview');
  document.getElementById('announcementPreview').contentWindow.deAbsolutify();
}

function toBlankSlide() {
  if (onScreenNow == 'songs') {
    $(slideshow.document.getElementById('slide')).fadeOut(1400, function() {
      setScreen('blankSlide');
    });
  } else {
    setScreen('blankSlide');
  }     
}
// TODO: when adding a slide and pressing 'esc' to close the add slide dialog, the slideshow screen goes blank

function setScreen(view) {
  switch (view) {
    case 'announcements': case 'sermon':
      $("#launchButton").val("Worship");
      activeView('announcementPreview');
      document.getElementById('announcementPreview').src = getUrl(view);
      setTimeout("document.getElementById('announcementPreview').contentWindow.deAbsolutify()", 300);
    break;
    case 'songs':
      if (onScreenNow != 'songs') {
        if (localStorage.getItem('currentSlide') > -1) {
          setTimeout('showSlideNumbered(localStorage.getItem("currentSlide"), "setscreen")', 200);
        } else {
          return setScreen('welcome');
        }
      }
      activeView('setList');
    break;
    case 'blankSlide':
      setTimeout('updateBlankSlide()', 300);
      activeView('setList');
    break;
    case 'welcome':
      $("#fullTextSearch").attr("checked", true);
      activeView('setList');
    break;
  }
  if (screenOpen()) {
    if (typeof(onScreenNow) != 'undefined' && view == onScreenNow) {
      return false;
    } else {
      onScreenNow = view;
      var targetUrl = getUrl(view);
      slideshow.location.href = targetUrl;
      slideshow.focus();
      return true;
      }
  } else {
    onScreenNow = view;
    startSlideshow();
    return true;
  }
}

function screenOpen () {
  return slideshow && !slideshow.closed;
}

function getUrl(view) {
  switch (view) {
    case 'songs' : case 'blankSlide' : return 'slides.html';
    case 'announcements' : return pathToAnnouncements + '#slide' + slidePosition['announcements'];
    case 'sermon' : return '../../announce/Sermon-ohp.html#slide' + slidePosition['sermon'];
    case 'welcome' : return 'welcome.html';
  }
};
  

function activeView(view) {
  $('#announcementPreview').css('display', 'none');
  $('#setList').css('display', 'none');
  $('#filesList').css('display', 'none');
  $('#' + view).css('display', 'block');    
  
  switch (view) {
    case 'setList':
      $("#nextButton").unbind();
      $("#nextButton").bind ("click", function () {advanceSlide();});
      $("#previousButton").unbind();
      $("#previousButton").bind ("click", function () {previousSlide();});
    return true;
    case 'announcementPreview': case 'sermon':
      $("#nextButton").unbind();
      $("#nextButton").bind("click", function () {advanceAnnouncements();});
      $("#previousButton").unbind();
      $("#previousButton").click(function () {reverseAnnouncements();});
    return false;
  }
}

function searchKeyPress (e) {
  var nowSelected = $('#fullList option:selected');
  switch(event.keyCode) {
    case 27: // escape
      $('#searchBox').val("");
      updateSearch();
      break;
    case 38: // up arrow
    // up key
    if (nowSelected.length == 0) {
      $('#fullList option').last().attr('selected', true);
    } else {
      nowSelected.prev().attr('selected', true);
      nowSelected.attr('selected', false);
      // Move caret to end
      $('#searchBox').val($('#searchBox').val());
    }
    break;
    case 40: // down arrow
    if (nowSelected.length == 0) {
      $('#fullList option').first().attr('selected', true);
    } else {
      nowSelected.next().attr('selected', true);
      nowSelected.attr('selected', false);
    }
    break;
  }
}


// Functions to add songs
function addSong() {
  addCoverFrame('Add a slide', '\
      <p>Paste guitar tab (in <span style="font-family:\'Arial narrow\'">Arial Narrow</span> font) directly into the boxes below; as far as possible,\
      this will automatically be rendered for print and for presentation-mode display (see guide below).</p>\
      <div class=handout style="width: 800px;">\
        <div id="rightP" style="float:right; width: 400px;">\
          <div id="slidePreview" class="slidecontent">\
            <h1 id="previewTitle">Slide preview</h1>\
            <div class="words" id="slideText">\
            </div>\
          </div>\
        </div>\
      <div style="float:left; width: 380px;">\
        <label for="title">Title: </label>\
        <input type="text" required="required" class="title" name="title" id="songTitle" tabindex="1"\
          placeholder="Add new slide" onKeyUp="updateSlide();" />\
      <textarea name="text" id="editText" rows="17" tabindex="2"\
              onKeyUp="updateSlide();" style="width:100%;"></textarea>\
      </div>\
    </div>\
    <div class="handout" id="rubric" style="clear:both;">\
      <label for="author">Author: </label>\
      <input type="text" name="author" id="authorName" tabindex="3"\
             onKeyUp="updateSlide();" />\
      <label for="copyright">Copyright: &copy;</label>\
      <input type="text" id="copy" tabindex="4"\
                    name="copyright" onKeyUp="updateSlide();" />\
      <label for="size">Display font size: </label>\
      <input type="text" id="fontSize" onKeyUp="updateSlide();" name="size" tabindex="5"\
             size="3" maxlength="5" />%\
      <p id="slideUpdate"><input type="button" onclick="addSlide();"\n\
        value="Add this slide " tabindex="8" /><span id=updateMsg></span></p>\
      <h3>Formatting commands</h3>' + formattingCommands + '</div>\
  '); 
}

function editSong(container) {
  var song = new Slide(machineText(localStorage.getItem('slide' + $(container).attr('position'))));
  addCoverFrame('Edit slide: <span id="originalTitle" slidePos="'
    + $(container).attr('position') + '">' + humanText(song.title) + '</span>',
      '<div class=handout style="width: 800px;">\
        <div id="rightP" style="float:right; width: 400px; position: relative">\
          <div id="slidePreview" class="slidecontent">'
        + song.slideContent
        + '</div>\
        </div>\
      <div style="float:left; width: 380px;">\
        <label for="title">Title: </label>\
        <input type="text" class="title" name="title" id="songTitle" tabindex="1"\
          placeholder="' + song.plainTitle + '" value="' + song.plainTitle + '"\n\
          onKeyUp="updateSlide();" />\
      <textarea name="text" id="editText" rows="17" tabindex="2"\
              onKeyUp="updateSlide();" style="width:100%;">' + song.text + '</textarea>\
      </div>\
    </div>\
    <div class="handout" id="rubric" style="clear:both;">\
      <label for="author">Author: </label>\
      <input type="text" name="author" id="authorName" tabindex="3"\
             onKeyUp="updateSlide();" value="' + song.author + '" />\
      <label for="copyright">Copyright: &copy;</label>\
      <input type="text" id="copy" tabindex="4" value="' + song.copyright + '"\
                    name="copyright" onKeyUp="updateSlide();" />\
      <label for="size">Display font size: </label>\
      <input type="text" id="fontSize" onKeyUp="updateSlide();" name="size" tabindex="5"\
             size="3" maxlength="5"  value="' + song.size + '" />%\
      <p id="slideAddition"><input type="button" onclick="doEdit();" value="Update now" tabindex="8" /><span id=additionMsg></span></p>\
      <h3>Formatting commands</h3>\
      <ul style="font-size:smaller;">\
        <li>#Chorus <br /> marks out the following block of text as a chorus.  (Not case-sensitive.)'
      + formattingCommands + '</div>\
  '); 
}

function editSettings() {
  addCoverFrame('Church settings: CCLI # ' + local.ccli,
      '<div>\
         <p><form><label for=name>Church name:</label><input name="name" id="newName" value="'
    + local.name + '" /><input type=button value="Update" onclick="updateName();">\
    <span id="nameStatus"></span></form></p>\
         <iframe class="upload" src="' + serverURL + 'php/upload_background.php?ccli='
          + local.ccli + '" />\
          <input type="button" value="Update" onclick="updateBackground();" />\
      <p><form enctype="multipart/form-data"><label for=welcome>Welcome slide:</label><input name="welcome"\
          id="welcomeImage" type="file"\
          alt="Upload an image to use as a \'Welcome slide\'" />\
          <input type=button value="Update"></p>\
    <span id="welcomeStatus"></span></form></p>\
        </div>\
  ');
}

function updateName() {
  var myData = {
    'ccli' : local.ccli,
    'name' : $('#newName').val()
  };
  $.ajax({
    url: serverURL + 'php/put_data.php',
    type: 'POST',
    data: myData,
    success: function(json) {
      $('#nameStatus').html('Updated. ' + json);
      local.name = $('#newName').val();
      localStorage.setItem('churchName', $('#newName').val());
      personalize();
    }
  });
}

function updateBackground () {
  $.ajax({
    url: serverURL + 'php/get_background.php',
    data: {ccli: local.ccli},
    success: function(data) {
      localStorage.setItem('background', data);
      local.background = data;
      personalize();
    }
  }); 
}

function addCoverFrame(title, content) {
  $(document).keyup(function(e) {
      if (event.keyCode == 27) {
        removeCoverFrame();
        $(document).unbind('keyup');
      }
    });
  var coverFrame = $(document.createElement('div'));
  coverFrame.addClass('greyOut');
  coverFrame.attr('id', 'coverFrame');
  coverFrame.append('<div class="slide" id="slideNew">\
    <div id=coverFrameTitle>' + title
    + '<span onclick="removeCoverFrame()" id=removeCoverFrame>[x]</span></div>\
      <div id=slideNewContent>'
    + content + '</div></div>'
  );
  $('body').append(coverFrame);  
}

function removeCoverFrame() {
  $('#coverFrame').remove();
}

function changeSettings() {
  addCoverFrame('Settings problem.');
}

function userSlide() {
  return new Slide (
      $('#songTitle').val() ? $('#songTitle').val() : "Untitled slide",
      $('#authorName').val(),
      $('#copy').val(),
      $('#editText').val(),
      $('#fontSize').val());
 }
 
function updateSlide() {
  $('#slidePreview').html(function() {
    var song = userSlide();
    return song.slideContent;
  });
}

function addSlide() {
  localStorage.setItem('slideCount', localStorage.getItem('slideCount') + 1);
  if ($('#songTitle').val() != "") {
    var storedSlides = getStoredSlides(true); // TODO check whether we can replace with JSON.parse(localStorage.getItem("slides")); to dispence with localStorage.js
    storedSlides[machineText($('#songTitle').val())] = {
      "size": $('#fontSize').val(),
      "author":  $('#authorName').val(),
      "copyright": $('#copy').val(),
      "text": $('#editText').val(),
      "localMods": true
    };
    if (slideshow && slideshow.location) {
      slideshow.location.reload(true);
    }
    setStoredSlides(storedSlides);
    $('#setList').empty();
    $('#fullList').empty();
    populateLists(JSON.parse(localStorage.getItem("slides")));
    // Clear the Add Slide dialog
    $('input[type=text]').each( function () {
      $(this).val("");
    });
    $('#additionMsg').html("<span>Slide added successfully.<br />\
    <a href='edit.html'>Edit slides?</a>\n\
    <a href='diff.html'>Sync to server?</a>\n\
    <a href='javascript:removeCoverFrame()'>Close this window</a>\n\
</span>");
    $('textarea').val("");
    updateSlide();
    updateSearch(form.fullTextSearch.checked);
    activatePreviews();
  } else {
    $('#updateMsg').html("<p>Slide not added - specify a title</p>");
  }
}

function doEdit() {
  var original = new Slide (machineText($('#originalTitle').html()));
  original.position =  $('#originalTitle').attr('slidePos');
  var current = userSlide();
  if (original.title != current.title) {
    localStorage.setItem('slide' + original.position, current.underscoreTitle);
    $('#setListSong' + original.position + ' .setListTitle').html(current.title);
    $('#setListSong' + original.position).val(current.underscoreTitle);
    $('#originalTitle').html(current.title);
    delete slideDatabase[original.underscoreTitle];
    // rename song where it appears in saved setlists
    var setLists = JSON.parse(localStorage.getItem('setLists'));
    for (var list in setLists) {
      for (var oSong in setLists[list]) {
        if (setLists[list][oSong] == original.underscoreTitle) {
          setLists[list][oSong] = current.underscoreTitle;
        }
      }
    }
    localStorage.setItem('setLists', JSON.stringify(setLists));
  }
  slideDatabase[current.underscoreTitle] = {
    'author' : current.author,
    'copyright' : current.copyright,
    'modified' : true,
    'size' : current.size,
    'text' : current.text
  }
  localStorage.setItem('slides', JSON.stringify(slideDatabase));
  if (original.position == localStorage.getItem('currentSlide')) {
    showSlideCalled(current.underscoreTitle);
  }
  activatePreviews();
  $('#additionMsg').html("<p>Slide updated.  <a title='Close this screen' \
      href='javascript:removeCoverFrame();'>\
      Click here</a> or press <code>Esc</code> to close this window.</p>");
}

var formattingCommands = 
      '<ul style="font-size:smaller;">\
        <li>#Chorus <br /> marks out the following block of text as a chorus.  (Not case-sensitive.)\
        <ul>\
          <li>#Chorus 2, #Bridge, #Middle 8, #Outro<br />\
                  alternatives will use different colours on slides and different indentation on print</li>\
          <li>#blue, yellow, indent, italic, white, etc<br />\
                   format this chorus accordingly.<br />\
              e.g. #Chorus blue indent will colour and indent the chorus accordingly.</li>\
          <li>#PrintOnly, #ChordsOnly, #ScreenOnly<br />\
                only display on printouts, chord sheets, or the presentation-mode screen, respectively.</li>\
        </ul></li>\
        <li>---<br />\
            Split into two columns at this point, on the screen.</li>\
        <li>===<br />\
            Split chord printout into two columns here.  Also split the screen display, unless --- appears somewhere else.</li>\
        <li>_<br />\
              Use an under_score to indicate a held note in a word, to space out the chord printout correctly.  These will not display on screen.</li>\
        <li> &gt; <br />\
              Put on the end of a line, and at the beginning of the next, to force two\
        lines (in the print out) to run into one line (on screen).</li>\
        <li>* echo *<br />\
            Asterisks surround echoes (e.g. where women sing a different lyric).</li>\
      </ul>'


/* Here is a centralized TODO list
 
* Deleting a slide is a little clumsy
* The background doesn't update from the server
* In parser, spaces disappear before speech marks

 */
