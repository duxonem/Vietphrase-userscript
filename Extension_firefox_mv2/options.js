let Options;

async function loadInitialOptions() {
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
  } catch (err) {
    console.error("Lỗi đọc Options:", err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadInitialOptions();

    document.getElementById('Ngoac').checked = !!Options.Ngoac;
    document.getElementById('Motnghia').checked = !!Options.Motnghia;
    document.getElementById('daucach').value = Options.daucach ?? ';';
    document.getElementById('DichLieu').checked = !!Options.DichLieu;
    document.getElementById('font').value = Options.font ?? 'Roboto';
    document.getElementById('blackListText').value = Options.blackList ? Options.blackList.replace(/, /g, ',') : '.vn,';

    for (const [host, noButton] of Object.entries(Options.whiteList || {})) {
      if (!host.trim()) continue;
      let domainInput = addNewRow();
      domainInput.value = host.trim();
      domainInput.nextElementSibling.checked = noButton;
    }
    addNewRow(); 
});

document.querySelectorAll('.tab-btn').forEach(tabBtn => {
  tabBtn.addEventListener('click', event => {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    event.target.classList.add('active');
    const targetTabId = event.target.getAttribute('data-tab');
    document.getElementById(targetTabId).classList.add('active');
  });
});

let isDictAdded;
document.querySelectorAll('input[type="file"]').forEach(f => {
  f.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const name = event.target.getAttribute('id');
    const priority = event.target.getAttribute('prior');
	const buffer= await file.arrayBuffer()
	const bg = (await navigator.serviceWorker.ready)?.active;
	if (bg) bg.postMessage({action:'addDict', buffer, name, priority },[buffer])
	isDictAdded=true;
  });
});

function addNewRow() {
  const container = document.getElementById('dynamic-container');
  container.insertAdjacentHTML('beforeend', `
    <div class="form-row dynamic-row">
      <input type="text" class="dynamic-input" style="max-width:250px;"><input type="checkbox"> <label style="min-width:auto;">Xóa nút Translate</label>
    </div>`);

  let lastRowInput = container.querySelector('.dynamic-row:last-child input[type="text"]');
  lastRowInput.oninput = onInput;
  lastRowInput.onblur = onBlur;
  return lastRowInput;
}

function onInput(event) {
  const container = document.getElementById('dynamic-container');
  if (event.target.parentElement === container.querySelector('.dynamic-row:last-child')) addNewRow();
}

function onBlur(event) {
  const container = document.getElementById('dynamic-container');
  const rows = container.querySelectorAll('.dynamic-row');
  if (event.target.value.trim() !== '' && event.target === container.querySelector('.dynamic-row:last-child input[type="text"]')) {
    addNewRow();
  }
  if (rows.length > 1 && event.target.value.trim() === "") {
    const parentRow = event.target.parentElement;
    if (event.target !== container.querySelector('.dynamic-row:last-child input[type="text"]')) parentRow.remove();
  }
}

document.getElementById('saveOptionsBtn').onclick = async () => {
  Options.Ngoac = !!document.getElementById('Ngoac').checked;
  Options.Motnghia = !!document.getElementById('Motnghia').checked;
  Options.daucach = document.getElementById('daucach').value.trim().slice(0, 2) || ';';
  Options.DichLieu = !!document.getElementById('DichLieu').checked;
  Options.font = document.getElementById('font').value.trim();

  Options.whiteList = Object.create(null);
  document.querySelectorAll('.dynamic-input').forEach(e => {
    if (e.value.trim()) Options.whiteList[e.value.trim()] = e.nextElementSibling.checked;
  });

  Options.blackList = document.getElementById('blackListText').value.replace(/\r?\n/g, ', ');
  
  try {
    if (isDictAdded) {
	  const bg = (await navigator.serviceWorker.ready)?.active;
	  if (bg) {
		bg.postMessage({action:'updateTrie'})
		isDictAdded=false;  }
    }
    
    await browser.storage.local.set({ Options: Options });
    await browser.runtime.sendMessage({ action: "reloadOptions" });
    
    const status = document.getElementById('status');
    status.style.setProperty('display', 'block');
    setTimeout(() => { status.style.setProperty('display', 'none'); }, 2500);
    
    setTimeout(() => { window.close(); }, 500);
  } catch (err) {
    console.error("Lỗi lưu cấu hình:", err);
  }
};