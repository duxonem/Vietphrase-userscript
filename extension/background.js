let dictPhienAm, dictNames, dictVP, dictSP;
let Options;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let payload;
    switch (message.action) {
        case 'translate': payload = translate(message.payload); break;
        case 'loadData': { loadData(); payload = ''; return; }
        case 'loadOptions': loadOptions().then(() => {
            payload = Options;
            sendResponse({ 'action': message.action, 'payload': payload });
        });
            return true;
        default: { }
    }
    sendResponse({ 'action': message.action, 'payload': payload });
    return true;
});


function translate(text) {
    if (Options.optionSp) return VPTrans(strucTrans(text, Options.optionSpNgoac));
    else return VPTrans(text);
}

function PhienAmTrans(text) {
    dictPhienAm.Han.forEach(Han => text = text.replaceAll(Han, ` ${dictPhienAm.HanViet[Han]}`));
    return text;
}

function VPTrans(text, Ngoac = true, Motnghia = false, Daucach = ';', XoaDich = false) {
    const DichLieuTru = ['的', '了', '著'];
    dictNames.Han.forEach(Han => text = text.replaceAll(Han, ` ${dictNames.HanViet[Han]}`));
    dictVP.Han.forEach((Han) => {
        let VP;
        if (Motnghia) VP = dictVP.HanViet[Han].split(Daucach)[0];
        else VP = dictVP.HanViet[Han];
        if (Ngoac) VP = `[${VP}]`;
        text = text.replaceAll(Han, ` ${VP}`)
    });

    if (XoaDich) DichLieuTru.forEach(dich => text = text.replaceAll(dich, ' '));

    dictPhienAm.Han.forEach(Han => text = text.replaceAll(Han, ` ${dictPhienAm.HanViet[Han]}`));
    text = text.replaceAll(/(\s+)/g, ' ');
    return text;
}

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
                    if (k == 1) { skipThisStep = true; break; }
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
                    if (k == 1) { skipThisStep = true; break; }
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
                    if (k == 1) { skipThisStep = true; break; }
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
                    if (k == 1) { skipThisStep = true; break; }
                }
            }
            if (skipThisStep) return;
            let vText1 = vText;
            searchEl.forEach((el, index) => vText1 = vText1.replace(el, matchCase[index]))
            if (Ngoac) text = text.replaceAll(cMatch, `<${vText1}>`);
            else text = text.replaceAll(cMatch, vText1);
        })
    })
    return text;
}

const indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
function firstRun() {
    let request = indexedDB.open("QTlikedWebExt", 1);

    request.onupgradeneeded = () => {
        let dbase = request.result;
        if (!dbase.objectStoreNames.contains("dataStore"))
            dbase.createObjectStore("dataStore", { keyPath: 'name' });
        // dbase.close();
    }
    request.onsuccess = () => {
        let dbase = request.result;
        if (!dbase.objectStoreNames.contains("dataStore"))
            dbase.createObjectStore("dataStore", { keyPath: 'name' });
        console.log('connect database successed');
        dbase.close();
    }
    request.onerror = function (e) { console.log('Loi ', e.target.error); dbase.close(); }
}

function loadData() {
    const request = indexedDB.open("QTlikedWebExt", 1);
    let tmpDicts = {};
    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            dbase = request.result;
            if (dbase.objectStoreNames.contains("dataStore")) {
                let tt = dbase.transaction('dataStore').objectStore('dataStore').getAll();
                tt.onsuccess = function (e) {
                    if (e.target.result == undefined) reject();
                    else {
                        e.target.result.forEach(data1 => {
                            switch (data1.name) {
                                case 'Options': Options = JSON.parse(data1.data); break;
                                case 'PhienAm': dictPhienAm = JSON.parse(data1.data); break;
                                case 'Names': dictNames = JSON.parse(data1.data); break;
                                case 'VP': dictVP = JSON.parse(data1.data); break;
                                case 'SP': dictSP = JSON.parse(data1.data); break;
                                default: reject();
                            }
                        })
                        resolve();
                    }
                }
                tt.onerror = () => reject();
                dbase.close();
            }
            request.onerror = () => reject();
        };
    });
}

function loadOptions() {
    const request = indexedDB.open("QTlikedWebExt", 1);
    let tmpDicts = {};

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            dbase = request.result;
            if (dbase.objectStoreNames.contains("dataStore")) {
                let tt = dbase.transaction('dataStore').objectStore('dataStore').get('Options');
                tt.onsuccess = function (e) {
                    if (e.target.result == undefined) reject();
                    else { Options = JSON.parse(e.target.result.data); resolve(); }
                }
                tt.onerror = () => reject();
                dbase.close();
            }
        }
        request.onerror = () => reject();
    });
}

chrome.runtime.onInstalled = () => { chrome.tabs.create({ url: "options.html" }); };
firstRun();
loadData().then(() => console.log('Data loaded')).catch(() => console.log('Cannot load Data'));
