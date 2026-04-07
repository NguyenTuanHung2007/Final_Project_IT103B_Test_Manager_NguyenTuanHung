// Khai báo các hằng số và biến toàn cục
const STORAGE_TEMP_KEY = "temp_add_test_questions"; // Key để lưu tạm câu hỏi khi đang soạn thảo
let questions = []; // Mảng chứa danh sách các câu hỏi của bài test
let editingRow = null; // Biến lưu trữ dòng đang được chỉnh sửa trong bảng

/**
 * Kiểm tra quyền truy cập: Chỉ Admin mới được vào trang này
 */
const checkLogin = () => {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "../pages/login.html";
  }
};

/**
 * Lưu danh sách câu hỏi hiện tại vào LocalStorage để tránh mất dữ liệu khi load lại trang
 */
const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_TEMP_KEY, JSON.stringify({ questions }));
};

/**
 * Tải dữ liệu câu hỏi đã lưu tạm từ LocalStorage
 */
const loadFromLocalStorage = () => {
  const data = localStorage.getItem(STORAGE_TEMP_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    questions = parsed.questions || [];
  }
};

/**
 * Hiển thị danh sách câu hỏi ra bảng HTML
 */
const renderTable = () => {
  const tbody = document.getElementById("questionTableBody");
  if (!tbody) return;

  tbody.innerHTML = ""; // Xóa nội dung cũ trước khi vẽ lại
  questions.forEach((q, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td class="text-center">${index + 1}</td>
            <td>${q.text}</td>
            <td class="text-center">
                <div class="action-group">
                    <button class="btn-edit" onclick="editRow(this)">Sửa</button>
                    <button class="btn-delete" onclick="prepareDelete(this)">Xoá</button>
                </div>
            </td>
        `;
    tbody.appendChild(row);
  });
};

/**
 * Thêm một dòng nhập đáp án mới trong Modal câu hỏi
 * @param {string} val Nội dung đáp án
 * @param {boolean} isCorrect Đáp án này có đúng hay không
 */
const addAnswerRow = (val = "", isCorrect = false) => {
  const answerList = document.getElementById("modalAnswerList");
  const div = document.createElement("div");
  div.className = "answer-item-row";
  div.innerHTML = `
        <div class="checkbox-section">
            <input type="checkbox" class="answer-checkbox" ${isCorrect ? "checked" : ""}>
        </div>
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

/**
 * Mở modal để Thêm mới hoặc Chỉnh sửa câu hỏi
 * Nếu có 'row', ta lấy dữ liệu từ mảng 'questions' dựa trên chỉ số dòng để điền vào form
 */
const openModal = (isEdit = false, row = null) => {
  const modal = document.getElementById("questionModal");
  const questionInput = document.getElementById("modalQuestionInput");
  const answerList = document.getElementById("modalAnswerList");
  modal.classList.add("active");
  answerList.innerHTML = "";

  if (isEdit && row) {
    editingRow = row;
    const rowIndex = row.rowIndex - 1; // Lấy index thật trong mảng (trừ tiêu đề bảng)
    const qData = questions[rowIndex];

    document.getElementById("modalTitle").innerText = "Sửa câu hỏi";
    questionInput.value = qData.text;

    // Load lại các đáp án cũ của câu hỏi này
    if (qData.answers && qData.answers.length > 0) {
      qData.answers.forEach((ans) => addAnswerRow(ans.text, ans.isCorrect));
    } else {
      for (let i = 0; i < 4; i++) addAnswerRow(); // Mặc định 4 dòng nếu trống
    }
  } else {
    // Chế độ thêm mới: Reset form
    editingRow = null;
    document.getElementById("modalTitle").innerText = "Thêm câu hỏi";
    questionInput.value = "";
    for (let i = 0; i < 4; i++) addAnswerRow();
  }
};

const closeModal = () =>
  document.getElementById("questionModal").classList.remove("active");

/**
 * Logic xử lý Lưu câu hỏi (Thêm mới hoặc Cập nhật)
 */
const saveQuestion = () => {
  const questionText = document.getElementById("modalQuestionInput").value;

  // Validation cơ bản cho câu hỏi
  if (!questionText.trim()) {
    return createToast("error", "Vui lòng nhập câu hỏi!");
  }

  // Thu thập dữ liệu từ các dòng đáp án
  const answerRows = document.querySelectorAll(".answer-item-row");
  const answers = [];
  answerRows.forEach((row) => {
    const text = row.querySelector(".answer-input-field").value.trim();
    const isCorrect = row.querySelector(".answer-checkbox").checked;
    if (text) {
      answers.push({ text, isCorrect });
    }
  });

  // Kiểm tra logic đáp án: ít nhất 2 câu trả lời và 1 câu đúng
  if (answers.length < 2)
    return createToast("error", "Vui lòng nhập ít nhất 2 đáp án!");
  if (!answers.some((a) => a.isCorrect))
    return createToast("error", "Vui lòng chọn ít nhất 1 đáp án đúng!");

  if (editingRow) {
    // Cập nhật câu hỏi hiện có
    const rowIndex = editingRow.rowIndex - 1;
    questions[rowIndex] = { text: questionText, answers: answers };
  } else {
    // Thêm câu hỏi mới vào mảng
    questions.push({ text: questionText, answers: answers });
  }

  renderTable();
  closeModal();
  saveToLocalStorage(); // Lưu trạng thái hiện tại
  createToast("success", "Lưu câu hỏi thành công!");
};

/**
 * Chuẩn bị xóa: Lưu lại dòng cần xóa và hiển thị Modal xác nhận
 */
const prepareDelete = (btn) => {
  editingRow = btn.closest("tr");
  document.getElementById("deleteModal").classList.add("active");
};

const closeDeleteModal = () =>
  document.getElementById("deleteModal").classList.remove("active");

/**
 * Xác nhận xóa câu hỏi khỏi mảng dữ liệu
 */
document.getElementById("confirmDeleteBtn").onclick = () => {
  if (editingRow) {
    const rowIndex = editingRow.rowIndex - 1;
    questions.splice(rowIndex, 1); // Xóa 1 phần tử tại vị trí index
    renderTable();
  }
  closeDeleteModal();
  saveToLocalStorage();
  createToast("success", "Xóa câu hỏi thành công!");
};

const editRow = (btn) => openModal(true, btn.closest("tr"));

/**
 * Lưu toàn bộ bài Test vào hệ thống (LocalStorage)
 * Tạo Object bài test mới -> Lưu vào danh sách 'tests' -> Lưu chi tiết câu hỏi vào key riêng
 */
const saveTest = () => {
  const nameInput = document.querySelector(
    '.test-info-section input[type="text"]',
  );
  const categorySelect = document.querySelector(".test-info-section select");
  const timeInput = document.querySelector(".flex-time input");

  // Kiểm tra các trường thông tin bắt buộc
  if (!nameInput.value.trim())
    return createToast("error", "Vui lòng nhập tên bài test!");
  if (!selectedImageFile)
    return createToast("error", "Vui lòng chọn ảnh bài test!");
  if (!categorySelect.value.trim())
    return createToast("error", "Vui lòng chọn danh mục!");

  const timeVal = timeInput.value.trim();
  const timeNum = parseInt(timeVal);
  if (
    !timeVal ||
    timeNum <= 0 ||
    !Number.isInteger(timeNum) ||
    timeVal.includes(".")
  ) {
    return createToast("error", "Thời gian phải là số nguyên lớn hơn 0!");
  }

  if (questions.length < 2)
    return createToast("error", "Phải có ít nhất 2 câu hỏi!");

  // 1. Lấy danh sách bài test hiện có để tạo ID tự tăng
  let tests = JSON.parse(localStorage.getItem("tests")) || [];
  const newId = tests.length > 0 ? Math.max(...tests.map((t) => t.id)) + 1 : 1;

  // 2. Tạo đối tượng thông tin bài test (Dùng để hiển thị ở danh sách bên ngoài)
  const newTest = {
    id: newId,
    name: nameInput.value.trim(),
    category: categorySelect.value,
    questions: questions.length,
    time: timeInput.value,
    image: selectedImageFile ? imagePreview.src : null, // Lưu ảnh dưới dạng Base64
  };

  tests.push(newTest);
  localStorage.setItem("tests", JSON.stringify(tests));

  // 3. Lưu chi tiết các câu hỏi vào một key riêng biệt theo ID bài test
  // Tối ưu hiệu năng (khi cần bài nào thì load bài đó, không load tất cả câu hỏi cùng lúc)
  const finalQuestions = questions.map((q, idx) => ({
    id: idx + 1,
    text: q.text,
    answers: q.answers,
  }));

  localStorage.setItem(
    `testQuestions_${newId}`,
    JSON.stringify({ questions: finalQuestions }),
  );

  // 4. Dọn dẹp dữ liệu tạm sau khi lưu thành công
  localStorage.removeItem(STORAGE_TEMP_KEY);

  createToast("success", "Lưu bài test thành công!");
  setTimeout(() => {
    window.location.href = "./test-manager.html";
  }, 1500);
};

/**
 * Kiểm tra tổng thể form trước khi cho phép lưu bài test
 */
const validateTestForm = () => {
  const nameInput = document.querySelector(
    '.test-info-section input[type="text"]',
  );
  const categorySelect = document.querySelector(".test-info-section select");
  const timeInput = document.querySelector(".flex-time input");

  if (
    !selectedImageFile ||
    !nameInput.value.trim() ||
    !categorySelect.value.trim() ||
    !timeInput.value ||
    !Number.isInteger(parseInt(timeInput.value)) ||
    timeInput.value.includes(".") ||
    parseInt(timeInput.value) <= 0 ||
    questions.length < 2
  ) {
    createToast("error", "Vui lòng điền đủ thông tin hợp lệ!");
    return false;
  }
  return true;
};

// Gán sự kiện cho nút Lưu tất cả
document.querySelector(".btn-save-all").onclick = () => {
  if (!validateTestForm()) return;
  saveTest();
};

let selectedImageFile = null;
let imagePreview = null;

/**
 * Xử lý chọn ảnh và hiển thị preview
 */
const handleImageSelect = () => {
  const fileInput = document.getElementById("test-img");
  const fileNameSpan = document.getElementById("file-name");
  const fileWrapper = document.querySelector(".file-input-wrapper");

  const file = fileInput.files[0];
  if (file) {
    selectedImageFile = file;
    fileNameSpan.textContent = file.name;

    // Tạo thẻ img để xem trước nếu chưa có
    if (!imagePreview) {
      imagePreview = document.createElement("img");
      imagePreview.className = "image-preview";
      imagePreview.style.cssText =
        "max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 6px; object-fit: cover;";
      fileWrapper.parentNode.appendChild(imagePreview);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result; // Chuyển file ảnh sang chuỗi base64
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    selectedImageFile = null;
    fileNameSpan.textContent = "Chưa chọn ảnh";
    if (imagePreview) imagePreview.style.display = "none";
  }
};

/**
 * Khi trang web tải xong (Initialize)
 */
window.onload = () => {
  checkLogin(); // Kiểm tra quyền admin ngay lập tức

  // --- Xử lý Menu cho phiên bản Mobile ---
  const hamburger = document.querySelector(".hamburger");
  const navbar = document.querySelector(".navbar");
  const navLinks = document.querySelectorAll(".nav-links a");

  const toggleMenu = () => {
    navbar.classList.toggle("nav-active");
    document.body.classList.toggle("menu-open");
  };

  const closeMenu = () => {
    navbar.classList.remove("nav-active");
    document.body.classList.remove("menu-open");
  };

  if (hamburger) hamburger.addEventListener("click", toggleMenu);
  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  // Đóng menu khi nhấn phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navbar.classList.contains("nav-active"))
      closeMenu();
  });

  // --- Load Danh mục (Categories) từ LocalStorage vào Select box ---
  const categories = JSON.parse(localStorage.getItem("categories")) || [];
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

  // --- Khởi tạo dữ liệu bảng câu hỏi ---
  loadFromLocalStorage();
  renderTable();

  // Gán sự kiện mở modal thêm câu hỏi mới
  document.querySelector(
    ".action-bar .btn-primary:not(.btn-save-all)",
  ).onclick = () => openModal(false);

  // Gán sự kiện thay đổi ảnh bài test
  document
    .getElementById("test-img")
    .addEventListener("change", handleImageSelect);
};
