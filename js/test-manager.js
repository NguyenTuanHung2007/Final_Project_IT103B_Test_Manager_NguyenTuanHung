// Test Manager - Pagination like category-manager

// 1. DOM elements
const tableBody = document.querySelector(".responsive-table tbody");
const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");
const paginationWrapper = document.querySelector(".pagination-wrapper");

// 2. Pagination
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// 3. Data
let tests = JSON.parse(localStorage.getItem("tests")) || [
  {
    id: 1,
    name: "History Quiz",
    category: "📚 Lịch sử",
    questions: 15,
    time: "10 min",
  },
  {
    id: 2,
    name: "Science Challenge",
    category: "🧠 Khoa học",
    questions: 20,
    time: "15 min",
  },
  {
    id: 3,
    name: "Entertainment Trivia",
    category: "🎤 Đời sống",
    questions: 10,
    time: "5 min",
  },
];

const syncStorage = () => localStorage.setItem("tests", JSON.stringify(tests));

// 4. Utils
const toggleModal = (modalElement, show) => {
  if (modalElement) modalElement.style.display = show ? "flex" : "none";
};

// 5. Render Pagination (copied from category-manager)
const renderPagination = () => {
  if (!paginationWrapper || !tests.length) return;

  const totalPages = Math.ceil(tests.length / ITEMS_PER_PAGE);

  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (startPage > 1) {
    html += `<button class="page-item" data-page="1">1</button>`;
    if (startPage > 2) html += '<span class="page-item ellipsis">...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      html += '<span class="page-item ellipsis">...</span>';
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" data-page="${currentPage + 1}">></button>`;

  paginationWrapper.innerHTML = html;

  // Events
  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled):not(.ellipsis)")
    .forEach((btn) => {
      btn.onclick = (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderTable();
      };
    });
};

// 6. Render Table with Pagination
const renderTable = (filteredTests = tests) => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredTests.slice(start, end);

  tableBody.innerHTML = "";

  if (pageData.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
          Không tìm thấy bài test
        </td>
      </tr>
    `;
    renderPagination(filteredTests);
    return;
  }

  pageData.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center" data-label="ID">${item.id}</td>
      <td data-label="Tên bài test">${item.name}</td>
      <td data-label="Danh mục">${item.category}</td>
      <td data-label="Số câu hỏi">${item.questions}</td>
      <td data-label="Thời gian">${item.time}</td>
      <td class="text-center" data-label="Hành động">
        <div class="action-group">
          <a href="./edit-test.html?id=${item.id}" class="btn btn-edit" style="text-decoration: none;">Sửa</a>
          <button class="btn btn-delete" onclick="prepareDelete(${item.id})">Xoá</button>
        </div>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  renderPagination(filteredTests);
};

// 7. Delete logic
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);
  tests = tests.filter((t) => t.id !== idToDelete);

  tests.forEach((test, index) => (test.id = index + 1));
  syncStorage();
  currentPage = 1;
  renderTable();
  toggleModal(deleteModal, false);
  createToast("success", "Xóa bài test thành công!");
};

// 8. Login check
const checkLogin = () => {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "../pages/login.html";
    return;
  }
  let currentUser;
  try {
    currentUser = JSON.parse(currentUserStr);
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "../pages/login.html";
    return;
  }
  if (currentUser.role !== "admin") {
    window.location.href = "../pages/home.html";
  }
};

// 9. Filters
const applyFilters = () => {
  let filteredTests = [...tests];
  const searchInput = document.querySelector(".filters input");
  const sortSelect = document.querySelector(".filters select");

  if (searchInput?.value.trim()) {
    filteredTests = filteredTests.filter((test) =>
      test.name.toLowerCase().includes(searchInput.value.trim().toLowerCase()),
    );
  }

  const sortValue = sortSelect?.value;
  if (sortValue === "newest") {
    filteredTests.sort((a, b) => b.id - a.id);
  } else if (sortValue === "az") {
    filteredTests.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortValue === "questions") {
    filteredTests.sort((a, b) => b.questions - a.questions);
  } else if (sortValue === "time") {
    filteredTests.sort((a, b) => parseInt(b.time) - parseInt(a.time));
  }

  currentPage = 1;
  renderTable(filteredTests);
};

// 10. Init
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  const toggleMenu = () => {
    navbar.classList.toggle('nav-active');
    document.body.classList.toggle('menu-open');
    hamburger.setAttribute('aria-expanded', navbar.classList.contains('nav-active'));
  };

  const closeMenu = () => {
    navbar.classList.remove('nav-active');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav-links');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar.classList.contains('nav-active')) {
      closeMenu();
    }
  });

  const sortSelect = document.querySelector(".filters select");
  const searchInput = document.querySelector(".filters input");

  if (sortSelect) {
    sortSelect.onchange = applyFilters;
  }
  if (searchInput) {
    searchInput.oninput = applyFilters;
  }

  const btnConfirmDelete = document.querySelector("#deleteModal .btn-danger");
  if (btnConfirmDelete) {
    btnConfirmDelete.onclick = confirmDelete;
  }

  document.querySelectorAll(".close-btn, .btn-secondary").forEach((btn) => {
    btn.onclick = () => toggleModal(deleteModal, false);
  });

  renderTable();
});
