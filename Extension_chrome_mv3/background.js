const DB_NAME = "VietphraseDB";
const DB_VERSION = 1;
let Options;
let trieCache;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;  
      if (!db?.objectStoreNames?.contains("dictionary")) {
        db.createObjectStore("dictionary");
      }
	  resolve(db);
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function dbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction("dictionary", "readonly").objectStore("dictionary");
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const store = db.transaction("dictionary", "readwrite").objectStore("dictionary");
    const request = store.put(value, key);
    request.onsuccess = () => resolve(['dbSet Success', request]);
    request.onerror = () => reject(request.error);
  });
}

function reloadOptions() {
  chrome.storage.local.get(['Options']).then((data) => {
			console.log(data)
			Options = data.Options || {
			Ngoac: false,
			Motnghia: true,
			daucach: ';',
			DichLieu: true,
		} });
}

function importDict(text) {
  const dict = Object.create(null);
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("//")) continue;
    const [c, v] = trimmed.split("=").map(s => s.trim());
    if (c && v) dict[c] = v;
  }
  return dict;
}

function buildTrie(dicts) {
  const root = { children: Object.create(null), value: null, priority: 0 };
  const sorted = Object.values(dicts).sort((a, b) => b.priority - a.priority);

  for (const { dict, priority } of sorted) {
	console.log(dict, priority)  
    if (!dict) continue;
    for (const key in dict) {
      let node = root;
      for (const char of key) {
        if (!node.children[char]) {
          node.children[char] = { children: Object.create(null), value: null, priority: 0 };
        }
        node = node.children[char];
      }
      const numPriority = parseInt(priority, 10) || 0;
      if (numPriority >= node.priority) {
        node.value = dict[key];
        node.priority = numPriority;
      }
    }
  }
  return root;
}

function translateText(str) {
  if (!/\p{sc=Han}/u.test(str)) return str;
  const root = trieCache || Object.create(null);
  const parts = [];
  
  const bracket = Options.Ngoac;
  const oneMean = Options.Motnghia;
  const sep = Options.daucach || ';';
  const DichLieu = Options.DichLieu;

  const tokens = str.split(/([^\p{sc=Han}]+)/ug);
  tokens.forEach((text, index) => {
    if (index % 2 === 1) {
      parts.push(text);
      return;
    }
    
    let i = 0;
    while (i < text.length) {
      let node = root, j = i;
      let lastMatch = null, lastPos = i, lastPriority = 0;

      while (j < text.length && node?.children && node.children[text[j]]) {
        node = node.children[text[j]];
        j++;
        if (node.value) {
          const nodePriority = node.priority || 0;
          if (nodePriority > lastPriority || (nodePriority === lastPriority && j > lastPos)) {
            lastMatch = node.value;
            if (nodePriority === 2) { 
              if (oneMean) lastMatch = lastMatch.split(sep)[0];
              if (bracket) lastMatch = `[${lastMatch}]`;
            }
            lastPos = j;
            lastPriority = nodePriority;
          }
        }
      }

      if (lastMatch) {
        parts.push(lastMatch);
        i = lastPos;
      } else {
        if (!(DichLieu && '的了着'.includes(text[i]))) {
          parts.push(text[i]);
        }
        i++;
      }
    }
  });

  const punctMap = { "。": ".", "！": "!", "？": "?", "，": ",", "：": ":", "；": ";" };
  let output = parts.join(" ")
    .replace(new RegExp(`[${Object.keys(punctMap).join('')}]`, 'g'), c => punctMap[c])
    .replace(/(^[\s\[“]*\p{L}|[.!?][\s\[“]*\p{L})/ug, m => m.toUpperCase())
    .replace(/(\s+?[.!?,:;])/g, m => m.trim());
    
  return output;
}


let currentDicts;
self.onmessage = async (event) => {
	await (async ()=> currentDicts = currentDicts ?? (await dbGet("dictsCache") || Object.create(null)))();
	switch (event.data.action)	{
	  case 'addDict':
	    (async () => {
		  console.log('Add Dict')  
		  const decoder = new TextDecoder("utf-8");
		  const textContent = decoder.decode(event.data.buffer);
		  const dictData = importDict(textContent);
		  currentDicts[event.data.name] = { dict: dictData, priority: event.data.priority };            
		})();
		break;
		
	  case 'updateTrie':
		(async () => {
		  trieCache = buildTrie(currentDicts);
          await dbSet("dictsCache", currentDicts);
		  await dbSet("trieCache", trieCache);
		  currentDicts=null
		})();
		break;
	}
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
	  case "translate":
		(()=>{
			const result = translateText(message.text, message.options);
			sendResponse({ translated: result });
			return true;
		})();
		break;
		
	  case "translateBatch":
		(()=>{
			const textArray = message.texts || [];
			const translatedArray = textArray.map(txt => translateText(txt, message.options));
			sendResponse({ translatedTexts: translatedArray });
			return true;
		})();	
		break;
			
	  case "openOptionsPage": 
		chrome.runtime.openOptionsPage();
		sendResponse({ status: "success" });
		break;
			
	  case "reloadOptions":
		reloadOptions();
		sendResponse({ status: "success" });
		break;
  }
 
});

const activePorts = new Set();
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'Long_live_me') { 
    activePorts.add(port);

    port.onMessage.addListener((message) => {
      if (message.action === 'ping') { 
        try {
          port.postMessage({ action: 'pong' });
        } catch(e) {
          activePorts.delete(port);
        }

        chrome.storage.local.get(['__keepAlive']);
      }
    });

    port.onDisconnect.addListener(() => {
      activePorts.delete(port);
    });
  }
});


async function preloadData() {
  if (trieCache && Object.keys(trieCache).length > 0) {
    console.log("[Background] Trie đã có sẵn trong bộ nhớ RAM, không cần tải lại.");
    return;
  }

  try {
    console.time("[Background] Đang tải trước Trie vào RAM");
    reloadOptions(); 
    trieCache = await dbGet("trieCache");
    console.timeEnd("[Background] Đang tải trước Trie vào RAM");
  } catch (err) {
    console.log("[Background] Lỗi khi tải trước Trie từ IndexedDB:", err);
    trieCache = Object.create(null);
  }
}

chrome.runtime.onStartup.addListener(() => preloadData() );

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage();
	return;
  }
  await openDB();
  await preloadData();
});

chrome.tabs.onCreated.addListener((tab) => {
  console.log(`[Background] Sự kiện: Tab mới được tạo (ID: ${tab.id}).`);
  preloadData();
});


(function init() {
  preloadData();
})();