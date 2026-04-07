const STORAGE_TEMP_KEY = "temp_add_test_questions";
let questions = [];
let editingRow = null;

const checkLogin = () => {
  let currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (!currentUser || currentUser.role !== "admin") {
    window.location.href = "../pages/login.html";
  }
};

const saveToLocalStorage = () => {
  localStorage.setItem(STORAGE_TEMP_KEY, JSON.stringify({ questions }));
};

const loadFromLocalStorage = () => {
  const data = localStorage.getItem(STORAGE_TEMP_KEY);
  if (data) {
    const parsed = JSON.parse(data);
    questions = parsed.questions || [];
  }
};

const renderTable = () => {
  const tbody = document.getElementById("questionTableBody");
  if (!tbody) {
    return;
  }

  tbody.innerHTML = "";
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

const openModal = (isEdit = false, row = null) => {
  const modal = document.getElementById("questionModal");
  const questionInput = document.getElementById("modalQuestionInput");
  const answerList = document.getElementById("modalAnswerList");
  modal.classList.add("active");
  answerList.innerHTML = "";

  if (isEdit && row) {
    editingRow = row;
    const rowIndex = row.rowIndex - 1;
    const qData = questions[rowIndex];

    document.getElementById("modalTitle").innerText = "Sửa câu hỏi";
    questionInput.value = qData.text;

    if (qData.answers && qData.answers.length > 0) {
      qData.answers.forEach((ans) => addAnswerRow(ans.text, ans.isCorrect));
    } else {
      for (let i = 0; i < 4; i++) addAnswerRow();
    }
  } else {
    editingRow = null;
    document.getElementById("modalTitle").innerText = "Thêm câu hỏi";
    questionInput.value = "";
    for (let i = 0; i < 4; i++) addAnswerRow();
  }
};

const closeModal = () =>
  document.getElementById("questionModal").classList.remove("active");

const saveQuestion = () => {
  const questionText = document.getElementById("modalQuestionInput").value;
  if (!questionText.trim()) {
    return createToast("error", "Vui lòng nhập câu hỏi!");
  }

  const answerRows = document.querySelectorAll(".answer-item-row");
  const answers = [];
  answerRows.forEach((row) => {
    const text = row.querySelector(".answer-input-field").value.trim();
    const isCorrect = row.querySelector(".answer-checkbox").checked;
    if (text) {
      answers.push({ text, isCorrect });
    }
  });

  if (answers.length < 2)
    return createToast("error", "Vui lòng nhập ít nhất 2 đáp án!");
  if (!answers.some((a) => a.isCorrect))
    return createToast("error", "Vui lòng chọn ít nhất 1 đáp án đúng!");

  if (editingRow) {
    const rowIndex = editingRow.rowIndex - 1;
    questions[rowIndex] = { text: questionText, answers: answers };
  } else {
    questions.push({ text: questionText, answers: answers });
  }

  renderTable();
  closeModal();
  saveToLocalStorage();
  createToast("success", "Lưu câu hỏi thành công!");
};

const prepareDelete = (btn) => {
  editingRow = btn.closest("tr");
  document.getElementById("deleteModal").classList.add("active");
};

const closeDeleteModal = () =>
  document.getElementById("deleteModal").classList.remove("active");

document.getElementById("confirmDeleteBtn").onclick = () => {
  if (editingRow) {
    const rowIndex = editingRow.rowIndex - 1;
    questions.splice(rowIndex, 1);
    renderTable();
  }
  closeDeleteModal();
  saveToLocalStorage();
  createToast("success", "Xóa câu hỏi thành công!");
};

const editRow = (btn) => openModal(true, btn.closest("tr"));

const saveTest = () => {
  const nameInput = document.querySelector(
    '.test-info-section input[type="text"]',
  );
  const categorySelect = document.querySelector(".test-info-section select");
  const timeInput = document.querySelector(".flex-time input");

  if (!nameInput.value.trim()) {
    return createToast("error", "Vui lòng nhập tên bài test!");
  }

  if (!selectedImageFile) {
    return createToast("error", "Vui lòng chọn ảnh bài test!");
  }

  if (!categorySelect.value.trim()) {
    return createToast("error", "Vui lòng chọn danh mục!");
  }

  const timeVal = timeInput.value.trim();
  const timeNum = parseInt(timeVal);
  if (!timeVal || timeNum <= 0 || !Number.isInteger(timeNum) || timeVal.includes('.')) {
    return createToast("error", "Thời gian phải là số nguyên lớn hơn 0!");
  }

  if (questions.length < 2) {
    return createToast("error", "Phải có ít nhất 2 câu hỏi!");
  }

  let tests = JSON.parse(localStorage.getItem("tests")) || [];
  const newId = tests.length > 0 ? Math.max(...tests.map((t) => t.id)) + 1 : 1;

  const newTest = {
    id: newId,
    name: nameInput.value.trim(),
    category: categorySelect.value,
    questions: questions.length,
    time: timeInput.value,
    image: selectedImageFile ? imagePreview.src : null,
  };

  tests.push(newTest);
  localStorage.setItem("tests", JSON.stringify(tests));

  const finalQuestions = questions.map((q, idx) => ({
    id: idx + 1,
    text: q.text,
    answers: q.answers,
  }));

  localStorage.setItem(
    `testQuestions_${newId}`,
    JSON.stringify({ questions: finalQuestions }),
  );
  localStorage.removeItem(STORAGE_TEMP_KEY);

  createToast("success", "Lưu bài test thành công!");
  setTimeout(() => {
    window.location.href = "./test-manager.html";
  }, 1500);
};

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
    timeInput.value.includes('.') ||
    parseInt(timeInput.value) <= 0 ||
    questions.length < 2
  ) {
    createToast("error", "Vui lòng điền đủ thông tin!");
    return false;
  }
  return true;
};

document.querySelector(".btn-save-all").onclick = () => {
  if (!validateTestForm()) return;
  saveTest();
};

let selectedImageFile = null;
let imagePreview = null;

const handleImageSelect = () => {
  const fileInput = document.getElementById("test-img");
  const fileNameSpan = document.getElementById("file-name");
  const fileWrapper = document.querySelector(".file-input-wrapper");

  const file = fileInput.files[0];
  if (file) {
    selectedImageFile = file;
    fileNameSpan.textContent = file.name;

    // Create preview
    if (!imagePreview) {
      imagePreview = document.createElement("img");
      imagePreview.className = "image-preview";
      imagePreview.style.cssText =
        "max-width: 100px; max-height: 100px; margin-top: 10px; border-radius: 6px; object-fit: cover;";
      fileWrapper.parentNode.appendChild(imagePreview);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      imagePreview.style.display = "block";
    };
    reader.readAsDataURL(file);
  } else {
    selectedImageFile = null;
    fileNameSpan.textContent = "Chưa chọn ảnh";
    if (imagePreview) {
      imagePreview.style.display = "none";
    }
  }
};

window.onload = () => {
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
  loadFromLocalStorage();
  renderTable();
  document.querySelector(
    ".action-bar .btn-primary:not(.btn-save-all)",
  ).onclick = () => openModal(false);
  document.querySelector(".btn-save-all").onclick = saveTest;

  // Add image handler
  document
    .getElementById("test-img")
    .addEventListener("change", handleImageSelect);
};
