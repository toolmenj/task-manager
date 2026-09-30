/* ===================================================================
   My Task Manager — script.js
   第三階段：JavaScript 功能（35 分）

   ┌─────────────────────────────────────────────────────────────┐
   │ 這份檔案的分工                                              │
   │   已寫好：資料結構、DOM 取得、事件綁定、DOM 建立、儲存       │
   │   你要寫：6 個標了 ★TODO★ 的函式（35 分全在這裡）           │
   │                                                             │
   │ 建議順序（每寫完一個就存檔、重整、當場測試）：              │
   │   ① render        → 畫面出得來，後面才有得測                │
   │   ② addTask       → CP3-1（8分）                            │
   │   ③ toggleTask    → CP3-2（7分）                            │
   │   ④ deleteTask    → CP3-3（5分）                            │
   │   ⑤ getVisibleTasks → CP3-4（8分）                          │
   │   ⑥ updateStats   → CP3-5（7分）                            │
   └─────────────────────────────────────────────────────────────┘
   =================================================================== */

'use strict';

/* ===================================================================
   1. 資料：任務都存在這裡
   -------------------------------------------------------------------
   每個任務長這樣： { id: 1727680000000, text: '完成實作', done: false }
   ★ 第四階段會問你「使用哪一個變數保存任務？」→ 答案就是 tasks
   =================================================================== */

const STORAGE_KEY = 'my-task-manager';

let tasks = loadTasks();     // 任務陣列
let currentFilter = 'all';   // 'all' | 'active' | 'done'


/* ===================================================================
   2. 取得畫面上的元素
   =================================================================== */

const formEl    = document.getElementById('add-form');
const inputEl   = document.getElementById('task-input');
const hintEl    = document.getElementById('input-hint');
const filterBar = document.getElementById('filter-bar');
const listEl    = document.getElementById('task-list');
const emptyEl   = document.getElementById('empty-msg');
const nTotalEl  = document.getElementById('n-total');
const nActiveEl = document.getElementById('n-active');
const nDoneEl   = document.getElementById('n-done');


/* ===================================================================
   3. 事件綁定（已寫好，你不用改）
   =================================================================== */

// 送出表單 → 新增任務
formEl.addEventListener('submit', function (event) {
  event.preventDefault();          // 擋掉表單預設的重新整理
  addTask(inputEl.value);
});

// 使用者一開始打字就把錯誤提示收起來
inputEl.addEventListener('input', hideHint);

// 事件委派：任務是動態產生的，不能各別綁事件，所以綁在 ul 上
listEl.addEventListener('click', function (event) {
  const li = event.target.closest('.task-item');
  if (!li) return;
  const id = Number(li.dataset.id);

  if (event.target.classList.contains('btn-del')) {
    deleteTask(id);
  } else if (event.target.classList.contains('task-check')) {
    toggleTask(id);
  }
});

// 切換篩選
filterBar.addEventListener('click', function (event) {
  const btn = event.target.closest('.btn-filter');
  if (!btn) return;

  currentFilter = btn.dataset.filter;

  filterBar.querySelectorAll('.btn-filter').forEach(function (b) {
    b.classList.toggle('is-on', b === btn);
  });

  render();
});


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ①★  render() — 把 tasks 畫到畫面上
   -------------------------------------------------------------------
   ★ 第四階段會問「哪一段程式負責更新畫面？」→ 答案就是這個函式

   要做的事：
     1. 呼叫 getVisibleTasks() 拿到「目前篩選下該顯示的任務」
     2. 清空 listEl 的舊內容          提示：listEl.innerHTML 設成空字串
     3. 逐一把 visible 裡的任務轉成 <li> 塞進 listEl
        提示：visible.forEach(t => listEl.appendChild(createTaskElement(t)))
     4. 沒有任務時顯示空狀態          提示：emptyEl.hidden = visible.length > 0
     5. 最後呼叫 updateStats() 更新數字

   小技巧：先只寫 1～4 步讓畫面出得來，再回頭補第 5 步。
   ═══════════════════════════════════════════════════════════════════ */
function render() {
  // 1. 依目前篩選，取得該顯示的任務
  const visible = getVisibleTasks();

  // 2. 清空舊畫面
  listEl.innerHTML = '';

  // 3. 逐一產生 <li> 並掛上去
  visible.forEach(function (task) {
    listEl.appendChild(createTaskElement(task));
  });

  // 4. 沒有任務時顯示空狀態
  emptyEl.hidden = visible.length > 0;

  // 5. 同步更新統計數字
  updateStats();
}


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ②★  addTask(text) — 新增任務（CP3-1，8 分）
   -------------------------------------------------------------------
   要做的事：
     1. 把 text 前後空白去掉           提示：text.trim()
     2. 【必考】去空白後若是空字串 → 不新增，呼叫 showHint() 後 return
     3. 建立任務物件塞進 tasks 陣列
        提示：tasks.push({ id: Date.now(), text: 修剪後的文字, done: false })
     4. 清空輸入框                     提示：inputEl.value 設成空字串
     5. saveTasks() 然後 render()

   測試：輸入「完成期末專題」按新增 → 出現；不輸入直接按 → 不新增且跳提示
   ═══════════════════════════════════════════════════════════════════ */
function addTask(text) {
  // 1. 去掉前後空白
  const trimmed = text.trim();

  // 2. 空白輸入不新增，改顯示提示
  if (trimmed === '') {
    showHint();
    return;
  }

  // 3. 建立任務物件並存進 tasks
  tasks.push({ id: Date.now(), text: trimmed, done: false });

  // 4. 清空輸入框與提示
  inputEl.value = '';
  hideHint();

  // 5. 存檔並重畫
  saveTasks();
  render();
}


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ③★  toggleTask(id) — 完成／取消完成（CP3-2，7 分）
   -------------------------------------------------------------------
   要做的事：
     1. 在 tasks 裡找出 id 相符的那個任務
        提示：tasks.find(t => t.id === id)
     2. 找不到就 return（防呆）
     3. 把它的 done 反過來             提示：task.done = !task.done
     4. saveTasks() 然後 render()

   測試：點一下打勾並加刪除線，再點一下恢復未完成
   ═══════════════════════════════════════════════════════════════════ */
function toggleTask(id) {
  // 1. 找出這個任務
  const task = tasks.find(function (t) { return t.id === id; });

  // 2. 找不到就不動作（防呆）
  if (!task) return;

  // 3. 完成狀態反轉
  task.done = !task.done;

  // 4. 存檔並重畫
  saveTasks();
  render();
}


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ④★  deleteTask(id) — 刪除任務（CP3-3，5 分）
   -------------------------------------------------------------------
   要做的事：
     1. 讓 tasks 變成「不含這個 id」的新陣列
        提示：tasks = tasks.filter(t => t.id !== id)
     2. saveTasks() 然後 render()

   注意：這裡要用「tasks = ...」重新指派，不能只寫 tasks.filter(...) 一行，
         因為 filter 會回傳新陣列、不會改動原本的 tasks。這是最常見的錯誤。
   ═══════════════════════════════════════════════════════════════════ */
function deleteTask(id) {
  // 1. 重新指派成「不含這個 id」的新陣列
  tasks = tasks.filter(function (t) { return t.id !== id; });

  // 2. 存檔並重畫
  saveTasks();
  render();
}


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ⑤★  getVisibleTasks() — 任務篩選（CP3-4，8 分）
   -------------------------------------------------------------------
   依 currentFilter 回傳「該顯示的任務陣列」：
     'active' → 只回傳未完成的        提示：tasks.filter(t => !t.done)
     'done'   → 只回傳已完成的        提示：tasks.filter(t =>  t.done)
     'all'    → 全部回傳              提示：直接 return tasks

   注意：這裡只是「回傳要顯示的清單」，不可以真的把任務從 tasks 刪掉，
         否則切回「全部」時任務就不見了。
   ═══════════════════════════════════════════════════════════════════ */
function getVisibleTasks() {
  if (currentFilter === 'active') {
    return tasks.filter(function (t) { return !t.done; });
  }
  if (currentFilter === 'done') {
    return tasks.filter(function (t) { return t.done; });
  }
  return tasks;   // 'all'
}


/* ═══════════════════════════════════════════════════════════════════
   ★TODO ⑥★  updateStats() — 統計資訊（CP3-5，7 分）
   -------------------------------------------------------------------
   算出三個數字並寫進畫面：
     總數    tasks.length
     已完成  tasks.filter(t => t.done).length
     未完成  總數 減 已完成

     寫回畫面：nTotalEl.textContent / nActiveEl.textContent / nDoneEl.textContent

   注意：統計要算「全部任務」，不是只算目前篩選看得到的，
         否則切到「已完成」時未完成數會變成 0。
   ═══════════════════════════════════════════════════════════════════ */
function updateStats() {
  // 統計的是「全部任務」，不是目前篩選看得到的那些
  const total  = tasks.length;
  const done   = tasks.filter(function (t) { return t.done; }).length;
  const active = total - done;

  nTotalEl.textContent  = total;
  nActiveEl.textContent = active;
  nDoneEl.textContent   = done;
}


/* ===================================================================
   4. 以下都已寫好，你不用改
   =================================================================== */

/* 把一個任務物件變成一個 <li> 元素 */
function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = 'task-item' + (task.done ? ' is-done' : '');
  li.dataset.id = task.id;

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-check';
  checkbox.checked = task.done;
  checkbox.id = 'task-' + task.id;

  const label = document.createElement('label');
  label.className = 'task-text';
  label.htmlFor = checkbox.id;
  label.textContent = task.text;   // 用 textContent 而非 innerHTML，避免 XSS

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn btn-del';
  delBtn.textContent = '刪除';

  li.append(checkbox, label, delBtn);
  return li;
}

/* 錯誤提示的顯示與隱藏 */
function showHint() {
  hintEl.hidden = false;
  inputEl.classList.add('is-bad');
  inputEl.focus();
}
function hideHint() {
  hintEl.hidden = true;
  inputEl.classList.remove('is-bad');
}

/* localStorage：重新整理後任務還在 */
function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('無法儲存任務：', e);
  }
}
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('無法讀取任務：', e);
  }
  // 第一次開啟時的預設任務，方便你截圖
  return [
    { id: 1, text: '完成 Web App 實作',    done: false },
    { id: 2, text: '完成 JavaScript 練習', done: false },
    { id: 3, text: '完成課程作業',          done: true  }
  ];
}

/* 啟動 */
render();
