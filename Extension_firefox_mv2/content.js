(async function() {
  'use strict';

  let Options;
  try {
    const data = await browser.storage.local.get(['Options']);
    Options = data.Options || {
      Ngoac: false,
      Motnghia: true,
      daucach: ';',
      DichLieu: true,
      font: 'Roboto',
      whiteList: {},
      blackList: '.vn,',
    };
  } catch (e) {
    console.error("Lỗi đọc Options:", e);
  }
	
  if (Options.blackList.split(/[,;]/g).some(e => !!e.trim() ? location.host.includes(e.trim()) : false)) return;
  if (window !== window.top) return;

  async function requestTranslateBatch(textArray) {
    try {
      const response = await browser.runtime.sendMessage({ 
        action: "translateBatch", 
        texts: textArray, 
        options: Options 
      });
      return response ? response.translatedTexts : textArray;
    } catch (err) {
      console.error(err);
      return textArray;
    }
  }

  const observer = new MutationObserver(async (mL) => {
    observer.disconnect();
    const nodesToTranslate = [];
    for (const mo of mL) {
      for (const addNode of mo.addedNodes) {
        collectTextNodes(addNode, nodesToTranslate);
      }
    }
    if (nodesToTranslate.length > 0) {
      await translateAndApplyNodes(nodesToTranslate);
    }
    resumeObserver();
  });

  function resumeObserver() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true });
  }

  const originalTitle = document.title;
  const originalBodyFont = getComputedStyle(document.body).getPropertyValue('font-family') ?? '';
  const originalTexts = new Map();
  const skipTags = ['META', 'LINK', 'SCRIPT', 'STYLE', 'TEXTAREA', 'IMG', 'SVG', 'BR', 'NOSCRIPT', 'AREA', 'BASE', 'CANVAS', 'CODE', 'EMBED', 'MAP', 'PARAM', 'SOURCE', 'VIDEO', 'PICTURE', 'INPUT'];

  function collectTextNodes(root, bucket) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parentTag = node.parentNode?.tagName;
        if (skipTags.includes(parentTag)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    while ((node = walker.nextNode())) {
      bucket.push(node);
    }
  }

  async function translateAndApplyNodes(nodes) {
    const textsToTranslate = nodes.map(node => {
      if (!originalTexts.has(node)) originalTexts.set(node, node.textContent);
      return node.textContent;
    });

    const translatedTexts = await requestTranslateBatch(textsToTranslate);

    for (let i = 0; i < nodes.length; i++) {
      if (translatedTexts[i] !== undefined) {
        nodes[i].textContent = translatedTexts[i];
      }
    }
  }

  async function applyTranslation() {
    try {
      const response = await browser.runtime.sendMessage({ action: "translate", text: originalTitle, options: Options });
      if (response) document.title = response.translated;
    } catch (err) {
      console.error(err);
    }

    observer.disconnect();
    const nodesToTranslate = [];
    if (document.body) collectTextNodes(document.body, nodesToTranslate);
    if (nodesToTranslate.length > 0) await translateAndApplyNodes(nodesToTranslate);
    if (document.body) document.body.style.setProperty('font-family', Options.font, 'important');
    resumeObserver();
  }

  function restoreOriginal() {
    document.title = originalTitle;
    if (originalBodyFont && document.body) document.body.style.fontFamily = originalBodyFont;
    for (const [node, text] of originalTexts.entries()) {
      node.textContent = text;
    }
    observer.disconnect();
  }

  // --- UI GIAO DIỆN MINI ---
  const uiHTML = `
  <style>
    .vphrase-mini-panel {
      position: fixed; top: 7px; right: 8px; z-index: 2147483647; 
      background: #ffffff; border: 1px solid #d1d5db; border-radius: 4px; 
      padding: 4px 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); 
      font-family: system-ui, -apple-system, sans-serif; font-size: 13px;
      user-select: none; display: flex; gap: 6px; align-items: center;
    }
    #translateBtn, #optionsBtn { cursor: pointer; padding: 2px 6px; border-radius: 3px; font-weight: 500;}
    #translateBtn { background: #2563eb; color: white; }
    #translateBtn:hover { background: #1d4ed8; }
    #optionsBtn { background: #f3f4f6; color: #4b5563; }
    #optionsBtn:hover { background: #e5e7eb; }
  </style>
  <div class="vphrase-mini-panel">
    <span id="translateBtn">Convert</span>
    <span id="optionsBtn" title="Mở trang cài đặt">☰</span>
  </div>`;

  const host = document.createElement("div");
  const shadow = host.attachShadow({ mode: "open" });

  function prepareUI() {
    shadow.innerHTML = uiHTML;
    document.body.appendChild(host);

    shadow.getElementById(`translateBtn`)?.addEventListener("click", async (event) => {
      let start = performance.now();
      if (event.target.textContent.trim() === 'Convert') {
        event.target.textContent = 'Nguyên gốc';
        event.target.style.background = '#dc2626';
        await applyTranslation();
      } else {
        event.target.textContent = 'Convert';
        event.target.style.background = '#2563eb';
        restoreOriginal();
      }
      console.log("Tổng thời gian xử lý Batch (ms):", performance.now() - start);
    });

    shadow.getElementById(`optionsBtn`)?.addEventListener("click", async () => {
      try {
        await browser.runtime.sendMessage({ action: "openOptionsPage" });
      } catch (e) {
        console.error(e);
      }
    });
  }

  let checkedAuto = false;
  for (const [hostName, noButton] of Object.entries(Options.whiteList || {})) {
    if (location.host.includes(hostName.toLowerCase())) {
      checkedAuto = true;
      if (noButton) {
        await applyTranslation();
      } else {
        prepareUI();
        shadow.getElementById(`translateBtn`).click();
      }
      break;
    }
  }

  if (!checkedAuto) prepareUI();
})();