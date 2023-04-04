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
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/PhienAm.txt.js
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/Names.txt
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/VietPhrase.txt.js
// ==/UserScript==

function htmlEntities(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'","&#39;");}
String.prototype.count=function(search) {return this.split(search).length-1;}
let translateCount=0;

function translate(text, dict,brackets=false,safe=false) {
    let Viet='';
    text=text.replaceAll('&nbsp;',' ');

    for (let Han in dict) {
        if (safe) Viet =htmlEntities(dict[Han]);
        else Viet = dict[Han];

        if (brackets) text=text.replaceAll(Han,'['+Viet+'] ');
        else text=text.replaceAll(Han,Viet+' ');
    } //End for

    let pointAtEnd=false;
    if (text.charAt(text.length-1)=='。') pointAtEnd=true;

    let lines=text.split('。');
    let newline='';
    lines.forEach((line) => {
        line = line.trim();
        if (line) newline += line.charAt(0).toUpperCase()+line.slice(1)+'. ';
        });

    if (!pointAtEnd) newline=newline.substring(0,newline.length-2);
    text=newline.replaceAll(/  +/g,' '); // thay nhieu dau cach lien nhau ve 1 dau cach

    translateCount++;
    return text;
} //End function

function translateNode(domNode) {
if (!domNode) return;

      if (domNode.nodeType == 3) {
        domNode.nodeValue = translate(domNode.nodeValue,Names);
        domNode.nodeValue = translate(domNode.nodeValue,VietPhrase,true);
        domNode.nodeValue = translate(domNode.nodeValue,PhienAm);
        //domNode.setAttribute("word-wrap","break-word");  // khong work
        //domNode.style.wordBreak="break-word";  // khong work
        return; }

      if (domNode.nodeType != 1) return;

      if (domNode.tagName && ',OBJECT,FRAME,FRAMESET,IFRAME,SCRIPT,EMBD,STYLE,BR,HR,TEXTAREA,'.indexOf(',' + domNode.tagName.toUpperCase() + ',') > - 1) return;

      //if (domNode.title)      domNode.title = translate(domNode.title,PhienAm);

      //if (domNode.alt)        domNode.alt = translate(domNode.alt,PhienAm);

      if (domNode.tagName && domNode.type && domNode.tagName.toUpperCase() == 'INPUT' && ',button,submit,reset,'.indexOf(domNode.type.toLowerCase()) > - 1)
        domNode.value = translate(domNode.value,PhienAm);

      for (var i = 0, j = domNode.childNodes.length; i < j; i++) translateNode(domNode.childNodes[i]);
}


(function() {
    'use strict';

    let mouseClick2 = function () {
        document.title= translate(document.title,PhienAm);
        translateNode(document.body);
        console.log(translateCount);}

    let mouseClick1= function () {
        document.title= translate(document.title,PhienAm);
        document.body.innerHTML= translate(document.body.innerHTML,Names); //Names dat trong file require o header
        document.body.innerHTML= translate(document.body.innerHTML,VietPhrase,true,true); //VietPhrase dat trong file require o header, ghi ra co []
        document.body.innerHTML= translate(document.body.innerHTML,PhienAm); //PhienAm dat trong file require o header
        console.log(translateCount);}

    const transButton=document.createElement("div");
    transButton.style="position: fixed;top: 1%; right:1%; width:70px; height:25px; border: thin;z-index:99999";

    const button1=document.createElement("button");
    button1.innerText="Tran";
    button1.style= "width:50%; height:90%; top: 0; left: 0; position:absolute; border: none; text-align:right; padding:1px;";
    button1.onclick=mouseClick1;
    transButton.appendChild(button1);

    const button2=document.createElement("button");
    button2.innerText="slate";
    button2.style= "width:50%; height:90%; top: 0; right: 0; position:absolute; border: none; text-align:left; padding:1px;";
    button2.onclick=mouseClick2;
    transButton.appendChild(button2);

    document.body.appendChild(transButton);


})();
