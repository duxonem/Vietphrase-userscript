// ==UserScript==
// @name         Vietphrase Translate
// @namespace    VP
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http*://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// @run-at       document-idle
// @require      https://pastebin.com/raw/rSq6D6V9
// @require      https://pastebin.com/raw/7euNQrc3
// @require      https://pastebin.com/raw/cr28ykW5
// ==/UserScript==

// Names dang bi loi. Nguyen nhan do dung dau '', thay bang "". Do 1 so ten co dang O'Neil, bao bang '' se thanh 'O'neil', nen doi thanh "O'Neil"
function htmlEntities(str) {
    return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'",'&#39');
}

function translate(text, dict,brackets=false,safe=false) {
    let Viet='';
    for (let Han in dict) {
        if (safe) Viet =htmlEntities(dict[Han]);
        else Viet = dict[Han];

        if (brackets) text=text.replaceAll(Han,'['+Viet+'] ');
        else text=text.replaceAll(Han,Viet+' ');
    } //End for

    text=text.replaceAll('  ',' ');
    return text;
} //End function



(function() {
    'use strict';

    // Your code here...
const transButton=document.createElement("button");
transButton.innerText="Translate";
transButton.style='position: fixed; top:1%; right:1%; z-index: 99999;';
document.body.appendChild(transButton);

transButton.onclick = function () {
    document.title= translate(document.title,PhienAm)
    document.body.innerHTML= translate(document.body.innerHTML,Names); //Names dat trong file require o header
    document.body.innerHTML= translate(document.body.innerHTML,VietPhrase,true,true); //VietPhrase dat trong file require o header, ghi ra co []
    document.body.innerHTML= translate(document.body.innerHTML,PhienAm); //PhienAm dat trong file require o header
}


})();