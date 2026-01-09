document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    applySavedBgColor();
    loadTodos();

    document.getElementById('todoInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') addList();
    });
});

// 1. 할 일 추가
function addList() {
    const input = document.getElementById('todoInput');
    if (!input.value.trim()) return;

    const todos = getTodos();
    todos.push({ text: input.value, checked: false });
    saveAndRefresh(todos);
    input.value = "";
}

// 2. 화면 그리기
function loadTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = "";
    getTodos().forEach((item, index) => {
        const li = document.createElement('li');
        const escapedText = item.text.replace(/'/g, "\\'");
        
        li.innerHTML = `
            <input type="checkbox" ${item.checked ? 'checked' : ''} onchange="toggleCheck(${index})">
            <span class="todo-text ${item.checked ? 'completed' : ''}">${item.text}</span>
            <button class="delete-btn" onclick="deleteTodo(${index})">삭제</button>
        `;
        list.appendChild(li);
    });
}

// 3. 체크 토글 (정렬 및 배경색 변경 포함)
function toggleCheck(id) { // 매개변수 이름을 id로 변경
    const todos = getTodos();
    
    // 배열에서 해당 id를 가진 항목을 찾습니다.
    const targetItem = todos.find(item => item.id === id);
    
    // 항목을 못 찾을 경우를 대비한 방어 코드
    if (!targetItem) {
        console.error("항목을 찾을 수 없습니다. ID:", id);
        return;
    }

    console.log('Target item found:', targetItem);
    
    // 찾은 항목의 체크 상태 반전
    targetItem.checked = !targetItem.checked;

    // 라이트모드에서 체크 시 배경색 변경 (기존 로직 유지)
    if (targetItem.checked && document.documentElement.getAttribute('data-theme') !== 'dark') {
        const r = Math.floor(Math.random() * 56) + 200;
        const g = Math.floor(Math.random() * 56) + 200;
        const b = Math.floor(Math.random() * 56) + 200;
        const newColor = `rgb(${r}, ${g}, ${b})`;
        document.body.style.backgroundColor = newColor;
        localStorage.setItem('bgColor', newColor);
    }
    
    saveAndRefresh(todos);
}

// 4. 삭제
function deleteTodo(index) {
    const todos = getTodos();
    todos.splice(index, 1);
    saveAndRefresh(todos);
}

// 5. 테마 전환 (이미지 변경 로직 포함)
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
        document.body.style.backgroundColor = ""; // 다크모드는 배경색 고정
    } else {
        applySavedBgColor();
    }
    updateThemeImg(newTheme);
}

// --- 유틸리티 함수 ---

function saveAndRefresh(todos) {
    // 체크된 항목을 아래로 정렬
    todos.sort((a, b) => a.checked - b.checked);
    localStorage.setItem('todos', JSON.stringify(todos));
    loadTodos();
}

function getTodos() {
    return JSON.parse(localStorage.getItem('todos')) || [];
}

function applySavedTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeImg(theme);
}

function applySavedBgColor() {
    const color = localStorage.getItem('bgColor');
    if (color && document.documentElement.getAttribute('data-theme') !== 'dark') {
        document.body.style.backgroundColor = color;
    }
}

function updateThemeImg(theme) {
    const img = document.getElementById('themeImg');
    // 달 아이콘과 해 아이콘으로 교체 (Icons8 무료 API 사용 예시)
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
