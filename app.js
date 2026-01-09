document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    applySavedBgColor();
    loadTodos();

    // Enter 키 대응
    document.getElementById('todoInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addList();
    });
});

function addList() {
    const input = document.getElementById('todoInput');
    if (!input.value.trim()) return;

    const todos = getTodos();
    // 생성 시간을 id로 사용하여 순서 유지
    todos.push({ 
        id: Date.now(), 
        text: input.value, 
        checked: false 
    });
    saveAndRefresh(todos);
    input.value = "";
}

function loadTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = "";
    getTodos().forEach((item) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleCheck(${item.id})">
            <span class="todo-text ${item.checked ? 'completed' : ''}">${item.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${item.id})">삭제</button>
        `;
        list.appendChild(li);
    });
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
    saveAndRefresh(todos);
}

function saveAndRefresh(todos) {
    // 1. 체크 안된 것 위, 체크된 것 아래 / 2. 그 안에서는 생성 순서대로
    todos.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked - b.checked;
        return a.id - b.id;
    });
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('todos')) || [];
}

// 테마 및 배경색 로직 (동일)
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
    img.src = theme === 'dark' 
        ? "https://img.icons8.com/ios-filled/50/000000/sun--v1.png" 
        : "https://img.icons8.com/ios-filled/50/000000/moon-symbol.png";
}
let currentPage = 1;
let itemsPerPage = 10; // 기본값

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    applySavedBgColor();
    // 저장된 '페이지당 항목 수' 불러오기
    itemsPerPage = parseInt(localStorage.getItem('itemsPerPage')) || 10;
    
    renderSettings(); // 설정창 자동 생성
    loadTodos();

    document.getElementById('todoInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addList();
    });
});

// [추가] HTML 수정 없이 설정창(5~500개 선택)을 동적으로 생성
function renderSettings() {
    let settingsDiv = document.querySelector('.settings-container');
    if (settingsDiv) settingsDiv.remove();

    settingsDiv = document.createElement('div');
    settingsDiv.className = 'settings-container';
    settingsDiv.innerHTML = `
        <span>페이지당 항목 수:</span>
        <select id="itemsPerPageSelect" onchange="changeItemsPerPage(this.value)">
            ${[5, 10, 20, 30, 50, 100, 500].map(num => 
                `<option value="${num}" ${num === itemsPerPage ? 'selected' : ''}>${num}개</option>`
            ).join('')}
        </select>
    `;

    // input-group 바로 위에 삽입
    const inputGroup = document.querySelector('.input-group');
    inputGroup.parentNode.insertBefore(settingsDiv, inputGroup);
}

// [추가] 사용자가 수치를 변경했을 때 실행
function changeItemsPerPage(value) {
    itemsPerPage = parseInt(value);
    localStorage.setItem('itemsPerPage', itemsPerPage); // 설정 저장
    currentPage = 1; // 1페이지로 리셋
    loadTodos();
}

function loadTodos() {
    const list = document.getElementById('todoList');
    const todos = getTodos();
    list.innerHTML = "";

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
        btn.onclick = () => {
            currentPage = i;
            loadTodos();
            window.scrollTo(0, 0);
        };
        paginationDiv.appendChild(btn);
    }

    const list = document.getElementById('todoList');
    list.parentNode.insertBefore(paginationDiv, list.nextSibling);
}

// 나머지 addList, deleteTodo, toggleCheck 등 기존 유틸리티 함수 유지
function saveAndRefresh(todos) {
    todos.sort((a, b) => {
        if (a.checked !== b.checked) return a.checked - b.checked;
        return a.id - b.id;
    });
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('todos')) || [];
}

// ... 테마 관련 함수(toggleTheme, applySavedTheme 등)는 이전과 동일

// 화면을 그릴 때마다 모든 완료 여부를 체크합니다.
function loadTodos() {
    const list = document.getElementById('todoList');
    const todos = getTodos();
    list.innerHTML = "";

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
    
    // ★ 추가: 모든 할 일이 완료되었는지 확인
    checkAllTasksDone(todos);
}

// 모든 할 일 완료 여부를 확인하고 메시지를 표시하는 함수
function checkAllTasksDone(todos) {
    // 기존에 떠 있는 메시지가 있다면 제거
    const existingMsg = document.querySelector('.all-done-message');
    if (existingMsg) existingMsg.remove();

    // 1. 할 일이 존재하고 2. 모든 할 일의 checked가 true인 경우
    const isAllDone = todos.length > 0 && todos.every(todo => todo.checked);

    if (isAllDone) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'all-done-message';
        msgDiv.innerHTML = "🎉 모든 할 일을 완료했습니다! 🎉";
        
        // 체크리스트 제목(h2) 바로 아래에 메시지 삽입
        const title = document.querySelector('.title');
        title.after(msgDiv);
    }
}