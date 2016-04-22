var online = navigator.onLine;

// Definitions
// slideCount: Total number of SONG slides.  Total won't include welcome slide or the 'blank' slide

// Show or hide link to diff.html according to online presence
document.addEventListener("online", function() {
  $("#diffLink").animate({
          opacity : 1
          }, 1000);
});
document.addEventListener("offline", function() {
  $("#diffLink").animate({
          opacity : 0
          }, 1000);
});

function updateSite(event) {
    window.applicationCache.swapCache();
}
window.applicationCache.addEventListener('updateready',
    updateSite, false);

function setStoredSlides(slides) {
  if (Object.keys(slides).length > 0) {
    localStorage.setItem('slides', JSON.stringify(slides));
    var g = 0;
    for (var slide in slides) {
      ++g;
    }
    console.log("Setting # of song slides to " + g);
    // we don't include the welcome slide (#0) or final slide in this count.
    // g = the total number of songs.
    localStorage.setItem('slideCount', g);
  } else {
    localStorage.setItem('slideCount', 0);
  }
}

// pass canUpdate = true if there's a chance of updating the slde content from the edit fields on the page
function getStoredSlides(updateFromEditFields) {
  if (updateFromEditFields && localStorage
    && (!localStorage.getItem("slides") || localStorage.getItem("slides").length == 0)
    && (!localStorage.getItem('slideCount') || localStorage.getItem('slideCount') <= 0)) {
    console.log("Updating stored slides first");
    updateStoredSlides(true);
  }
  if (localStorage) {
   /* console.log("Getting slides from local storage.");
    console.log($.parseJSON(localStorage.getItem("slides")));*/
    return $.parseJSON(localStorage.getItem("slides"));
  } else return false;
}

// Update from fields in edit.html
function updateStoredSlides(avoidLoop) {
  var count = 0;
  var localJSON;
  if (!avoidLoop && localStorage.getItem('slideCount') > 0) {
    localJSON = getStoredSlides();
    count = localStorage.getItem('slideCount');
  } else {
    localJSON = (typeof(lastJSON) == "undefined" ? local.songs : lastJSON);
    for (var h in localJSON) {
      ++count;
    }
  }
  for (var i = 1; i < count; ++i) {
    if ($('#modified' + i).val() == 1) {
      var song = machineText($('#songTitle' + i).val());
      var formerTitle = $('#formerTitle' + i).val(); // Should already be in machineText format

      if (song != formerTitle || localJSON[song] != localJSON[formerTitle]) {
        delete localJSON[formerTitle];
        if (typeof(renameSetListItem) != "undefined") {
          renameSetListItem(formerTitle, song);
        }
      }
      if (song != '') {
        localJSON[song] = {
          "author"    : $('#authorName' + i).val(),
          "copyright" : $('#copy' + i).val(),
          "text"      : $('#editText' + i).val(),
          "size"      : $('#fontSize' + i).val(),
          "modified"  : true
        };
      }
    }
  }
  setStoredSlides(localJSON);
}