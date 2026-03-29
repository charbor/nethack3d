const elMsg = document.getElementById('msg');
let msgTimer = 0;

export function showMsg(text) {
  elMsg.textContent = text;
  elMsg.style.opacity = '1';
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => { elMsg.style.opacity = '0'; }, 3000);
}
