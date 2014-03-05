function sortFullList(object) {
  var list = (object || document.getElementById('fullList'));
  var items = $(list).children('option').get();
  items.sort(function (a, b) {
    var compA = $(a).text().replace(/,/g, "").toUpperCase();
    var compB = $(b).text().replace(/,/g, "").toUpperCase();
    return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
    });
  $.each(items, function (idx, itm) {$(list).append(itm); });
  return list;
}

function searchify(text) {
  return text ? text.toUpperCase().replace(/(&[#\w\d]+;|[,\/'\\\?\.\u0080-\uFFFF])+/g, "").replace(/\bO\b/g, "OH") : false;
}


var priorSearch;
function updateSearch(fullText) { // TODO: [easy] search won't match inher_i_tance with inheritance.  Remove underscores from match terms.
  var slides = getStoredSlides(); //TODO this taxes performance
  var matchCount = 0, searchString = searchify($('#searchBox').val());
  var searchRegExp = new RegExp("\\b" + (searchString + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\-]', 'g'), '\\$&'));
  var fullList = document.getElementById('fullList');
  var replaceFullList = removeToInsertLater(fullList);
  if (!searchString || !(searchString.substring(0, -1) === priorSearch || searchString === priorSearch)) {
    fullList = sortFullList(fullList);
  }
  
  if (searchString) {
    // Full list of unused songs
    $(fullList.getElementsByTagName('option')).each( function (i) {
      if (!slides[this.value] || typeof(slides[this.value]) === 'undefined') return true;
      var text = searchify(humanText(this.value) + (fullText ? " " + slides[this.value]["text"] : ""));  
      if (text.match(searchRegExp)) {
        this.style.visibility = "visible";
        ++matchCount;
      } else {
        this.innerHTML = this.value.replace(/_/g, " ");
        this.style.visibility = "hidden";
        this.selected = false;
        fullList.appendChild(this);
      }
    });
    $('#searchBox').css('backgroundColor', matchCount === 0 ? "#BFBBBB" : (matchCount === 1 ? "#88BC3F" : "inherit")); 
    // Setlist
    $('#setList .setListTitle').each(function (i) {
      if (i > 0) {
        var slideTitle = localStorage.getItem('slide' + (i-1));
        if (!slides || !slides[slideTitle]) return true;
        var text = searchify(slideTitle + (fullText ? " " + slides[slideTitle]["text"] : ""));  
        this.style.backgroundColor = text.match(searchRegExp) ? "coral" : "";      
      }
    });
  } else {
    $(fullList.getElementsByTagName('option')).each( function (i) {
      this.style.visibility = "visible";
      this.innerHTML = this.value.replace(/_/g, " ");
    });
    $('#setList .setListTitle').each(function () {
      this.style.backgroundColor = "";
    });
    $('#searchBox').css('backgroundColor', "inherit");
  }
  replaceFullList();
  $('#fullList').scrollTop(0);
  priorSearch = searchString;
}

/**
 * Remove an element and provide a function that inserts it into its original position
 * @origin: http://code.google.com/speed/articles/javascript-dom.html
 * @param element {Element} The element to be temporarily removed
 * @return {Function} A function that inserts the element into its original position
 **/
function removeToInsertLater(element) {
  if (!element || typeof(element) === 'undefined') return false;
  var parentNode = element.parentNode;
  var nextSibling = element.nextSibling;
  parentNode.removeChild(element);
  return function() {
    if (nextSibling) {
      parentNode.insertBefore(element, nextSibling);
    } else {
      parentNode.appendChild(element);
    }
  };
}

