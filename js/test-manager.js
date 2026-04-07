// Quản lý danh sách bài test - Logic phân trang tương tự trang quản lý danh mục

// 1. Khai báo các phần tử DOM cần thiết
const tableBody = document.querySelector(".responsive-table tbody");
const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");
const paginationWrapper = document.querySelector(".pagination-wrapper");

// 2. Các biến phục vụ logic phân trang
let currentPage = 1; // Trang hiện tại
const ITEMS_PER_PAGE = 5; // Số lượng bài test hiển thị trên mỗi trang

// 3. Khởi tạo dữ liệu
// Lấy danh sách bài test từ LocalStorage, nếu chưa có thì khởi tạo mảng mẫu
let tests = JSON.parse(localStorage.getItem("tests")) || [
  // Fix cứng dữ liệu, nếu thầy muốn chuẩn hơn thì xóa dữ liệu mẫu đi và làm bằng tay ạ
  {
    id: 1,
    name: "History Quiz",
    category: "📚 Lịch sử",
    questions: 15,
    time: "10",
  },
  {
    id: 2,
    name: "Science Challenge",
    category: "🧠 Khoa học",
    questions: 20,
    time: "15",
  },
  {
    id: 3,
    name: "Entertainment Trivia",
    category: "🎤 Đời sống",
    questions: 10,
    time: "5",
  },
];

// Hàm đồng bộ dữ liệu mảng 'tests' vào LocalStorage
const syncStorage = () => localStorage.setItem("tests", JSON.stringify(tests));

// 4. Các hàm tiện ích
// Hàm ẩn/hiện Modal
const toggleModal = (modalElement, show) => {
  if (modalElement) modalElement.style.display = show ? "flex" : "none";
};

// 5. Hàm vẽ thanh phân trang (Pagination)
// Tính toán số trang, hiển thị các nút số, dấu '...' và xử lý sự kiện chuyển trang
const renderPagination = () => {
  if (!paginationWrapper || !tests.length) return;

  const totalPages = Math.ceil(tests.length / ITEMS_PER_PAGE);

  // Tạo nút mũi tên quay lại
  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5; // Số lượng nút trang tối đa hiển thị cùng lúc
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Điều chỉnh startPage nếu endPage chạm giới hạn cuối
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // Hiển thị trang đầu và dấu '...' nếu cần thiết
  if (startPage > 1) {
    html += `<button class="page-item" data-page="1">1</button>`;
    if (startPage > 2) html += '<span class="page-item ellipsis">...</span>';
  }

  // Hiển thị các nút số trang
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  // Hiển thị trang cuối và dấu '...' nếu cần thiết
  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      html += '<span class="page-item ellipsis">...</span>';
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Nút mũi tên đi tiếp
  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" data-page="${currentPage + 1}">></button>`;

  paginationWrapper.innerHTML = html;

  // Gán sự kiện click cho các nút phân trang
  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled):not(.ellipsis)")
    .forEach((btn) => {
      btn.onclick = (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderTable();
      };
    });
};

// 6. Hàm hiển thị bảng bài test
// Logic: Cắt mảng dữ liệu gốc theo trang hiện tại (slice) để hiển thị đúng dữ liệu
const renderTable = (filteredTests = tests) => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageData = filteredTests.slice(start, end); // Lấy 5 phần tử cho trang hiện tại

  tableBody.innerHTML = "";

  // Xử lý trường hợp không có dữ liệu (khi tìm kiếm không thấy bài nào)
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

  // Duyệt dữ liệu trang hiện tại và tạo các dòng HTML
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

// 7. Logic Xóa bài test
// Chuẩn bị ID cần xóa và hiện modal xác nhận
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

// Thực hiện xóa sau khi người dùng xác nhận
const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);
  // Loại bỏ bài test khỏi mảng
  tests = tests.filter((t) => t.id !== idToDelete);

  // Đánh lại số ID từ 1 để dữ liệu trông gọn gàng hơn
  tests.forEach((test, index) => (test.id = index + 1));

  syncStorage(); // Cập nhật LocalStorage
  currentPage = 1; // Reset về trang 1
  renderTable();
  toggleModal(deleteModal, false);
  createToast("success", "Xóa bài test thành công!");
};

// 8. Kiểm tra quyền đăng nhập (Admin mới được vào)
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

// 9. Logic Bộ lọc và Tìm kiếm
// Xử lý tìm kiếm theo tên và sắp xếp theo nhiều tiêu chí (Mới nhất, A-Z, Số câu hỏi, Thời gian)
const applyFilters = () => {
  let filteredTests = [...tests];
  const searchInput = document.querySelector(".filters input");
  const sortSelect = document.querySelector(".filters select");

  // Lọc theo từ khóa tìm kiếm
  if (searchInput?.value.trim()) {
    filteredTests = filteredTests.filter((test) =>
      test.name.toLowerCase().includes(searchInput.value.trim().toLowerCase()),
    );
  }

  // Sắp xếp dữ liệu
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

  currentPage = 1; // Quay về trang 1 khi có bộ lọc mới
  renderTable(filteredTests);
};

// 10. Khởi tạo khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  // --- Xử lý Menu di động (Hamburger) ---
  const hamburger = document.querySelector(".hamburger");
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  const toggleMenu = () => {
    navbar.classList.toggle("nav-active");
    document.body.classList.toggle("menu-open");
    hamburger.setAttribute(
      "aria-expanded",
      navbar.classList.contains("nav-active"),
    );
  };

  const closeMenu = () => {
    navbar.classList.remove("nav-active");
    document.body.classList.remove("menu-open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  if (hamburger) hamburger.addEventListener("click", toggleMenu);
  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  // Đóng menu khi nhấn phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navbar.classList.contains("nav-active"))
      closeMenu();
  });

  // --- Gán sự kiện cho bộ lọc ---
  const sortSelect = document.querySelector(".filters select");
  const searchInput = document.querySelector(".filters input");

  if (sortSelect) sortSelect.onchange = applyFilters;
  if (searchInput) searchInput.oninput = applyFilters;

  // --- Gán sự kiện cho Modal xóa ---
  const btnConfirmDelete = document.querySelector("#deleteModal .btn-danger");
  if (btnConfirmDelete) btnConfirmDelete.onclick = confirmDelete;

  document.querySelectorAll(".close-btn, .btn-secondary").forEach((btn) => {
    btn.onclick = () => toggleModal(deleteModal, false);
  });

  renderTable(); // Hiển thị dữ liệu lần đầu
});
