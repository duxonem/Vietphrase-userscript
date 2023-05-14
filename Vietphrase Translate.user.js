// ==UserScript==
// @name         Vietphrase Translate
// @namespace    VP
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        http*://*/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-idle
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/PhienAm.txt.js
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/Names.txt
// @require      https://raw.githubusercontent.com/duxonem/Vietphrase-userscript/main/VietPhrase.txt.js
// ==/UserScript==

// Option
let Options = {
    Ngoac:false,
    VPmotnghia:true,
    Daucachnghia:';',
    Xoadichlieutru:true };

function htmlEntities(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'","&#39;");}String.prototype.count=function(search) {return this.split(search).length-1;}
function isLetter(str) { return str.length == 1 && str.match(/[0-9a-z]/i); }
function isChineseLetter(str) {return str.length==1 && str.match(/[\u4E00-\u9FA5]/)}

let translateCount=0;

function translateByOrder(text,safe=true) {
            let result = [], tmpArr={};

            let Name;
            let Han=Object.keys(Names);
            Han.sort((a,b) => (b.length -a.length));
            let maxLength=Han[0].length+1;

            for (let i=0; i<text.length; i++) {
                if (text.charAt(i) == '\u0528') continue;
                for (let j=maxLength; j>1;j--) {
                    let HanViet=Names[text.substring(i,(i+j))];  ////////////////
                    if (HanViet == undefined) continue;
                        tmpArr.pos=i;
                        tmpArr.orgText=text.substring(i,i+j);
                        tmpArr.transText=HanViet;
                        tmpArr.dict='Names';
                        result.push(tmpArr);

                        text=text.replace(tmpArr.orgText,'\u0528'.repeat(tmpArr.orgText.length))
                        i+=tmpArr.orgText.length-1;
                        tmpArr={};
                }

            }//end for

            Han=Object.keys(VietPhrase);
            Han.sort((a,b) => (b.length -a.length));
            maxLength=Han[0].length+1;

            for (let i=0; i<text.length; i++) {
                if (text.charAt(i) == '\u0528') continue;
                for (let j=maxLength; j>1; j-- ) {
                    let HanViet=VietPhrase[text.substring(i,(i+j))]; ////////////////
                    if (HanViet == undefined) continue;
                        tmpArr.pos=i;
                        tmpArr.orgText=text.substring(i,i+j);
                        if (Options.VPmotnghia) tmpArr.transText=HanViet.split(Daucachnghia)[0]; // Mot nghia
                        else tmpArr.transText=HanViet;  // nhieu nghia

                        if (Options.Ngoac) tmpArr.transText='['+tmpArr.transText + ']';  //dau ngoac VP
                        tmpArr.dict='VP';
                        result.push(tmpArr);

                        text=text.replace(tmpArr.orgText,'\u0528'.repeat(tmpArr.orgText.length))
                        i+=tmpArr.orgText.length-1;
                        tmpArr={}; // must create new object, the existing one is just pushed in to result by reference
                }
            }//end for


            let dichlieuArr =['的','了','著'];
            if (Options.Xoadichlieutru) dichlieuArr.forEach(word => text=text.replaceAll(word,'\u0528'));
            //convert PhienAm
            for (let i=0; i<text.length; i++) {
                let char=text.charAt(i);
                if (char=='\u0528') continue; //bo mat khoang trang giua 2 chu, pahi thay lai. Chi xay ra khi chay tren cac ky tu kophai tieng trung quoc do tieng tq viet lien

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
                }
            } //end for

            //result=[...new Set(result)];
            result.sort((a,b) => (a.pos -b.pos));

            let returnText=result[0].transText;
            for (let i=1;i<result.length; i++)
               if (result[i].dict == 'FA' && result[i-1].dict == 'FA') returnText+=result[i].transText;
               else returnText+=' ' + result[i].transText;

            translateCount++;
            return returnText;
        } //end function


function translate(text, dict,safe=true) {
    let Viet='';
    text=text.replaceAll('&nbsp;',' ');

    for (let Han in dict) {
        if (safe) Viet =htmlEntities(dict[Han]);
        else Viet = dict[Han];

        if (Options.VPmotnghia) Viet=Viet.split(Daucachnghia)[0];

        if (Options.Xoadichlieutru &&dict=='PhienAm') {
            let dichlieuArr =['的','了','著'];
            dichlieuArr.foreach(word => text=text.replaceAll(word,'')); }

        if (Options.Ngoac && dict==VietPhrase) text=text.replaceAll(Han,'['+Viet+'] ');
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
        if (domNode.nodeType == 3) {
            stackToStockThings.push(domNode);
            return; }

      if (domNode.nodeType != 1) return;
      if (domNode.tagName && ',OBJECT,FRAME,FRAMESET,IFRAME,SCRIPT,EMBD,STYLE,BR,HR,TEXTAREA,'.indexOf(',' + domNode.tagName.toUpperCase() + ',') > - 1) return;
      if (domNode.tagName && domNode.type && domNode.tagName.toUpperCase() == 'INPUT' && ',button,submit,reset,'.indexOf(domNode.type.toLowerCase()) > - 1)
        domNode.value = translate(domNode.value,PhienAm);

      for (var i = 0, j = domNode.childNodes.length; i < j; i++) Imtired(domNode.childNodes[i]);
    } //End function Imtired

    Imtired(domNode);
    console.log(stackToStockThings.length);
    let text='', tmpArr=[];
    for (let i=0; i<stackToStockThings.length; i++) text+=stackToStockThings[i].nodeValue + '\uf0f3'.repeat(1);  //repeat 3 takes longer than repeat 2 ~~10%
    text=translateByOrder(text);
    //text=translate(text,Names,false);
    //text=translate(text,VietPhrase,true);
    //text=translate(text,PhienAm,false);
    tmpArr=text.split('\uf0f3'.repeat(1));
    for (let i=0; i<stackToStockThings.length; i++) stackToStockThings[i].nodeValue=tmpArr[i];
}


(function() {
    'use strict';

    let mouseClick2 = function () {
        console.time('Translate 2');
        document.title= translate(document.title,PhienAm);
        translateNode(document.body);
        document.body.style.fontFamily = `arial,sans-serif;`
        console.timeEnd('Translate 2');
        console.log(translateCount);}

    let mouseClick1= function () {
        console.time('Translate 1');
        document.title= translate(document.title,PhienAm);
        document.body.innerHTML= translate(document.body.innerHTML,Names); //Names dat trong file require o header
        document.body.innerHTML= translate(document.body.innerHTML,VietPhrase); //VietPhrase dat trong file require o header, ghi ra co []
        document.body.innerHTML= translate(document.body.innerHTML,PhienAm); //PhienAm dat trong file require o header
        document.body.style.fontFamily = `arial,sans-serif;`
        console.timeEnd('Translate 1');
        console.log(translateCount);}

    let menuClick= function () {
        if (document.getElementById('menuBtn').innerText =='↓') {
            document.getElementById('menuBtn').innerText= '↔';
            menuOption.style.display="block";
        } else {
            document.getElementById('menuBtn').innerText ='↓';
            menuOption.style.display="none";
        }
        console.log(GM_getValue('Options'));
    }


    const transButton=document.createElement("div");
    transButton.style="display: inline-flexbox; position: fixed;top: 1%; right:1%; margin: 0px; padding: 0px; border: thin; z-index:99999";

    const button1=document.createElement("button");
    button1.innerText="Tran";
    button1.style= "height:90%; border: none; text-align:right; padding: 5px 0px 5px 5px; margin:0px;";
    button1.onclick=mouseClick1;
    transButton.appendChild(button1);

    const button2=document.createElement("button");
    button2.innerText="slate";
    button2.style= "height:90%; border: none; text-align:left; padding: 5px 5px 5px 0px; margin:0px;";
    button2.onclick=mouseClick2;
    transButton.appendChild(button2);

    const updateOptions = function (e) {
        console.log(e);
        switch (e.target.id) {
            case 'chkNgoac':
                Options.Ngoac=e.target.checked; break;
            case 'chkMotnghia':
                Options.VPmotnghia=e.target.checked; break;
            case 'chkDichlieutru':
                Options.Xoadichlieutru=e.target.checked; break;
        } //end switch

        GM_setValue("Options",JSON.stringify(Options));
    }//End function

    const menuBtn=document.createElement("button");
    menuBtn.id='menuBtn';
    menuBtn.innerText="↓"; // ↓  ↔
    menuBtn.style= "height:90%; border: none; text-align:right; padding:5px 0px 5px 0px; margin:0px;";
    menuBtn.onclick=menuClick;
    transButton.appendChild(menuBtn);

    document.body.appendChild(transButton);

    const menuOption=document.createElement('div');
    menuOption.id='menuOption';
    let menuOption_top= transButton.offsetTop + transButton.offsetHeight; //chua add vao document nen chua co gia tri
    let menuOption_right= 5;
    menuOption.style='display:none; top: '+ menuOption_top +'px; right: ' + menuOption_right +'px; position: fixed; background-color: lightblue; margin:4px 7px 7px 7px; padding:4px 7px 7px 7px; border-radius: 10px;z-index:999999;';

    menuOption.innerHTML= '<fieldset style="border: 2px solid gray; padding: 5px; border-radius: 10px;"><legend>Các tùy chọn</legend>' +
`<input type="checkbox" id="chkNgoac" ><label for="chkNgoac"> Dùng [Vietphrase] </label></br>` +
`<input type="checkbox" id="chkMotnghia" ><label for="chkMotnghia"> Vietphrase một nghĩa </label></br>` +
`<input type="checkbox" id="chkDichlieutru" ><label for="chkDichlieutru"> Xóa đích, liễu, trứ </label></br>` +
'</fieldset>';

    document.body.appendChild(menuOption);
    document.getElementById('chkNgoac').onchange=updateOptions;
    document.getElementById('chkMotnghia').onchange=updateOptions;
    document.getElementById('chkDichlieutru').onchange=updateOptions;

    //GM_deleteValue('Options');
    let tmpOptions = GM_getValue('Options');
    if (tmpOptions != null) Options=JSON.parse(tmpOptions);

    document.getElementById('chkNgoac').checked=Options.Ngoac;
    document.getElementById('chkMotnghia').checked=Options.VPmotnghia;
    document.getElementById('chkDichlieutru').checked=Options.Xoadichlieutru;

})();
