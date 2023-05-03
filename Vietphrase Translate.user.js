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

function htmlEntities(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'","&#39;");}String.prototype.count=function(search) {return this.split(search).length-1;}
function isLetter(str) { return str.length == 1 && str.match(/[0-9a-z]/i); }
function isChineseLetter(str) {return str.length==1 && str.match(/[\u4E00-\u9FA5]/)}

let translateCount=0;

function translateByLength(text,bracket=true) {  //no use now, leave it here to check function translate if needed
            let result = [], tmpArr={};

            let Name;
            let Han=Object.keys(Names);
            Han.sort((a,b) => (b.length -a.length));
            let maxLength=Han[0].length;

            for (let i=0; i<text.length; i++) {
                if (text.charAt(i) == '\u0528') continue;  //break for
                for (let j=maxLength; j>1;j--) {
                    let HanViet=Names[text.substring(i,(i+j))];
                    if (HanViet == undefined) continue;
                        tmpArr.pos=i;
                        tmpArr.orgText=text.substring(i,i+j);
                        tmpArr.transText=HanViet;
                        tmpArr.dict='Names';
                        result.push(tmpArr);

                        text=text.replace(tmpArr.orgText,'\u0528'.repeat(tmpArr.orgText.length))
                        i+=tmpArr.orgText.length-1;
                        tmpArr={};
                } //end for
            }//end for

            Han=Object.keys(VietPhrase);
            Han.sort((a,b) => (b.length -a.length));
            maxLength=Han[0].length;

            for (let i=0; i<text.length; i++) {
                if (text.charAt(i) == '\u0528') continue;
                for (let j=maxLength; j>1; j-- ) {
                    let HanViet=VietPhrase[text.substring(i,(i+j))];
                    if (HanViet == undefined) continue;
                        tmpArr.pos=i;
                        tmpArr.orgText=text.substring(i,i+j);
                        tmpArr.transText=HanViet;
                        tmpArr.dict='VP';
                        result.push(tmpArr);

                        text=text.replace(tmpArr.orgText,'\u0528'.repeat(tmpArr.orgText.length))
                        i+=tmpArr.orgText.length-1;
                        tmpArr={}; // must create new object, the existing one is just pushed in to result[] by reference
                } //end for
            }//end for


            //convert PhienAm
            for (let i=0; i<text.length; i++) {
                let char=text.charAt(i);
                if (char=='\u0528') continue; 

                while (text.indexOf(char) >=0 ) {
                    tmpArr.pos=text.indexOf(char);
                    tmpArr.orgText=char;
                    tmpArr.transText=PhienAm[char];
                    tmpArr.dict='PhienAm';
                    if (tmpArr.transText == undefined) {
                        tmpArr.transText=tmpArr.orgText;
                        tmpArr.dict='FA'; }
                    result.push(tmpArr);
                    text=text.replace(char,'\u0528');
                    tmpArr={}; // must create new object
                } //end while
            } //end for

            //result=[...new Set(result)];
            result.sort((a,b) => (a.pos -b.pos));

            let returnText='';
            for (let i=0;i<result.length; i++) {
                if (bracket && result[i].dict=='VP') returnText+='['+ result[i].transText + '] ';
                else if (isChineseLetter(result[i].orgText)) returnText+=result[i].transText + ' ';
                else returnText+=result[i].transText; }

            translateCount++;
            return returnText;
        }


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
    let stackToStockThings=[];

    function Imtired (domNode) {
        if (!domNode) return;
        if (domNode.nodeType == 3) { stackToStockThings.push(domNode); return; }

        if (domNode.nodeType != 1) return;
        if (domNode.tagName && ',OBJECT,FRAME,FRAMESET,IFRAME,SCRIPT,EMBD,STYLE,BR,HR,TEXTAREA,'.indexOf(',' + domNode.tagName.toUpperCase() + ',') > - 1) return;
        if (domNode.tagName && domNode.type && domNode.tagName.toUpperCase() == 'INPUT' && ',button,submit,reset,'.indexOf(domNode.type.toLowerCase()) > - 1)  stackToStockThings.push(domNode);

        for (var i = 0, j = domNode.childNodes.length; i < j; i++) Imtired(domNode.childNodes[i]);
    } //End function Imtired

    Imtired(domNode);
    let text='', tmpArr=[];
    for (let i=0; i<stackToStockThings.length; i++) text+=stackToStockThings[i].nodeValue + 'Thisismyprivatepart';
    text=translateByLength(text);
    //text=translate(text,Names,false);
    //text=translate(text,VietPhrase,true);
    //text=translate(text,PhienAm,false);
    tmpArr=text.split('Thisismyprivatepart');
    for (let i=0; i<stackToStockThings.length; i++) stackToStockThings[i].nodeValue=tmpArr[i];
}


(function() {
    'use strict';

    let mouseClick2 = function () {
        console.time('Translate 2');
        document.title= translate(document.title,PhienAm);
        translateNode(document.body);
        console.timeEnd('Translate 2');
        console.log(translateCount);}

    let mouseClick1= function () {
        console.time('Translate 1');
        document.title= translate(document.title,PhienAm);
        document.body.innerHTML= translate(document.body.innerHTML,Names); //Names dat trong file require o header
        document.body.innerHTML= translate(document.body.innerHTML,VietPhrase,true,true); //VietPhrase dat trong file require o header, ghi ra co []
        document.body.innerHTML= translate(document.body.innerHTML,PhienAm); //PhienAm dat trong file require o header
        console.timeEnd('Translate 1');
        console.log(translateCount);}

    const transButton=document.createElement("div");
    transButton.style="position: fixed;top: 1%; right:1%; width:70px; height:25px; border: thin;z-index:99999";

    const button1=document.createElement("button");
    button1.innerText="Tran";
    button1.style= "width:50%; height:90%; top: 0; left: 0; position:absolute; border: none; text-align:right; padding:0px; margin: 0px;";
    button1.onclick=mouseClick1;
    transButton.appendChild(button1);

    const button2=document.createElement("button");
    button2.innerText="slate";
    button2.style= "width:50%; height:90%; top: 0; right: 0; position:absolute; border: none; text-align:left; padding:0px; margin: 0px;";
    button2.onclick=mouseClick2;
    transButton.appendChild(button2);

    document.body.appendChild(transButton);


})();
