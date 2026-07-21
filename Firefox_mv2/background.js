// --- KHỞI TẠO INDEXEDDB ---
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
  request.onerror = (e) => {console.log('Loi tai day'); reject(e.target.error);}
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

async function reloadOptions() {
  try {
    const data = await browser.storage.local.get(['Options']);
    console.log(data);
    Options = data.Options || {
      Ngoac: false,
      Motnghia: true,
      daucach: ';',
      DichLieu: true,
    };
  } catch (err) {
    console.error("Lỗi reload options:", err);
  }
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


browser.runtime.onMessage.addListener((message, sender) => {
  switch(message.action) {
      case "translate":
        const result = translateText(message.text, message.options);
        return Promise.resolve({ translated: result });
        
      case "translateBatch":
        const textArray = message.texts || [];
        const translatedArray = textArray.map(txt => translateText(txt, message.options));
        return Promise.resolve({ translatedTexts: translatedArray });
			
      case "openOptionsPage": 
        browser.runtime.openOptionsPage();
        return Promise.resolve({ status: "success" });
			
      case "reloadOptions":
        return reloadOptions().then(() => ({ status: "success" }));
		
	  case 'addDict':
	    (async () => {
		  if (!currentDicts) currentDicts=Object.create(null);
		  const { file, name, priority } = message;
		  const textContent= await file.text();
		  const dictData = importDict(textContent);
		  currentDicts[name] = { dict: dictData, priority: message.priority };            
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
});

//browser.runtime.onStartup.addListener(() => preloadData() );

browser.runtime.onInstalled.addListener(async (details) => {
  await openDB();
  if (details.reason === 'install') {
    browser.runtime.openOptionsPage();
	return;
  }
  //await preloadData();
});


(function init() {
  reloadOptions();
  (async function loadTrie() {
    try {
      trieCache = await dbGet("trieCache");
    } catch (err) {
      console.warn("Lỗi khi load trie từ IndexedDB:", err);
      trieCache = Object.create(null);
    }
  })();
})();