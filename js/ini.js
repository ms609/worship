/* 
 * Newlife worship manager
 * Author: Martin S, at Gmail.com
 * Open source and free to use
 * Song content only available under terms of the CCLI.
 */


var church = {};
church.ccli = localStorage.getItem('church.ccli');
church.name = localStorage.getItem('church.name') || 'Anonymous church';
var paperWidth = localStorage.getItem('church.paper') || 215.9; // in mm A4: 210; letter: 215.9 // TODO: allow user to set account preference
var paperHeight = localStorage.getItem('paperHeight') || 279.4; // in mm.  A4: 297; letter: 279.4