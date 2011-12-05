/*
 * License: www.mozilla.org/MPL/
 */
"use strict";

// Import the APIs we need.
const contextMenu = require("context-menu");
const request = require("request");
const selection = require("selection");
const translate = require("translate");
const data = require('self').data;
const tabs = require("tabs");
const pageMod = require("page-mod");
const localProcess = require("launch-local-process")

require("evallib").hello();
//require("evallib").hello = 5;
//require("evallib").hello();

const jqueryFilename = 'jquery-1.6.4.js';

function onMessageFunc(obj) {
  let text = obj[0];
  let lang = obj[1];
  
  translate.translate(text, lang, onTranslationComplete);    
};
    
function onTranslationComplete(translated) {
  console.debug("getAllProperties(selection)");
  console.debug(getAllProperties(selection).join("\n"));
  
  selection.text = translated;
  //selection.html = "<i>" + selection.html + "</i>";
  // highlight it
  selection.html = "<span style=\"background-color:#aaffaa\">" + selection.html + "</span>";
}

exports.main = function(options, callbacks) {
  console.log(options.loadReason);
 
//  // Create a new context menu item.
//  var menuItem = contextMenu.Item({
// 
//    label: "Translate Selection (to English)",
// 
//    // Show this item when a selection exists.
// 
//    context: contextMenu.SelectionContext(),
// 
//    // When this item is clicked, post a message to the item with the
//    // selected text and current URL.
//    contentScript: 'self.on("click", function () {' +
//    '  var text = window.getSelection().toString();' +
//    '  self.postMessage([ text, "en"]);' +
//    '});',
// 
//    // When we receive the message, call the Google Translate API with the
//    // selected text and replace it with the translation.
//    onMessage: onMessageFunc
//  });
//  
//  var menuItem2 = contextMenu.Item({
//    label: "Translate Selection (to German)",
//    context: contextMenu.SelectionContext(),
//    contentScript: 'self.on("click", function () {' +
//    '  var text = window.getSelection().toString();' +
//    '  self.postMessage([text, "de"]);' +
//    '});',
// 
//    onMessage: onMessageFunc
//  });
  
  const menuItem3 = contextMenu.Item({
    label: "Open with Windows Explorer",
    context: contextMenu.SelectionContext(),
    contentScriptFile: [ data.url('open-with-fileexplorer.js') ],    
    onMessage: function(message) {
      let path = message;
      try {
        localProcess.showPathInWindowsExplorer(path);
      }
      catch (err) {
        console.warn(err);
        // port.emit("myEvent");
        //menuItem3.port.emit("hallo");
        // console.log(getAllProperties(menuItem3));
        
        showMessageBox("Sorry. Could not open path. The path was:\n\n" + path);
      }
    }
  });
  
  const contentTextScanner = pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'ready',
    contentScriptFile: [ data.url(jqueryFilename),
                         data.url('content-text-scanner.js')
                       ],
    onAttach: function(worker) {
      worker.postMessage('scan');
    }
  });

  const hyperlinkScanner = pageMod.PageMod({
    include: ['*'],
    contentScriptWhen: 'ready',
    contentScriptFile: [data.url(jqueryFilename),
                        data.url('hyperlink-scanner.js'),
                        data.url('from-lib.js') ],
    onAttach: function(worker) {
      worker.postMessage('scan');
      worker.port.on('href', function(href) {
          let path = href
          try {
            localProcess.showPathInWindowsExplorer(path);
          }
          catch (err) {
            console.warn(err);      
            showMessageBox("Sorry. Could not open path. The path was:\n\n" + path);
          }
      })
    }
  });
};

function showMessageBox(text) {
  var worker = tabs.activeTab.attach({
    contentScript:
    // convert text to "safe string"
    'window.alert(unescape("' + escape(text) + '"))'
  });
        
  worker.destroy();  
}

//
// usage examples:
//   print(getAllProperties(obj));
//   getAllProperties(Math).filter(function(o) { print(o); });
//
function getAllProperties(obj) {
  var result = [];
  var names = Object.getOwnPropertyNames(obj);
  // print(names); // "firstName,lastName,5,test"
  for (var i in names) {
    // print(names[i]); // "firstName", ...
    let name = names[i];
    result.push(i + ":" + name + "[" + typeof obj[name] + "]");
  }

  return result;
};

//function getMethods(obj) {
//  var result = [];
//  for (var id in obj) {
//    try {
//      if (typeof(obj[id]) == "function") {
//        result.push(id + ": " + obj[id].toString());
//      }
//    } catch (err) {
//      result.push(id + ": inaccessible");
//    }
//  }
//  return result;
//}
//
//function getAllMethods(object) {
//    return Object.getOwnPropertyNames(object).filter(function(property) {
//        return typeof object[property] == 'function';
//    });
//}

exports.onUnload = function (reason) {
  console.log(reason);
};