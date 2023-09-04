// ==UserScript==
// @name         Vietphrase Translate
// @namespace    VP
// @version      0.11
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
    Ngoac: false,
    VPmotnghia: true,
    Daucachnghia: ';',
    Xoadichlieutru: true
};

let dictNames = { 'Han': [], 'HanViet': Names ? Names : {} };
let dictVP = { 'Han': [], 'HanViet': VietPhrase ? VietPhrase : {} };
let dictPhienAm = { 'Han': [], 'HanViet': PhienAm ? PhienAm : {} };
//let dictSP = { 'Han': [], 'HanViet': Strucphrase ? Strucphrase : {} };

dictNames.Han = Object.keys(dictNames.HanViet);
dictVP.Han = Object.keys(dictVP.HanViet);
dictPhienAm.Han = Object.keys(dictPhienAm.HanViet);

dictNames.Han.sort((a, b) => { return a.length - b.length });
dictVP.Han.sort((a, b) => { return a.length - b.length });
dictPhienAm.Han.sort((a, b) => { return a.length - b.length });

function htmlEntities(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", "&#39;"); } String.prototype.count = function (search) { return this.split(search).length - 1; }
function isLetter(str) { return str.length == 1 && str.match(/[0-9a-z]/i); }
function isChineseLetter(str) { return str.length == 1 && str.match(/[\u4E00-\u9FA5]/) }

let translateCount = 0;

function PhienAmTrans(text) {
    dictPhienAm.Han.forEach(Han => {text = text.replaceAll(Han, ` ${dictPhienAm.HanViet[Han]}`)});
    return text;
}

function VPTrans(text, Ngoac = true, Motnghia = false, Daucach = ';', XoaDich = false) {
    const DichLieuTru = ['的', '了', '著']
    dictNames.Han.forEach(Han => {text = text.replaceAll(Han, ` ${dictNames.HanViet[Han]}`)});
    dictVP.Han.forEach((Han) => {
        let VP;
        if (Motnghia) VP = dictVP.HanViet[Han].split(Daucach)[0];
        else VP = dictVP.HanViet[Han];
        if (Ngoac) VP = `[${VP}]`;
        text = text.replaceAll(Han, ` ${VP}`)
    });

    if (XoaDich) DichLieuTru.forEach(dich => {text = text.replaceAll(dich, '')});

    dictPhienAm.Han.forEach(Han => {text = text.replaceAll(Han, ` ${dictPhienAm.HanViet[Han]}`)});
    text = text.replaceAll(/(\s+)/g, ' ');
    return text;
}


//chua dung toi, neu dung thay VPTrans(text) = VPTrans(strucTrans(text))
function strucTrans(text, Ngoac = true) {
    const maxLength = Math.max(dictNames.Han[0].length, dictVP.Han[0].length); //Han[0] is the longest phrase
    let reg = /{\d+}|{N\d?}|{V\d?}/g

    dictSP.Han.forEach(SP => {
        let searchEl = SP.match(reg); //match {0}, {V} by order in cText
        let strReg = SP.replace(reg, '([\\p{sc=Han}0-9]+)'); //cText = abc{1}def{0}ijk{ V } => lmn([\\p{sc=Han}0-9]+)opq([\\p{sc=Han}0-9]+)rst([\\p{sc=Han}0-9]+)uvw
        let vText = dictSP.HanViet[SP];
        let matchCases = Array.from(text.matchAll(new RegExp(strReg, 'ug')));
        if (matchCases.length == 0) return;
        matchCases.forEach(matchCase => {
            if (matchCase.length == 0) return;
            let cMatch = matchCase.splice(0, 1)[0]; //splice return array; full chinese text match
            let skipThisStep = false;
            //{V} {N} o dau tien
            if (/^{ N\d?}/.test(SP)) {
                let str = matchCase[0];
                let Length = Math.min(maxLength, str.length);
                for (let k = Length; k > 0; k--) {
                    let subText = str.slice(length - k);
                    if (dictNames.HanViet[subText]) {
                        cMatch = cMatch.replace(str, subText);
                        matchCase[0] = subText;
                        break;
                    }
                    if (k == 1) {
                        skipThisStep = true;
                        break;
                    }
                }
            }

            if (/^{V\d?}/.test(SP)) {
                let str = matchCase[0];
                let Length = Math.min(maxLength, str.length);
                for (let k = Length; k > 0; k--) {
                    let subText = str.slice(length - k);
                    if (dictNames.HanViet[subText] || dictVP.HanViet[subText]) {
                        cMatch = cMatch.replace(str, subText);
                        matchCase[0] = subText;
                        break;
                    }
                    if (k == 1) {
                        skipThisStep = true;
                        break;
                    }
                }
            }

            ////{V} {N} o cuoi cung
            if (/{N\d?}$/.test(SP)) {
                let str = matchCase.at(-1);
                let Length = Math.min(maxLength, str.length);
                for (let k = Length; k > 0; k--) {
                    let subText = str.slice(0, k);
                    if (dictNames.HanViet[subText]) {
                        cMatch = cMatch.replace(str, subText);
                        matchCase[matchCase.length - 1] = subText;
                        break;
                    }
                    if (k == 1) {
                        skipThisStep = true;
                        break;
                    }
                }
            }

            if (/{V\d?}$/.test(SP)) {
                let str = matchCase.at(-1);
                let Length = Math.min(maxLength, str.length);
                for (let k = Length; k > 0; k--) {
                    let subText = str.slice(0, k);
                    if (dictNames.HanViet[subText] || dictVP.HanViet[subText]) {
                        cMatch = cMatch.replace(str, subText);
                        matchCase[matchCase.length - 1] = subText;
                        break; //if found then break
                    }
                    if (k == 1) {
                        skipThisStep = true;
                        break;
                    }
                }
            }

            if (skipThisStep) return;
            let vText1 = vText;
            searchEl.forEach((el, index) => {vText1 = vText1.replace(el, matchCase[index])})
            if (Ngoac) text = text.replaceAll(cMatch, `<${vText1}>`);
            else text = text.replaceAll(cMatch, vText1);
        })

    })
    return text;
}

function translateNode(rootNode) {
    let nodeArr = [];
    let nodesText = '';
    const limiter = '\uf0f3'.repeat(2);

    function nodeToArr(node) {
        if (node.nodeType == 3) {
            nodeArr.push(node);
            nodesText += node.textContent + limiter;
        }
        node.childNodes.forEach((childNode) => nodeToArr(childNode))
    }

    nodeToArr(rootNode);
    VPTrans(nodesText, Options.Ngoac, Options.VPmotnghia, Options.Daucachnghia, Options.Xoadichlieutru)
        .split(limiter).forEach((text, index) => {if(nodeArr[index]==undefined) return; nodeArr[index].textContent = text;});
}

function $(e) { return e ? document.getElementById(e) || document.querySelector(e) : false };

(function () {
    'use strict';

    let mouseClick2 = function () {
        console.time('Translate 2');
        document.title = PhienAmTrans(document.title);
        translateNode(document.body);
        console.timeEnd('Translate 2');
    }

    let mouseClick1 = function () {
        console.time('Translate 1');
        document.title = PhienAmTrans(document.title);
        document.body.innerHTML = VPTrans(document.body.innerHTML, Options.Ngoac, Options.VPmotnghia, Options.Daucachnghia, Options.Xoadichlieutru); //Names dat trong file require o header
        console.timeEnd('Translate 1');
    }

    let menuClick = function () {
        if (document.getElementById('menuBtn').innerText == '↓') {
            document.getElementById('menuBtn').innerText = '↔';
            menuOption.style.display = "block";
        } else {
            document.getElementById('menuBtn').innerText = '↓';
            menuOption.style.display = "none";
        }
        console.log(GM_getValue('Options'));
    }


    const transButton = document.createElement("div");
    transButton.style = "display: flex; position: fixed;top: 1%; right:1%; margin: 0px; padding: 0px; border: thin; z-index:99999";

    const button1 = document.createElement("button");
    button1.innerText = "Tran";
    button1.style = "height:90%; border: none; text-align:right; padding: 5px 0px 5px 5px; margin:0px;";
    button1.onclick = mouseClick1;
    transButton.appendChild(button1);

    const button2 = document.createElement("button");
    button2.innerText = "slate";
    button2.style = "height:90%; border: none; text-align:left; padding: 5px 5px 5px 0px; margin:0px;";
    button2.onclick = mouseClick2;
    transButton.appendChild(button2);

    const updateOptions = function (e) {
        console.log(e);
        switch (e.target.id) {
            case 'chkNgoac':
                Options.Ngoac = e.target.checked; break;
            case 'chkMotnghia':
                Options.VPmotnghia = e.target.checked; break;
            case 'chkDichlieutru':
                Options.Xoadichlieutru = e.target.checked; break;
        } //end switch

        GM_setValue("Options", JSON.stringify(Options));
    }//End function

    const menuBtn = document.createElement("button");
    menuBtn.id = 'menuBtn';
    menuBtn.innerText = "↓"; // ↓  ↔
    menuBtn.style = "height:90%; border: none; text-align:right; padding:5px 0px 5px 0px; margin:0px;";
    menuBtn.onclick = menuClick;
    transButton.appendChild(menuBtn);

    document.body.appendChild(transButton);

    const menuOption = document.createElement('div');
    menuOption.id = 'menuOption';
    let menuOption_top = transButton.offsetTop + transButton.offsetHeight; //chua add vao document nen chua co gia tri
    let menuOption_right = 5;
    menuOption.style = 'display:none; top: ' + menuOption_top + 'px; right: ' + menuOption_right + 'px; position: fixed; background-color: lightblue; margin:4px 7px 7px 7px; padding:4px 7px 7px 7px; border-radius: 10px;z-index:999999;';

    menuOption.innerHTML = '<fieldset style="border: 2px solid gray; padding: 5px; border-radius: 10px;"><legend>Các tùy chọn</legend>' +
        `<input type="checkbox" id="chkNgoac" ><label for="chkNgoac"> Dùng [Vietphrase] </label></br>` +
        `<input type="checkbox" id="chkMotnghia" ><label for="chkMotnghia"> Vietphrase một nghĩa </label></br>` +
        `<input type="checkbox" id="chkDichlieutru" ><label for="chkDichlieutru"> Xóa đích, liễu, trứ </label></br>` +
        '</fieldset>';

    document.body.appendChild(menuOption);
    document.getElementById('chkNgoac').onchange = updateOptions;
    document.getElementById('chkMotnghia').onchange = updateOptions;
    document.getElementById('chkDichlieutru').onchange = updateOptions;

    //GM_deleteValue('Options');
    let tmpOptions = GM_getValue('Options');
    if (tmpOptions != null) Options = JSON.parse(tmpOptions);

    document.getElementById('chkNgoac').checked = Options.Ngoac;
    document.getElementById('chkMotnghia').checked = Options.VPmotnghia;
    document.getElementById('chkDichlieutru').checked = Options.Xoadichlieutru;

})();
