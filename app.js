let currentPage = 1;
let itemsPerPage = 10;
let currentSort = 'time';

document.addEventListener('DOMContentLoaded', () => {
    // 1. 초기 설정값 불러오기
    itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10;
    currentSort = localStorage.getItem('currentSort') || 'time';
    
    // 2. 초기 화면 렌더링
    applySavedTheme();
    applySavedBgColor();
    renderSettings(); // 설정창 생성
    loadTodos();

    // 3. Enter 키 대응
    document.getElementById('todoInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addList();
    });
});

// --- 핵심 로직 (추가, 로드, 토글, 삭제) ---

function addList() {
    const input = document.getElementById('todoInput');
    if (!input.value.trim()) return;

    const todos = getTodos();
    todos.push({ 
        id: Date.now(), 
        text: input.value, 
        checked: false 
    });
    
    currentPage = 1; // 추가 시 1페이지로 이동
    saveAndRefresh(todos);
    input.value = "";
}

function loadTodos() {
    const list = document.getElementById('todoList');
    if (!list) return;

    const todos = getTodos();
    list.innerHTML = "";

    // 페이지네이션 범위 계산
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = todos.slice(startIndex, endIndex);

    paginatedItems.forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleCheck(${item.id})">
            <span class="todo-text ${item.checked ? 'completed' : ''}">${item.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${item.id})">삭제</button>
        `;
        list.appendChild(li);
    });

    renderPaginationDynamic(todos.length);
    showCompleteMessage(todos);
}

function toggleCheck(id) {
    const todos = getTodos();
    const target = todos.find(t => t.id === id);
    if (target) {
        target.checked = !target.checked;
        if (target.checked && document.documentElement.getAttribute('data-theme') !== 'dark') {
            changeBackgroundColor();
        }
        saveAndRefresh(todos);
    }
}

function deleteTodo(id) {
    const todos = getTodos().filter(t => t.id !== id);
    // 현재 페이지에 항목이 없어지면 이전 페이지로 이동
    const totalPages = Math.ceil(todos.length / itemsPerPage);
    if (currentPage > totalPages && currentPage > 1) currentPage = totalPages;
    saveAndRefresh(todos);
}

// --- 유틸리티 및 설정 ---

function saveAndRefresh(todos) {
    // 1. 체크 여부 우선 정렬(미완료 위) 2. 사용자 설정 정렬 적용
    todos.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked - b.checked;
        if (currentSort === 'timeDesc') return b.id - a.id;
        if (currentSort === 'abc') return a.text.localeCompare(b.text);
        return a.id - b.id; // 기본 시간순
    });
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('todos')) || [];
}

// --- 동적 UI 생성 (설정창, 페이지네이션, 메시지) ---

function renderSettings() {
    const inputGroup = document.querySelector('.input-group');
    let settingsDiv = document.querySelector('.settings-container');
    if (settingsDiv) settingsDiv.remove();

    settingsDiv = document.createElement('div');
    settingsDiv.className = 'settings-container';
    settingsDiv.innerHTML = `
        <div class="settings-group">
            <span>정렬:</span>
            <select onchange="changeSort(this.value)">
                <option value="time" ${currentSort === 'time' ? 'selected' : ''}>시간순</option>
                <option value="timeDesc" ${currentSort === 'timeDesc' ? 'selected' : ''}>최신순</option>
                <option value="abc" ${currentSort === 'abc' ? 'selected' : ''}>ㄱㄴㄷ순</option>
            </select>
        </div>
        <div class="settings-group">
            <span>보기:</span>
            <select onchange="changeItemsPerPage(this.value)">
                ${[5, 10, 20, 50, 100].map(num => 
                    `<option value="${num}" ${num === itemsPerPage ? 'selected' : ''}>${num}개</option>`
                ).join('')}
            </select>
        </div>
    `;
    inputGroup.parentNode.insertBefore(settingsDiv, inputGroup);
}

function changeSort(value) {
    currentSort = value;
    localStorage.setItem('currentSort', value);
    saveAndRefresh(getTodos());
}

function changeItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    localStorage.setItem('itemsPerPage', itemsPerPage);
    currentPage = 1;
    loadTodos();
}

function renderPaginationDynamic(totalItems) {
    let paginationDiv = document.querySelector('.pagination-container');
    if (paginationDiv) paginationDiv.remove();

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return;

    paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination-container';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.innerText = i;
        if (i === currentPage) btn.classList.add('active');
        btn.onclick = () => { currentPage = i; loadTodos(); window.scrollTo(0, 0); };
        paginationDiv.appendChild(btn);
    }
    document.getElementById('todoList').after(paginationDiv);
}

function showCompleteMessage(todos) {
    const oldMsg = document.querySelector('.all-done-msg');
    if (oldMsg) oldMsg.remove();

    if (todos.length > 0 && todos.every(t => t.checked)) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'all-done-msg';
        msgDiv.innerHTML = "🎉 모든 할 일을 완료했습니다! 🎉";
        const title = document.querySelector('.title');
        if (title) title.after(msgDiv);
    }
}

// --- 테마 및 배경색 관련 ---

function toggleTheme() {
    const html = document.documentElement;
    const newTheme = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') document.body.style.backgroundColor = "";
    else applySavedBgColor();
    updateThemeImg(newTheme);
}

function applySavedTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeImg(theme);
}

function changeBackgroundColor() {
    const color = `rgb(${Math.floor(Math.random()*56)+200}, ${Math.floor(Math.random()*56)+200}, ${Math.floor(Math.random()*56)+200})`;
    document.body.style.backgroundColor = color;
    localStorage.setItem('bgColor', color);
}

function applySavedBgColor() {
    const color = localStorage.getItem('bgColor');
    if (color && document.documentElement.getAttribute('data-theme') !== 'dark') {
        document.body.style.backgroundColor = color;
    }
}

function updateThemeImg(theme) {
    const img = document.getElementById('themeImg');
    if (!img) return;
    img.src = theme === 'dark' 
        ? "https://img.icons8.com/ios-filled/50/000000/sun--v1.png" 
        : "https://img.icons8.com/ios-filled/50/000000/moon-symbol.png";
}