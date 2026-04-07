//1. Khai báo các phần tử DOM
const tableBody = document.getElementById("categoryTableBody");
// Các phần tử của Modal Thêm/Sửa
const modal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const inputName = document.getElementById("categoryName");
const inputEmoji = document.getElementById("categoryEmoji");
const inputId = document.getElementById("editCategoryId");
const errorMsg = document.getElementById("error-msg");

// Các phần tử của Modal Xoá
const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");

// Nút bấm chính
const btnAdd = document.querySelector(".btn-add");

//2. Quản lý localStorage
// Lấy dữ liệu từ máy người dùng, nếu chưa có thì tạo mảng mặc định
let categories = JSON.parse(localStorage.getItem("categories")) || [
  { id: 1, name: "Lịch sử", emoji: "📚" },
  { id: 2, name: "Khoa học", emoji: "🧠" },
  { id: 3, name: "Giải trí", emoji: "🎤" },
  { id: 4, name: "Đời sống", emoji: "🏠" },
];

let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Hàm lưu dữ liệu vào Local Storage
const syncStorage = () => {
  localStorage.setItem("categories", JSON.stringify(categories));
};

//3. Các hàm tiện ích
// Hàm ẩn/hiện Modal bất kỳ
const toggleModal = (modalElement, show) => {
  modalElement.style.display = show ? "flex" : "none";
};

// Hàm xoá báo lỗi đỏ trên input
const resetError = () => {
  inputName.classList.remove("input-error");
  inputEmoji.classList.remove("input-error");
  errorMsg.textContent = "";
  errorMsg.style.display = "none";
};

//4. Render bảng + Pagination
const renderPagination = () => {
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (!paginationWrapper) {
    return;
  }

  let html =
    '<button class="page-item arrow ' +
    (currentPage === 1 ? "disabled" : "") +
    '" data-page="' +
    (currentPage - 1) +
    '"><</button>';

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += '<button class="page-item" data-page="1">1</button>';
    if (startPage > 2) {
      html += '<span class="page-item ellipsis">...</span>';
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html +=
      '<button class="page-item ' +
      (i === currentPage ? "active" : "") +
      '" data-page="' +
      i +
      '">' +
      i +
      "</button>";
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += '<span class="page-item ellipsis">...</span>';
    }
    html +=
      '<button class="page-item" data-page="' +
      totalPages +
      '">' +
      totalPages +
      "</button>";
  }

  html +=
    '<button class="page-item arrow ' +
    (currentPage === totalPages ? "disabled" : "") +
    '" data-page="' +
    (currentPage + 1) +
    '">></button>';

  paginationWrapper.innerHTML = html;

  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled):not(.ellipsis)")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderTable();
      });
    });
};

const renderTable = (page = currentPage) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageCategories = categories.slice(start, end);

  tableBody.innerHTML = "";

  if (categories.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align: center; padding: 40px; color: #6c757d;">
          Không có danh mục nào
        </td>
      </tr>
    `;
    renderPagination();
    return;
  }

  renderPagination();

  pageCategories.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td class="text-center">${item.id}</td>
            <td>${item.emoji} ${item.name}</td>
            <td>
                <div class="action-group">
                    <button class="btn btn-edit" onclick="prepareEdit(${item.id})">Sửa</button>
                    <button class="btn btn-delete" onclick="prepareDelete(${item.id})">Xoá</button>
                </div>
            </td>
        `;
    tableBody.appendChild(tr);
  });
};

//5. Logic thêm và sửa

// Mở modal để THÊM MỚI
btnAdd.onclick = () => {
  modalTitle.innerText = "Thêm danh mục";
  inputId.value = ""; // ID rỗng để đánh dấu là thêm mới
  inputName.value = "";
  inputEmoji.value = "";
  resetError();
  toggleModal(modal, true);
};

// Mở modal để sửa
window.prepareEdit = (id) => {
  const item = categories.find((c) => c.id === id);
  if (item) {
    modalTitle.innerText = "Sửa danh mục";
    inputId.value = item.id;
    inputName.value = item.name;
    inputEmoji.value = item.emoji;
    resetError();
    toggleModal(modal, true);
  }
};

// Hàm xử lý khi nhấn nút lưu trên popup
const saveData = () => {
  const nameVal = inputName.value.trim();
  const emojiVal = inputEmoji.value.trim();
  const currentId = inputId.value;

  let errors = [];
  if (!nameVal) {
    errors.push(
      "Tên danh mục không được trống, chỉ chứa khoảng trắng hoặc có dấu cách đầu/cuối",
    );
  } else if (nameVal.length < 3 || nameVal.length > 20) {
    errors.push("Tên danh mục phải từ 3 đến 20 ký tự");
  }

  if (!emojiVal) {
    errors.push("Emoji không được trống");
  } else if (emojiVal.length < 1 || emojiVal.length > 3) {
    errors.push("Emoji phải từ 1 đến 3 ký tự");
  }

  // Validate: Kiểm tra trùng tên (Bỏ qua chính nó nếu đang sửa)
  const isDuplicate = categories.some(
    (c) => c.name.toLowerCase() === nameVal.toLowerCase() && c.id != currentId,
  );

  if (isDuplicate) {
    errors.push("Tên danh mục đã tồn tại");
  }

  if (errors.length > 0) {
    const errorText = errors.join(", ");
    errorMsg.textContent = errorText;
    errorMsg.style.display = "block";
    inputName.classList.add("input-error");
    inputEmoji.classList.add("input-error");
    return;
  }

  // Clear lỗi trước khi lưu
  resetError();

  if (currentId === "") {
    // Logic thêm: Tạo ID mới tự động tăng
    const newId =
      categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    categories.push({ id: newId, name: nameVal, emoji: emojiVal });
  } else {
    // Logic sửa: Tìm và cập nhật mục cũ
    const index = categories.findIndex((c) => c.id == currentId);
    categories[index] = {
      ...categories[index],
      name: nameVal,
      emoji: emojiVal,
    };
  }

  syncStorage(); // Lưu lại
  currentPage = 1;
  renderTable(); // Vẽ lại bảng
  renderPagination();

  toggleModal(modal, false); // Đóng popup
  createToast("success", "Thao tác danh mục thành công!");
};

//6. Logic xoá

// Mở modal xác nhận xoá
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

// Thực hiện xoá khi nhấn nút Xoá trên popup đỏ
const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);
  
  // Lấy thông tin category bị xóa trước khi xóa (để cập nhật tests)
  const deletedCategory = categories.find((c) => c.id === idToDelete);
  const deletedName = deletedCategory ? deletedCategory.emoji + " " + deletedCategory.name : "";

  // Lọc bỏ phần tử bị xoá
  categories = categories.filter((c) => c.id !== idToDelete);

  // Renumber IDs from 1
  categories.forEach((cat, index) => {
    cat.id = index + 1;
  });

  syncStorage();

  // Cập nhật tests: nếu test.category chứa deletedName → đổi thành "Chưa có danh mục"
  if (deletedName) {
    let allTests = JSON.parse(localStorage.getItem("tests")) || [];
    let hasChanges = false;
    allTests.forEach((test) => {
      if (test.category === deletedName) {
        test.category = "Chưa có danh mục";
        hasChanges = true;
      }
    });
    if (hasChanges) {
      localStorage.setItem("tests", JSON.stringify(allTests));
    }
  }

  renderTable();
  toggleModal(deleteModal, false);
  createToast("success", "Xóa danh mục thành công!");
};

// Kiểm tra đăng nhập admin
const checkLogin = () => {
  let currentUserStr = localStorage.getItem("currentUser");
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
    return;
  }
};

// Chạy khi trang load
window.onload = function () {
  checkLogin();

  // Mobile menu toggle - MATCH test-manager.js
  const hamburger = document.querySelector('.hamburger');
  const navbar = document.querySelector('.navbar');
  const navLinks = document.querySelectorAll('.nav-links a');

  const toggleMenu = () => {
    navbar.classList.toggle('nav-active');
    document.body.classList.toggle('menu-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', navbar.classList.contains('nav-active'));
  };

  const closeMenu = () => {
    navbar.classList.remove('nav-active');
    document.body.classList.remove('menu-open');
    if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
  };

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav-links');
  }

  // Attach close to all nav links
  if (navLinks) {
    navLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navbar && navbar.classList.contains('nav-active')) {
      closeMenu();
    }
  });

  // Gán sự kiện nút lưu
  document.getElementById("btnSave").onclick = function () {
    saveData();
  };

  // Nút xác nhận xóa
  let btnDel = document.querySelector("#deleteModal .btn-danger");
  if (btnDel) {
    btnDel.onclick = function () {
      confirmDelete();
    };
  }

  // Nút đóng modal
  let closeBtns = document.querySelectorAll(".close-btn, .btn-secondary");
  for (let i = 0; i < closeBtns.length; i++) {
    closeBtns[i].onclick = function () {
      toggleModal(modal, false);
      toggleModal(deleteModal, false);
    };
  }

  // Xóa lỗi khi nhập
  inputName.oninput = function () {
    resetError();
  };

  inputEmoji.oninput = function () {
    resetError();
  };

  renderTable();
};
