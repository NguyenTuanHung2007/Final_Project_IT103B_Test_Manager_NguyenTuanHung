// Quản lý danh sách bài test - Logic phân trang tương tự trang quản lý danh mục

// 1. Khai báo các phần tử DOM cần thiết
const tableBody = document.querySelector(".responsive-table tbody");
const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");
const paginationWrapper = document.querySelector(".pagination-wrapper");

// 2. Các biến phục vụ logic phân trang
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// 3. Khởi tạo dữ liệu
// Lấy danh sách bài test từ LocalStorage, nếu chưa có thì khởi tạo mảng trống
let tests = JSON.parse(localStorage.getItem("tests")) || [];

// Hàm đồng bộ dữ liệu mảng 'tests' vào LocalStorage
const syncStorage = () => localStorage.setItem("tests", JSON.stringify(tests));

// 4. Các hàm tiện ích
const toggleModal = (modalElement, show) => {
  if (modalElement) modalElement.style.display = show ? "flex" : "none";
};

// 5. Hàm vẽ thanh phân trang (Pagination)
const renderPagination = (filteredTests = tests) => {
  if (!paginationWrapper) return;

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);

  // Nếu không có trang nào hoặc chỉ có 1 trang thì ẩn thanh phân trang
  if (totalPages <= 1) {
    paginationWrapper.innerHTML = "";
    return;
  }

  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

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

  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled):not(.ellipsis)")
    .forEach((btn) => {
      btn.onclick = (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderTable(filteredTests);
      };
    });
};

// 6. Hàm hiển thị bảng bài test
const renderTable = (filteredTests = tests) => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredTests.slice(start, end);

  tableBody.innerHTML = "";

  if (filteredTests.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
          Không có dữ liệu bài test
        </td>
      </tr>
    `;
    if (paginationWrapper) paginationWrapper.innerHTML = "";
    return;
  }

  pageData.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="text-center" data-label="ID">${item.id}</td>
      <td data-label="Tên bài test">${item.name}</td>
      <td data-label="Danh mục">${item.category}</td>
      <td data-label="Số câu hỏi">${item.questions}</td>
      <td data-label="Thời gian">${item.time} phút</td>
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

// 7. Logic Xóa bài test
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);
  tests = tests.filter((t) => t.id !== idToDelete);

  // Đánh lại số ID từ 1
  tests.forEach((test, index) => (test.id = index + 1));

  syncStorage();

  // Kiểm tra nếu trang hiện tại không còn dữ liệu thì lùi về trang trước
  const totalPages = Math.ceil(tests.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  renderTable();
  toggleModal(deleteModal, false);
  if (typeof createToast === "function")
    createToast("success", "Xóa bài test thành công!");
};

// 8. Kiểm tra quyền đăng nhập
const checkLogin = () => {
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "../pages/login.html";
    return;
  }
  let currentUser = JSON.parse(currentUserStr);
  if (currentUser.role !== "admin") {
    window.location.href = "../pages/home.html";
  }
};

// 9. Logic Bộ lọc và Tìm kiếm
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

// 10. Khởi tạo
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  const hamburger = document.querySelector(".hamburger");
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (hamburger) {
    hamburger.onclick = () => {
      navbar.classList.toggle("nav-active");
      document.body.classList.toggle("menu-open");
    };
  }

  const sortSelect = document.querySelector(".filters select");
  const searchInput = document.querySelector(".filters input");

  if (sortSelect) sortSelect.onchange = applyFilters;
  if (searchInput) searchInput.oninput = applyFilters;

  const btnConfirmDelete = document.querySelector("#deleteModal .btn-danger");
  if (btnConfirmDelete) btnConfirmDelete.onclick = confirmDelete;

  document.querySelectorAll(".close-btn, .btn-secondary").forEach((btn) => {
    btn.onclick = () => toggleModal(deleteModal, false);
  });

  renderTable();
});
