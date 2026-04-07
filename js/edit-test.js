let questions = [];
let editingRow = null;
let testId = null;
let STORAGE_KEY = "";
let selectedImageFile = null;
let imagePreview = null;

const checkLogin = () => {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "../pages/login.html";
  }
};

const loadFromLocalStorage = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    questions = parsed.questions || [];
  }
};

const saveToLocalStorage = () => {
  if (STORAGE_KEY) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ questions }));
  }
};

const renderTable = () => {
  const tbody = document.querySelector("tbody");
  if (!tbody) {
    return;
  }
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

// --- QUẢN LÝ CÂU HỎI ---
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

const openModal = (isEdit = false, row = null) => {
  const modal = document.getElementById("questionModal");
  const input = document.getElementById("modalQuestionInput");
  const list = document.getElementById("modalAnswerList");
  modal.classList.add("active");
  list.innerHTML = "";

  if (isEdit && row) {
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
    editingRow = null;
    document.getElementById("modalTitle").innerText = "Thêm câu hỏi";
    input.value = "";
    for (let i = 0; i < 4; i++) addAnswerRow();
  }
};

const closeModal = () => {
  document.getElementById("questionModal").classList.remove("active");
  document.getElementById("deleteModal").classList.remove("active");
};

const saveQuestion = () => {
  const text = document.getElementById("modalQuestionInput").value;
  if (!text.trim()) {
    return createToast("error", "Vui lòng nhập câu hỏi!");
  }

  const answerRows = document.querySelectorAll(".answer-item-row");
  const answers = [];
  answerRows.forEach((row) => {
    const aText = row.querySelector(".answer-input-field").value.trim();
    const isCorrect = row.querySelector(".answer-checkbox").checked;
    if (aText) {
      answers.push({ text: aText, isCorrect });
    }
  });

  if (answers.length < 2) {
    return createToast("error", "Cần ít nhất 2 đáp án!");
  }
  if (!answers.some((a) => a.isCorrect)) {
    return createToast("error", "Cần ít nhất 1 đáp án đúng!");
  }
  if (editingRow) {
    const qId = parseInt(editingRow.cells[0].innerText);
    const index = questions.findIndex((q) => q.id === qId);
    if (index !== -1) {
      questions[index] = { ...questions[index], text: text, answers: answers };
    }
  } else {
    const nextId =
      questions.length > 0 ? Math.max(...questions.map((q) => q.id)) + 1 : 1;
    questions.push({ id: nextId, text: text, answers: answers });
  }

  renderTable();
  closeModal();
  saveToLocalStorage();
  createToast("success", "Lưu câu hỏi thành công!");
};

// --- QUẢN LÝ ẢNH ---
const handleImageSelect = () => {
  const fileInput = document.getElementById("test-img");
  const fileNameSpan = document.getElementById("file-name");
  const fileWrapper = document.querySelector(".file-input-wrapper");

  const file = fileInput.files[0];
  if (file) {
    selectedImageFile = file;
    fileNameSpan.textContent = file.name;

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
  
  if (!timeVal || timeNum <= 0 || !Number.isInteger(timeNum) || timeVal.includes('.')) {
    return createToast("error", "Thời gian phải là số nguyên lớn hơn 0!");
  }

  let allTests = JSON.parse(localStorage.getItem("tests")) || [];
  const testData = allTests.find((t) => t.id == testId);

  // Kiểm tra ảnh an toàn
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
    allTests[index] = {
      ...allTests[index],
      name,
      category,
      time: timeVal,
      questions: questions.length,
      image: currentImage,
    };
    localStorage.setItem("tests", JSON.stringify(allTests));
    saveToLocalStorage();
    createToast("success", "Cập nhật bài test thành công!");
    setTimeout(() => {
      window.location.href = "./test-manager.html";
    }, 1500);
  }
};

const prepareDelete = (btn) => {
  editingRow = btn.closest("tr");
  document.getElementById("deleteModal").classList.add("active");
};

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

window.onload = function () {
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

  const urlParams = new URLSearchParams(window.location.search);
  testId = parseInt(urlParams.get("id"));
  if (!testId) {
    alert("Không có ID bài test");
    window.location.href = "./test-manager.html";
    return;
  }

  STORAGE_KEY = `testQuestions_${testId}`;

  // Load categories
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

  // Load test data
  const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
  const testData = allTests.find((t) => t.id === testId);
  if (testData) {
    document.querySelector('.test-info-section input[type="text"]').value =
      testData.name;
    document.querySelector(".test-info-section select").value =
      testData.category;
    document.querySelector(".flex-time input").value = testData.time;
    if (testData.image) {
      loadImagePreview(testData.image);
    }
  }

  // Load questions
  loadFromLocalStorage();
  renderTable();

  document.querySelector(
    ".action-bar .btn-primary:not(.btn-save-all)",
  ).onclick = () => openModal(false);
  document.querySelector(".btn-save-all").onclick = saveTest;
  document
    .getElementById("test-img")
    .addEventListener("change", handleImageSelect);

  window.onclick = (e) => {
    if (e.target.classList.contains("modal-overlay")) closeModal();
  };
};
