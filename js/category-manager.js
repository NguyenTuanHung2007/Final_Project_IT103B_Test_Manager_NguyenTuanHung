// 1. KHAI BÁO CÁC PHẦN TỬ DOM
const tableBody = document.getElementById("categoryTableBody");
// Modal Thêm/Sửa: Dùng chung một form, thay đổi tiêu đề dựa trên tác vụ
const modal = document.getElementById("categoryModal");
const modalTitle = document.getElementById("modalTitle");
const inputName = document.getElementById("categoryName");
const inputEmoji = document.getElementById("categoryEmoji");
const inputId = document.getElementById("editCategoryId"); // Input hidden để phân biệt Thêm/Sửa
const errorMsg = document.getElementById("error-msg");

// Modal Xoá: Dùng để xác nhận trước khi thực hiện hành động nguy hiểm
const deleteModal = document.getElementById("deleteModal");
const deleteIdInput = document.getElementById("deleteId");

const btnAdd = document.querySelector(".btn-add");

// 2. QUẢN LÝ DỮ LIỆU
// Khởi tạo danh sách: Ưu tiên lấy từ máy người dùng, nếu mới tinh thì dùng dữ liệu mẫu
let categories = JSON.parse(localStorage.getItem("categories")) || [];

// Cấu hình phân trang
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

// Hàm đồng bộ dữ liệu: Gọi mỗi khi mảng 'categories' thay đổi (Thêm/Sửa/Xoá)
const syncStorage = () => {
  localStorage.setItem("categories", JSON.stringify(categories));
};

// 3. CÁC HÀM TIỆN ÍCH (UTILITIES)
const toggleModal = (modalElement, show) => {
  modalElement.style.display = show ? "flex" : "none";
};

const resetError = () => {
  inputName.classList.remove("input-error");
  inputEmoji.classList.remove("input-error");
  errorMsg.textContent = "";
  errorMsg.style.display = "none";
};

// 4. LOGIC HIỂN THỊ (RENDER TABLE & PAGINATION)
/**
 * Hàm vẽ thanh phân trang (Pagination)
 * Logic: Tính toán số trang, tạo các nút số, xử lý dấu '...' khi có quá nhiều trang
 */
const renderPagination = () => {
  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE);
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (!paginationWrapper) {
    return;
  }

  // Nút mũi tên quay lại
  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" 
              data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5; // Số lượng nút trang tối đa hiển thị cùng lúc
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Điều chỉnh lại startPage nếu endPage chạm giới hạn cuối
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  // Hiển thị trang đầu và dấu '...' nếu cần
  if (startPage > 1) {
    html += '<button class="page-item" data-page="1">1</button>';
    if (startPage > 2) html += '<span class="page-item ellipsis">...</span>';
  }

  // Hiển thị các số trang ở giữa
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" 
             data-page="${i}">${i}</button>`;
  }

  // Hiển thị trang cuối và dấu '...' nếu cần
  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      html += '<span class="page-item ellipsis">...</span>';
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Nút mũi tên tiếp theo
  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" 
           data-page="${currentPage + 1}">></button>`;

  paginationWrapper.innerHTML = html;

  // Gán sự kiện click cho từng nút phân trang
  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled):not(.ellipsis)")
    .forEach((btn) => {
      btn.addEventListener("click", (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderTable();
      });
    });
};

/**
 * Hàm vẽ bảng dữ liệu dựa trên trang hiện tại
 */
const renderTable = (page = currentPage) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageCategories = categories.slice(start, end); // Cắt mảng để lấy đúng 5 mục mỗi trang

  tableBody.innerHTML = "";

  if (categories.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #6c757d;">Không có danh mục nào</td></tr>`;
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
            </td>`;
    tableBody.appendChild(tr);
  });
};

// 5. LOGIC THÊM VÀ SỬA (CRUD)
btnAdd.onclick = () => {
  modalTitle.innerText = "Thêm danh mục";
  inputId.value = ""; // ID trống báo hiệu đây là hành động tạo mới
  inputName.value = "";
  inputEmoji.value = "";
  resetError();
  toggleModal(modal, true);
};

window.prepareEdit = (id) => {
  const item = categories.find((c) => c.id === id);
  if (item) {
    modalTitle.innerText = "Sửa danh mục";
    inputId.value = item.id; // Điền ID hiện tại để báo hiệu đây là hành động cập nhật
    inputName.value = item.name;
    inputEmoji.value = item.emoji;
    resetError();
    toggleModal(modal, true);
  }
};

/**
 * Hàm lưu dữ liệu: Xử lý cả Thêm và Sửa
 */
const saveData = () => {
  const nameVal = inputName.value.trim();
  const emojiVal = inputEmoji.value.trim();
  const currentId = inputId.value;

  //Validate Dữ liệu
  let errors = [];
  if (!nameVal) {
    errors.push("Tên danh mục không được trống");
  } else if (nameVal.length < 3 || nameVal.length > 20) {
    errors.push("Tên danh mục phải từ 3 đến 20 ký tự");
  }

  if (!emojiVal) {
    errors.push("Emoji không được trống");
  } else if (emojiVal.length < 1 || emojiVal.length > 3) {
    errors.push("Emoji phải từ 1 đến 3 ký tự");
  }

  // Kiểm tra trùng tên (Nếu đang sửa thì không so sánh với chính mình)
  const isDuplicate = categories.some(
    (c) => c.name.toLowerCase() === nameVal.toLowerCase() && c.id != currentId,
  );

  if (isDuplicate) errors.push("Tên danh mục đã tồn tại");

  if (errors.length > 0) {
    errorMsg.textContent = errors.join(", ");
    errorMsg.style.display = "block";
    inputName.classList.add("input-error");
    inputEmoji.classList.add("input-error");
    return;
  }

  resetError();

  if (currentId === "") {
    // Logic: Tìm ID lớn nhất rồi +1 để tránh trùng ID
    const newId =
      categories.length > 0 ? Math.max(...categories.map((c) => c.id)) + 1 : 1;
    categories.push({ id: newId, name: nameVal, emoji: emojiVal });
  } else {
    // Logic: Tìm vị trí phần tử cũ và cập nhật thông tin mới
    const index = categories.findIndex((c) => c.id == currentId);
    categories[index] = {
      ...categories[index],
      name: nameVal,
      emoji: emojiVal,
    };
  }

  syncStorage();
  currentPage = 1; // Quay về trang 1 để người dùng thấy thay đổi
  renderTable();
  toggleModal(modal, false);
  createToast("success", "Thao tác danh mục thành công!");
};

// 6. LOGIC XOÁ & RÀNG BUỘC DỮ LIỆU
window.prepareDelete = (id) => {
  deleteIdInput.value = id;
  toggleModal(deleteModal, true);
};

/**
 * Hàm xác nhận xoá
 * Khi xoá category, phải cập nhật các bài Test đang thuộc category đó
 */
const confirmDelete = () => {
  const idToDelete = parseInt(deleteIdInput.value);

  // Tìm thông tin danh mục sắp bị xoá để đối chiếu với bài Test
  const deletedCategory = categories.find((c) => c.id === idToDelete);
  const deletedFullName = deletedCategory
    ? deletedCategory.emoji + " " + deletedCategory.name
    : "";

  // Xoá danh mục khỏi mảng chính
  categories = categories.filter((c) => c.id !== idToDelete);

  // Đánh số lại ID từ 1
  categories.forEach((cat, index) => {
    cat.id = index + 1;
  });

  syncStorage();

  // Xử lý ràng buộc: Cập nhật bài Test liên quan
  if (deletedFullName) {
    let allTests = JSON.parse(localStorage.getItem("tests")) || [];
    let hasChanges = false;
    allTests.forEach((test) => {
      // Nếu bài test thuộc danh mục vừa bị xoá, chuyển nó về trạng thái "Chưa có danh mục"
      if (test.category === deletedFullName) {
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

// 7. KIỂM TRA BẢO MẬT & KHỞI TẠO TRANG
const checkLogin = () => {
  let currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "../pages/login.html";
    return;
  }
  try {
    let currentUser = JSON.parse(currentUserStr);
    if (currentUser.role !== "admin") {
      window.location.href = "../pages/home.html";
    }
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "../pages/login.html";
  }
};

window.onload = function () {
  checkLogin();

  // --- Xử lý Menu Mobile ---
  const hamburger = document.querySelector(".hamburger");
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  const toggleMenu = () => {
    navbar.classList.toggle("nav-active");
    document.body.classList.toggle("menu-open");
  };

  if (hamburger) hamburger.addEventListener("click", toggleMenu);
  if (navLinks)
    navLinks.forEach((link) =>
      link.addEventListener("click", () => {
        navbar.classList.remove("nav-active");
        document.body.classList.remove("menu-open");
      }),
    );

  // --- Gán sự kiện cho các nút trong Modal ---
  document.getElementById("btnSave").onclick = saveData;

  let btnDel = document.querySelector("#deleteModal .btn-danger");
  if (btnDel) btnDel.onclick = confirmDelete;

  let closeBtns = document.querySelectorAll(".close-btn, .btn-secondary");
  closeBtns.forEach(
    (btn) =>
      (btn.onclick = () => {
        toggleModal(modal, false);
        toggleModal(deleteModal, false);
      }),
  );

  // Xoá thông báo lỗi ngay khi người dùng bắt đầu sửa lại input
  inputName.oninput = resetError;
  inputEmoji.oninput = resetError;

  renderTable(); // Vẽ bảng lần đầu khi load trang
};
