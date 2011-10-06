/* 
 * Newlife worship manager
 * Author: Martin S, at Gmail.com
 * Open source and free to use
 * Song content only available under terms of the CCLI.
 */

var serverURL = 'http://www.geological-supplies.com/nlife/';

var local = {};
local.ccli = localStorage.getItem('ccli');
local.name = localStorage.getItem('churchName') || 'Anonymous church';
local.songs = localStorage.getItem('slides') || '{}';
local.setLists = localStorage.getItem('setLists') || '{}';
local.background = localStorage.getItem('background') || '{}';

var slideDatabase = JSON.parse(local.songs);
var paperSize = localStorage.getItem('paperSize') || 215.9; // in mm A4: 210; letter: 215.9 // TODO: allow user to set account preference
var paperWidth = localStorage.getItem('paperWidth') || 215.9; // in mm A4: 210; letter: 215.9 // TODO: allow user to set account preference
var paperHeight = localStorage.getItem('paperHeight') || 279.4; // in mm.  A4: 297; letter: 279.4