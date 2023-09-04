function $(e) { return e ? document.getElementById(e) || document.querySelector(e) : false };

function translateNode(rootNode) {
    let nodeArr = [];
    let nodesText = '';
    const limiter = '\uf0f3'.repeat(1);

    function nodeToArr(node) {
        if (node.nodeType == 3) {
            nodeArr.push(node);
            nodesText += node.textContent + limiter;
        }
        node.childNodes.forEach((childNode) => nodeToArr(childNode))
    }

    function receiveTranslate(message) {
        let textArr = message.payload.split(limiter);
        textArr.forEach((text, index) => nodeArr[index].textContent = text);
        browser.runtime.onMessage.removeListener(receiveTranslate);
    }

    nodeToArr(rootNode);
    browser.runtime.sendMessage({ 'action': 'translate', 'payload': nodesText });
    browser.runtime.onMessage.addListener(receiveTranslate);
}

// function translate(text) {   //Thís is the original, works fine
//     browser.runtime.sendMessage({ action: 'translate', payload: text });
//     return new Promise((resolve) => {
//         function receiveTranslate(message) {
//             browser.runtime.onMessage.removeListener(receiveTranslate);
//             resolve(message.payload);
//         }
//         browser.runtime.onMessage.addListener(receiveTranslate);
//     })
// }


let btnTranslate = document.createElement('button');
btnTranslate.style.position = 'absolute';
btnTranslate.style.top = '2px';
btnTranslate.style.right = '2px';
btnTranslate.innerText = 'Translate'
document.body.appendChild(btnTranslate);
btnTranslate.onclick = () => { translateNode(document); btnTranslate.style.display = 'none' }
