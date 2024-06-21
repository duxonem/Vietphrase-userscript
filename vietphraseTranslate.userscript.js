// ==UserScript==
// @name   Vietphrase Translate
// @namespace  VP
// @version  0.0.1
// @description The userscript converts chinese novel webpage to Vietphrase format to read on web browser 
// @author you
// @match  http*://*/*
// @grant  GM_setValue
// @grant  GM_getValue
// @grant  GM_deleteValue
// @run-at   document-idle
// ==/UserScript==

let Options = GM_getValue('Options', {
  Ngoac: false,
  Motnghia: true,
  daucach: ';',
  DichLieu: true,
  useSP: false
});

let dictNames = GM_getValue('dictNames', undefined);
let dictVP = GM_getValue('dictVP', undefined);
let dictPA = GM_getValue('dictPA', undefined);
let dictSP = GM_getValue('dictSP', undefined);

let tmpDictPA;
let tmpDictVP;
let tmpDictNames;
let tmpDictSP;

function sortSP(a, b) {
  let cmp = { 'V': 2, 'N': 3 }
  let aM = a.match(/{\d}|{N\d?}|{V\d?}/g);
  let bM = b.match(/{\d}|{N\d?}|{V\d?}/g);
  if (aM.length > bM.length) return -1;
  if (aM.length < bM.length) return 1;
  let aS = aM.reduce((s, e) => s += cmp[e.charAt(0)] ?? 0, 0);
  let bS = bM.reduce((s, e) => s += cmp[e.charAt(0)] ?? 0, 0);
  if (aS > bS) return -1;
  if (aS < bS) return 1;
  return b.length - a.length || a.localeCompare(b);
}

function str2Dict(str) {
  let dict = {};
  str.trim().split('\n').forEach(line => {
    if (/^(\/\/|#|=)/.test(line)) return; //ghi chu
    let [org, trans] = line.split('=');
    if (!org || !trans) return;
    dict[org] = trans;
  })
  return dict
}

function htmlEntities(str) { return String(str).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", "&#39;"); }
String.prototype.count = function (search) { return this.split(search).length - 1; }
function isLetter(str) { return str.length == 1 && str.match(/[0-9a-z]/i); }
function isChineseLetter(str) { return str.length == 1 && str.match(/[\u4E00-\u9FA5]/) }

function transPA(str) {
  return str.split('').reduce((s, c) => s += dictPA.trans[c] ? (' ' + dictPA.trans[c]) : c, '');
}

function transVP(str, Ngoac = true, Motnghia = false, daucach = ';', DichLieu = false) {
  const _magic = ''; //'\uf0f3'
  if (dictNames) dictNames.org?.forEach(el => str.replaceAll(el, ' ' + dictNames.trans[el]));
  if (!dictVP || !dictPA) return str;
  let result = '';
  const maxLength = dictVP.org[0]?.length;
  const dichlieu = ['的', '了', '着'];
  for (let i = 0; i < str.length; i++) {
    for (let j = maxLength; j > 0; j--) {
      let subStr = str.slice(i, i + j);
      let VP = dictVP.trans[subStr];
      if (VP) {
        if (Motnghia) VP = VP.split(daucach)[0];
        if (Ngoac) VP = `[${VP}]`;
        result += ' ' + VP;
        str.replace(subStr, _magic.repeat(subStr.length));
        i += j;
      }
      if (j == 1) {
        if (DichLieu && dichlieu.includes(str.charAt(i))) continue;
        result += dictPA.trans[str.charAt(i)] ? (' ' + dictPA.trans[str.charAt(i)]) : str.charAt(i);
        str.replace(str.charAt(i), _magic);
      }
    }
  }
  return result.replaceAll(/[ ]+/g, ' ');
}

function transSP1(str) {
  const regNumber = /{\d}/g
  if (dictSP.org == undefined) return false;
  dictSP.org.forEach(sp => {
    let aC = sp.match(regNumber);
    let vC = new RegExp(sp.replaceAll(regNumber, '[\\p{sc=Han}、，,0-9]+'), 'ug');
    let vV = dictSP.trans[sp];
    aC.forEach(ac => vV = vV.replace(ac, `$${aC.indexOf(ac) + 1}`));
    str.replaceAll(vC, `<{vV}>`);
  })
}
const transSP = transSP1;

function translateNode(rootNode) {
  let nodeArr = [];
  let nodesText = '';
  const limiter = ''.repeat(2); //'\uf0f5'

  function nodeToArr(node) {
    if (node.nodeType == 3) {
      nodeArr.push(node);
      nodesText += node.textContent + limiter;
    }
    node.childNodes.forEach((childNode) => nodeToArr(childNode))
  }

  nodeToArr(rootNode);
  transVP(nodesText, Options.Ngoac, Options.VPmotnghia, Options.Daucachnghia, Options.Xoadichlieutru)
    .split(limiter).forEach((text, index) => { if (nodeArr[index] == undefined) return; nodeArr[index].textContent = text; });
}

async function fileLoad(event) {
  let txt = '';
  let tmp;
  if (event.target.files[0]) txt = await event.target.files[0].text(); else return false;
  console.log(txt);
  switch (event.target.id) {
    case 'fPA':
      tmpDictPA = {};
      tmpDictPA.trans = str2Dict(txt); break;

    case 'fVP':
      tmpDictVP = {};
      tmpDictVP.trans = str2Dict(txt);
      tmpDictVP.org = [];
      tmpDictVP.org[0] = Object.keys(tmpDictVP.trans).toSorted((a, b) => b.length - a.length || a.localeCompare(b))[0] ?? '';
      break;

    case 'fNames':
      tmpDictNames = {};
      tmpDictNames.trans = str2Dict(txt);
      tmpDictNames.org = Object.keys(tmpDictNames.trans).toSorted((a, b) => b.length - a.length || a.localeCompare(b));
      break;

    case 'fSP':
      tmpDictSP = {};
      tmpDictSP.trans = str2Dict(txt);
      tmpDictSP.org = Object.keys(tmpDictSP.trans).toSorted(sortSP);
      break;
  }
}

function $(e) { return e ? document.getElementById(e) || document.querySelector(e) : false };

(async function () {
  'use strict';
  if (window.self != window.top) return;

  document.body.insertAdjacentHTML('beforeend', `
  <div style="display: flex; position: fixed;top: 1%; right:1%; margin: 0px; padding: 0px; border: thin; z-index:99999">
    <button style="height:90%; border: none; text-align:right; padding: 5px 0px 5px 5px; margin:0px;">Tran</button>
    <button style="height:90%; border: none; text-align:left; padding: 5px 5px 5px 0px; margin:0px;">slate</button>
    <button style="height:90%; border: none; text-align:right; padding:5px 0px 5px 0px; margin:0px;">↓</button>
  </div>
  <dialog id="usDialog" style="border:none; border-radius:.3rem; font-family: Arial; padding:.3rem; margin:auto;" spellcheck="false" lang="vie">
    <fieldset style="text-align: left;">
      <legend>Từ điển</legend>
      <label for="fPA">Phiên Âm&nbsp;&nbsp;&nbsp;<input type="file" id="fPA"></label><br />
      <label for="fVP">Vietphrase&nbsp;<input type="file" id="fVP"></label><br />
      <label for="fNames">Names&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<input type="file" id="fNames"></label><br />
      <label for="fSP">Strucphrase <input type="file" id="fSP"></label><br />
    </fieldset>
    <fieldset style="text-align: left">
      <legend>Tùy chọn dịch</legend>
      <label for="cbNgoac"><input type="checkbox" id="cbNgoac"> Dùng [ngoặc]</label><br />
      <label for="cbMotnghia"><input type="checkbox" id="cbMotnghia"> Một nghĩa</label><br />
      <label for="cbDichLieu"><input type="checkbox" id="cbDichLieu"> Xóa "đích, liễu, trứ"</label><br />
      <label for="cbSP"><input type="checkbox" id="cbSP"> Dùng Strucphrase</label><br />
    </fieldset>
    <div style="display:flex; justify-content:space-around;">
      <button style="width: 3rem;">OK</button>
      <button onclick="this.parentElement?.parentElement?.close()">Cancel</button>
    </div>
  </dialog>`);

  const mouseClick1 = function () {
    console.time('Translate 1');
    document.title = transPA(document.title);
    document.body.innerHTML = transVP(document.body.innerHTML, Options.Ngoac, Options.Motnghia, Options.daucach, Options.DichLieu);
    console.timeEnd('Translate 1');
  }

  const mouseClick2 = function () {
    console.time('Translate 2');
    document.title = transPA(document.title);
    translateNode(document.body);
    console.timeEnd('Translate 2');
  }

  const dialog = document.querySelector('dialog#usDialog');
  dialog.previousElementSibling.firstElementChild.onclick = mouseClick1; // Tran button
  dialog.previousElementSibling.firstElementChild.nextElementSibling.onclick = mouseClick2; //slate button
  dialog.previousElementSibling.lastElementChild.onclick = () => { // Menu ↓ button
    tmpDictPA = undefined;
    tmpDictVP = undefined;
    tmpDictNames = undefined;
    tmpDictSP = undefined;
    if (dialog.open) dialog.close();

    dialog.querySelectorAll('input[type="file"]').forEach(el => el.value = null);
    dialog.querySelector('#cbNgoac').checked = Options.Ngoac;
    dialog.querySelector('#cbMotnghia').checked = Options.Motnghia;
    dialog.querySelector('#cbDichLieu').checked = Options.DichLieu;
    dialog.querySelector('#cbSP').checked = Options.useSP;
    dialog.showModal();
  }

  dialog.querySelectorAll('input[type="file"]').forEach(el => el.onchange = fileLoad);
  dialog.querySelector('div>button').onclick = () => {  //OK button
    if (tmpDictPA != undefined) {
      dictPA = tmpDictPA;
      GM_setValue('dictPA', dictPA)
    }

    if (tmpDictVP != undefined) {
      dictVP = tmpDictVP;
      GM_setValue('dictVP', dictVP)
    }

    if (tmpDictNames != undefined) {
      dictNames = tmpDictNames;
      GM_setValue('dictNames', dictNames)
    }

    if (tmpDictSP != undefined) {
      dictSP = tmpDictSP;
      GM_setValue('dictSP', dictSP)
    }

    Options.Ngoac = dialog.querySelector('#cbNgoac').checked;
    Options.Motnghia = dialog.querySelector('#cbMotnghia').checked;
    Options.DichLieu = dialog.querySelector('#cbDichLieu').checked;
    Options.useSP = dialog.querySelector('#cbSP').checked;
    GM_setValue('Options', Options);
    dialog.close();
  }

})();
