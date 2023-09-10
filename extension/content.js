let Options;

function $(e) { return e ? document.getElementById(e) || document.querySelector(e) : false };

async function translateNode(rootNode) {
    let nodesText = '';
    let nodeArr = [];
    const limiter = '\uf0f3'.repeat(1);
    function nodeToArr(node) {
        if (node.nodeType == 3) {
            nodeArr.push(node);
            nodesText += node.textContent + limiter;
        }
        node.childNodes.forEach((childNode) => nodeToArr(childNode))
    }

    nodeToArr(rootNode);
    chrome.runtime.sendMessage({ 'action': 'translate', 'payload': nodesText }, (mess) => {
        let textArr = mess.payload.split(limiter);
        textArr.forEach((text, index) => nodeArr[index].textContent = text);
    });
}

function loadOptions(fn) {
    return chrome.runtime.sendMessage({ 'action': 'loadOptions', 'payload': '' }, fn)
}

let lang, percent;
let charset = document.querySelector('meta[charset]')?.getAttribute('charset').toLowerCase();
if (charset == undefined || !charset.includes('gb')) {
    let metaContent = document.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content')?.toLowerCase();
    if (metaContent?.includes('charset')) charset = metaContent.slice(metaContent.indexOf('charset=') + 8); else charset = '';
}
if (charset.includes('gb')) lang = 'zh';
else chrome.i18n.detectLanguage(document.title, (langInfo) => {
    langInfo.languages.forEach(l => {
        lang = l.language;
        percent = l.percentage;
        return;  //Escape from forEach
    })
});

loadOptions((mess) => {
    Options = mess.payload;
    let webArr = [];
    webArr = Options.optionWebsites.split(/[;,\n]/).map(w => w.trim());
    let skipWeb = webArr.reduce((skip, web) => {
        let reg = new RegExp(web, 'i');
        return skip || reg.test(window.location.hostname);
    }, false);

    if (lang.includes('zh') && Options.optionAutoTrans && !skipWeb) translateNode(document);
    else {
        let btnTranslate = document.createElement('button');
        btnTranslate.style.position = 'absolute';
        btnTranslate.style.top = '2px';
        btnTranslate.style.right = '2px';
        btnTranslate.style.zIndex = '9999999';
        btnTranslate.innerText = 'Translate'
        document.body.appendChild(btnTranslate); //Tai sao khong them vao???
        btnTranslate.onclick = () => { translateNode(document); btnTranslate.style.display = 'none' }
    }

    if (Options.optionThayfont)
        document.body.style.fontFamily = Options.optionFont.split(/[;,]/).filter(e => e != '').join() + ', arial;';
});
