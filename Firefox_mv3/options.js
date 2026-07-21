let Options;
( () => browser.storage.local.get(['Options']).then(data => {
    Options= data.Options || {
	  Ngoac: false,
	  Motnghia: true,
	  daucach: ';',
	  DichLieu: true,
	  font: 'Roboto',
	  whiteList: {},
	  blackList: '.vn,', }
	  
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
  })
)();

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
	const priority=['','PhienAm','Vietphrase','Names'].indexOf(name);
	//const priority = event.target.getAttribute('prior');
	
	//chay vơi chrome 148, message_serialization:"structure_clone"
	browser.runtime.sendMessage({action:'addDict',file, name, priority}); 
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
  
  browser.storage.local.set({Options:Options}).then(() => {
	browser.runtime.sendMessage({ action: "reloadOptions"}, (a) => {console.log(a)});
  });
  
  if (isDictAdded) {
	browser.runtime.sendMessage({action:'updateTrie'})
	isDictAdded=false;
  }
  
  const status = document.getElementById('status');
  status.style.setProperty('display', 'block');  
  setTimeout(() => { 
		status.style.setProperty('display', 'none'); 
		window.close()
	  }, 500) 
};