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
    if (Options.optionThayfont) {
        const font = Options.optionFont.split(/[;,]/).filter(e => e != '').join() + ', Arial !important;';
        const style = document.createElement('style');
        style.appendChild(document.createTextNode(`body {font-family: ${font}}`));
        document.head.appendChild(style);
    }

    let mess = await browser.runtime.sendMessage({ 'action': 'translate', 'payload': nodesText });
    let textArr = mess.payload.split(limiter);
    textArr.forEach((text, index) => nodeArr[index].textContent = text);
}

function loadOptions() {
    return browser.runtime.sendMessage({ 'action': 'loadOptions', 'payload': '' })
}

let lang, percent;
browser.i18n.detectLanguage(document.title).then(langInfo => {
    if (document.getElementsByTagName('html')[0].getAttribute('lang')?.includes('zh')) lang='zh';
    let charset = document.querySelector('meta[charset]')?.getAttribute('charset').toLowerCase();
    if (charset == undefined || !charset.includes('gb')) {
        let metaContent = document.querySelector('meta[http-equiv="Content-Type"]')?.getAttribute('content')?.toLowerCase();
        if (metaContent?.includes('charset')) charset = metaContent.slice(metaContent.indexOf('charset=') + 8); else charset = '';
    }
    if (charset.includes('gb')||lang=='zh') lang = 'zh'; else
        langInfo.languages.forEach(l => {
            lang = l.language;
            percent = l.percentage;
            return;  //Escape from forEach
        })

    loadOptions().then(mess => {
        Options = mess.payload;
        let webArr = [];
        webArr = Options.optionWebsites.split(/[;,\n]/).map(w => w.trim());
        let skipWeb = webArr.reduce((skip, web) => {
            let reg = new RegExp(web, 'i');
            return skip || reg.test(window.location.hostname);
        }, false);

        console.log(`lang: ${lang}`);
        if (lang.includes('zh') && Options.optionAutoTrans && !skipWeb) translateNode(document);
        else {
            let btnTranslate = document.createElement('button');
            btnTranslate.style.position = 'absolute';
            btnTranslate.style.top = '2px';
            btnTranslate.style.right = '2px';
            btnTranslate.style.zIndex = '999999';
            btnTranslate.innerText = 'Translate'
            document.body.appendChild(btnTranslate);
            btnTranslate.onclick = () => { translateNode(document);}
        }
    });
});

