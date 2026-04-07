// Khai báo các biến lưu trữ trạng thái của trang
let questions = []; // Danh sách các câu hỏi của bài test hiện tại
let editingRow = null; // Lưu trữ dòng (row) đang được chọn để chỉnh sửa trong bảng
let testId = null; // ID của bài test lấy từ URL
let STORAGE_KEY = ""; // Khóa dùng để truy xuất câu hỏi từ LocalStorage (testQuestions_ID)
let selectedImageFile = null; // Lưu trữ tệp ảnh người dùng chọn mới
let imagePreview = null; // Tham chiếu đến phần tử hiển thị ảnh xem trước

// Kiểm tra quyền truy cập: Chỉ cho phép Admin, nếu không thì quay về trang login
const checkLogin = () => {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "../pages/login.html";
  }
};

// Tải danh sách câu hỏi từ LocalStorage dựa trên STORAGE_KEY đã xác định
const loadFromLocalStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    questions = parsed.questions || [];
  }
};

// Lưu danh sách câu hỏi hiện tại vào LocalStorage
const saveToLocalStorage = () => {
  if (STORAGE_KEY) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions }));
  }
};

// Vẽ lại bảng danh sách câu hỏi lên giao diện
const renderTable = () => {
  const tbody = document.querySelector("tbody");
  if (!tbody) return;

  tbody.innerHTML = "";
  questions.forEach((q, index) => {
    const row = tbody.insertRow();
    row.innerHTML = `
            <td class="text-center">${q.id || index + 1}</td>
            <td>${q.text}</td>
            <td class="text-center">
                <div class="action-group">
                    <button class="btn-edit" onclick="editCurrentRow(this)">Sửa</button>
                    <button class="btn-delete" onclick="prepareDelete(this)">Xoá</button>
                </div>
            </td>`;
  });
};

// Thêm một dòng nhập đáp án mới vào trong Modal câu hỏi
const addAnswerRow = (val = "", isCorrect = false) => {
  const answerList = document.getElementById("modalAnswerList");
  const div = document.createElement("div");
  div.className = "answer-item-row";
  div.innerHTML = `
        <div class="checkbox-section"><input type="checkbox" class="answer-checkbox" ${isCorrect ? "checked" : ""}></div>
        <input type="text" placeholder="Nhập câu trả lời" class="answer-input-field" value="${val}">
        <button class="btn-remove-answer-row" onclick="this.parentElement.remove()">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
        </button>`;
  answerList.appendChild(div);
};

// Mở Modal để thêm mới hoặc sửa một câu hỏi
const openModal = (isEdit = false, row = null) => {
  const modal = document.getElementById("questionModal");
  const input = document.getElementById("modalQuestionInput");
  const list = document.getElementById("modalAnswerList");
  modal.classList.add("active");
  list.innerHTML = "";

  if (isEdit && row) {
    // Chế độ sửa: Lấy dữ liệu cũ đổ vào form
    editingRow = row;
    const qId = parseInt(row.cells[0].innerText);
    const qData = questions.find((q) => q.id === qId);

    document.getElementById("modalTitle").innerText = "Sửa câu hỏi";
    input.value = qData.text;

    if (qData.answers && qData.answers.length > 0) {
      qData.answers.forEach((ans) => addAnswerRow(ans.text, ans.isCorrect));
    } else {
      for (let i = 0; i < 4; i++) addAnswerRow();
    }
  } else {
    // Chế độ thêm mới: Reset form trống
    editingRow = null;
    document.getElementById("modalTitle").innerText = "Thêm câu hỏi";
    input.value = "";
    for (let i = 0; i < 4; i++) addAnswerRow();
  }
};

// Đóng tất cả các Modal đang mở
const closeModal = () => {
  document.getElementById("questionModal").classList.remove("active");
  document.getElementById("deleteModal").classList.remove("active");
};

// Lưu thông tin câu hỏi (Thêm/Sửa) sau khi kiểm tra tính hợp lệ
const saveQuestion = () => {
  const text = document.getElementById("modalQuestionInput").value;
  if (!text.trim()) {
    return createToast("error", "Vui lòng nhập câu hỏi!");
  }

  // Thu thập dữ liệu từ các dòng đáp án trong modal
  const answerRows = document.querySelectorAll(".answer-item-row");
  const answers = [];
  answerRows.forEach((row) => {
    const aText = row.querySelector(".answer-input-field").value.trim();
    const isCorrect = row.querySelector(".answer-checkbox").checked;
    if (aText) {
      answers.push({ text: aText, isCorrect });
    }
  });

  // Ràng buộc logic: phải có >= 2 đáp án và ít nhất 1 đáp án đúng
  if (answers.length < 2) {
    return createToast("error", "Cần ít nhất 2 đáp án!");
  }
  if (!answers.some((a) => a.isCorrect)) {
    return createToast("error", "Cần ít nhất 1 đáp án đúng!");
  }

  if (editingRow) {
    // Cập nhật câu hỏi hiện tại trong mảng
    const qId = parseInt(editingRow.cells[0].innerText);
    const index = questions.findIndex((q) => q.id === qId);
    if (index !== -1) {
      questions[index] = { ...questions[index], text: text, answers: answers };
    }
  } else {
    // Tạo ID mới và thêm câu hỏi vào mảng
    const nextId =
      questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    questions.push({ id: nextId, text: text, answers: answers });
  }

  renderTable();
  closeModal();
  saveToLocalStorage();
  createToast("success", "Lưu câu hỏi thành công!");
};

// Xử lý khi người dùng chọn một file ảnh từ máy tính
const handleImageSelect = () => {
  const fileInput = document.getElementById("test-img");
  const fileNameSpan = document.getElementById("file-name");
  const fileWrapper = document.querySelector(".file-input-wrapper");

  const file = fileInput.files[0];
  if (file) {
    selectedImageFile = file;
    fileNameSpan.textContent = file.name;

    // Tạo hoặc cập nhật phần tử img để xem trước ảnh (Base64)
    if (!imagePreview) {
      imagePreview = document.createElement("img");
      imagePreview.style.cssText =
        "max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 6px; object-fit: cover; display: block;";
      fileWrapper.parentNode.appendChild(imagePreview);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

// Hiển thị ảnh cũ của bài test khi vừa tải trang
const loadImagePreview = (imageSrc) => {
  const fileNameSpan = document.getElementById("file-name");
  const fileWrapper = document.querySelector(".file-input-wrapper");
  fileNameSpan.textContent = "Ảnh hiện tại";

  if (!imagePreview) {
    imagePreview = document.createElement("img");
    imagePreview.style.cssText =
      "max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 6px; object-fit: cover; display: block;";
    fileWrapper.parentNode.appendChild(imagePreview);
  }
  imagePreview.src = imageSrc;
};

// Lưu toàn bộ thông tin bài test (Tên, danh mục, thời gian, ảnh, câu hỏi)
const saveTest = () => {
  const nameInput = document.querySelector(
    '.test-info-section input[type="text"]',
  );
  const categorySelect = document.querySelector(".test-info-section select");
  const timeInput = document.querySelector(".flex-time input");

  const name = nameInput.value.trim();
  const category = categorySelect.value;
  const timeVal = timeInput.value.trim();
  const timeNum = parseInt(timeVal);

  if (!name) return createToast("error", "Vui lòng nhập tên bài test!");

  // Kiểm tra thời gian phải là số nguyên dương
  if (
    !timeVal ||
    timeNum <= 0 ||
    !Number.isInteger(timeNum) ||
    timeVal.includes(".")
  ) {
    return createToast("error", "Thời gian phải là số nguyên lớn hơn 0!");
  }

  let allTests = JSON.parse(localStorage.getItem("tests")) || [];
  const testData = allTests.find((t) => t.id == testId);

  // Lấy đường dẫn ảnh: Ưu tiên ảnh mới chọn, nếu không có thì lấy ảnh cũ
  const currentImage = imagePreview
    ? imagePreview.src
    : testData
      ? testData.image
      : "";
  if (!currentImage) {
    return createToast("error", "Vui lòng chọn ảnh bài test!");
  }

  const index = allTests.findIndex((t) => t.id == testId);
  if (index !== -1) {
    // Cập nhật thông tin bài test vào danh sách tổng
    allTests[index] = {
      ...allTests[index],
      name,
      category,
      time: timeVal,
      questions: questions.length,
      image: currentImage,
    };
    localStorage.setItem("tests", JSON.stringify(allTests));
    saveToLocalStorage(); // Lưu chi tiết các câu hỏi
    createToast("success", "Cập nhật bài test thành công!");
    setTimeout(() => {
      window.location.href = "./test-manager.html";
    }, 1500);
  }
};

// Mở modal xác nhận trước khi xóa một dòng câu hỏi
const prepareDelete = (btn) => {
  editingRow = btn.closest("tr");
  document.getElementById("deleteModal").classList.add("active");
};

// Thực hiện xóa câu hỏi khỏi mảng dữ liệu và cập nhật giao diện
const confirmDeleteRow = () => {
  if (editingRow) {
    const id = parseInt(editingRow.cells[0].innerText);
    questions = questions.filter((q) => q.id !== id);
    renderTable();
    saveToLocalStorage();
    createToast("success", "Xóa câu hỏi thành công!");
  }
  closeModal();
};

const editCurrentRow = (btn) => openModal(true, btn.closest("tr"));

// Khởi tạo dữ liệu khi trang được tải xong
window.onload = function () {
  checkLogin();

  // --- Thiết lập Menu di động (Hamburger) ---
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

  // --- Lấy ID bài test từ URL để xác định đang sửa bài nào ---
  const urlParams = new URLSearchParams(window.location.search);
  testId = parseInt(urlParams.get("id"));
  if (!testId) {
    alert("Không có ID bài test");
    window.location.href = "./test-manager.html";
    return;
  }

  STORAGE_KEY = `testQuestions_${testId}`;

  // Đổ danh sách danh mục vào thẻ Select
  const categories = JSON.parse(localStorage.getItem("categories") || "[]");
  const select = document.querySelector(".test-info-section select");
  if (select) {
    select.innerHTML = '<option value="">Chọn danh mục</option>';
    categories.forEach((cat) => {
      const option = document.createElement("option");
      option.value = cat.emoji + " " + cat.name;
      option.textContent = cat.emoji + " " + cat.name;
      select.appendChild(option);
    });
  }

  // Tải thông tin chung của bài test (tên, danh mục, thời gian, ảnh)
  const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
  const testData = allTests.find((t) => t.id === testId);
  if (testData) {
    document.querySelector('.test-info-section input[type="text"]').value =
      testData.name;
    document.querySelector(".test-info-section select").value =
      testData.category;
    document.querySelector(".flex-time input").value = testData.time;
    if (testData.image) loadImagePreview(testData.image);
  }

  // Tải chi tiết các câu hỏi và hiển thị lên bảng
  loadFromLocalStorage();
  renderTable();

  // Gán sự kiện click cho các nút chức năng chính
  document.querySelector(
    ".action-bar .btn-primary:not(.btn-save-all)",
  ).onclick = () => openModal(false);
  document.querySelector(".btn-save-all").onclick = saveTest;
  document
    .getElementById("test-img")
    .addEventListener("change", handleImageSelect);

  // Đóng modal khi click ra vùng ngoài (overlay)
  window.onclick = (e) => {
    if (e.target.classList.contains("modal-overlay")) closeModal();
  };
};
