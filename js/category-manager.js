// 1. KHAI BÁO CÁC PHẦN TỬ DOM
const tableBody = document.getElementById("categoryTableBody");
const modal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const inputName = document.getElementById("categoryName");
const inputEmoji = document.getElementById("categoryEmoji");
const inputId = document.getElementById("editCategoryId");
const errorMsg = document.getElementById("error-msg");

const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");
const btnAdd = document.querySelector(".btn-add");

// 2. QUẢN LÝ DỮ LIỆU
// Khởi tạo danh sách trống nếu không có dữ liệu trong LocalStorage
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// Cấu hình phân trang
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

const syncStorage = () => {
  localStorage.setItem("categories", JSON.stringify(categories));
};

// 3. CÁC HÀM TIỆN ÍCH
const toggleModal = (modalElement, show) => {
  modalElement.style.display = show ? "flex" : "none";
};

const resetError = () => {
  inputName.classList.remove("input-error");
  inputEmoji.classList.remove("input-error");
  errorMsg.textContent = "";
  errorMsg.style.display = "none";
};

// 4. LOGIC HIỂN THỊ
const renderPagination = () => {
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (!paginationWrapper || totalPages <= 1) {
    if (paginationWrapper) paginationWrapper.innerHTML = "";
    return;
  }

  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" 
              data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  if (startPage > 1) {
    html += '<button class="page-item" data-page="1">1</button>';
    if (startPage > 2) html += '<span class="page-item ellipsis">...</span>';
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" 
             data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      html += '<span class="page-item ellipsis">...</span>';
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" 
           data-page="${currentPage + 1}">></button>`;

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
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #6c757d;">Không có danh mục nào</td></tr>`;
    const paginationWrapper = document.querySelector(".pagination-wrapper");
    if (paginationWrapper) paginationWrapper.innerHTML = "";
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
            </td>`;
    tableBody.appendChild(tr);
  });
};

// 5. LOGIC THÊM VÀ SỬA (CRUD)
btnAdd.onclick = () => {
  modalTitle.innerText = "Thêm danh mục";
  inputId.value = "";
  inputName.value = "";
  inputEmoji.value = "";
  resetError();
  toggleModal(modal, true);
};

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

const saveData = () => {
  const nameVal = inputName.value.trim();
  const emojiVal = inputEmoji.value.trim();
  const currentId = inputId.value;

  let errors = [];
  if (!nameVal) {
    errors.push("Tên danh mục không được trống");
  } else if (nameVal.length < 3 || nameVal.length > 20) {
    errors.push("Tên danh mục phải từ 3 đến 20 ký tự");
  }

  if (!emojiVal) {
    errors.push("Emoji không được trống");
  }

  const isDuplicate = categories.some(
    (c) => c.name.toLowerCase() === nameVal.toLowerCase() && c.id != currentId,
  );

  if (isDuplicate) errors.push("Tên danh mục đã tồn tại");

  if (errors.length > 0) {
    errorMsg.textContent = errors.join(", ");
    errorMsg.style.display = "block";
    return;
  }

  resetError();

  if (currentId === "") {
    const newId =
      categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    categories.push({ id: newId, name: nameVal, emoji: emojiVal });
  } else {
    const index = categories.findIndex((c) => c.id == currentId);
    categories[index] = {
      ...categories[index],
      name: nameVal,
      emoji: emojiVal,
    };
  }

  syncStorage();
  renderTable();
  toggleModal(modal, false);
  if (typeof createToast === "function")
    createToast("success", "Thao tác thành công!");
};

// 6. LOGIC XOÁ
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);
  const deletedCategory = categories.find((c) => c.id === idToDelete);
  const deletedFullName = deletedCategory
    ? deletedCategory.emoji + " " + deletedCategory.name
    : "";

  categories = categories.filter((c) => c.id !== idToDelete);

  // Đánh lại số ID để danh sách gọn đẹp
  categories.forEach((cat, index) => {
    cat.id = index + 1;
  });

  syncStorage();

  // Cập nhật các bài test liên quan
  if (deletedFullName) {
    let allTests = JSON.parse(localStorage.getItem("tests")) || [];
    let hasChanges = false;
    allTests.forEach((test) => {
      if (test.category === deletedFullName) {
        test.category = "Chưa có danh mục";
        hasChanges = true;
      }
    });
    if (hasChanges) localStorage.setItem("tests", JSON.stringify(allTests));
  }

  // Nếu xoá hết phần tử ở trang hiện tại, lùi về trang trước
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  if (currentPage > totalPages && totalPages > 0) currentPage = totalPages;

  renderTable();
  toggleModal(deleteModal, false);
  if (typeof createToast === "function")
    createToast("success", "Xóa thành công!");
};

// 7. KHỞI TẠO
const checkLogin = () => {
  let currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "../pages/login.html";
    return;
  }
  let currentUser = JSON.parse(currentUserStr);
  if (currentUser.role !== "admin") window.location.href = "../pages/home.html";
};

window.onload = function () {
  checkLogin();

  document.getElementById("btnSave").onclick = saveData;
  let btnDel = document.querySelector("#deleteModal .btn-danger");
  if (btnDel) btnDel.onclick = confirmDelete;

  document.querySelectorAll(".close-btn, .btn-secondary").forEach((btn) => {
    btn.onclick = () => {
      toggleModal(modal, false);
      toggleModal(deleteModal, false);
    };
  });

  inputName.oninput = resetError;
  inputEmoji.oninput = resetError;

  renderTable();
};
