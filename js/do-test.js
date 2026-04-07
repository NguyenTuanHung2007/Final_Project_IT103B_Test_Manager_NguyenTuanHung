document.addEventListener("DOMContentLoaded", function () {
  // Xử lý bật/tắt menu trên thiết bị di động
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("show");
    });
  }

  // Kiểm tra trạng thái đăng nhập: Nếu chưa đăng nhập hoặc dữ liệu lỗi thì chuyển hướng về trang login
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "./login.html";
    return;
  }
  let currentUser;
  try {
    currentUser = JSON.parse(currentUserStr);
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "./login.html";
    return;
  }

  // Khai báo các biến toàn cục để quản lý trạng thái bài thi
  let testId = null; // ID của bài test hiện tại
  let currentTest = null; // Thông tin chung (tên, thời gian) của bài test
  let currentQuestions = []; // Danh sách các câu hỏi của bài test
  let totalQuestions = 0; // Tổng số câu hỏi
  let currentQuestionIndex = 0; // Vị trí câu hỏi hiện tại người dùng đang xem
  let userAnswers = {}; // Lưu trữ đáp án người dùng đã chọn (Dạng: {questionId: answerIndex})
  let timeLeftMs = 0; // Thời gian còn lại tính bằng miligiây
  let timerInterval = null; // Biến quản lý hàm đếm ngược
  let answersStorageKey = ""; // Khóa dùng để lưu tạm đáp án vào LocalStorage

  // Hàm định dạng thời gian từ miligiây sang định dạng mm:ss để hiển thị trên giao diện
  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Hàm tải dữ liệu bài test từ LocalStorage dựa trên testId từ URL
  const loadTest = () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = parseInt(urlParams.get("testId"));
    if (!testId) {
      alert("Không tìm thấy bài test!");
      window.location.href = "./home.html";
      return false;
    }

    // Lấy thông tin bài test từ mảng 'tests'
    const tests = JSON.parse(localStorage.getItem("tests") || "[]");
    currentTest = tests.find((t) => t.id === testId);
    if (!currentTest) {
      alert("Bài test không tồn tại!");
      window.location.href = "./home.html";
      return false;
    }

    // Lấy danh sách câu hỏi cụ thể của bài test này thông qua khóa định danh riêng
    const questionsData = JSON.parse(
      localStorage.getItem(`testQuestions_${testId}`) || "{}",
    );
    currentQuestions = questionsData.questions || [];
    totalQuestions = currentQuestions.length;
    if (totalQuestions === 0) {
      alert("Bài test chưa có câu hỏi!");
      window.location.href = "./home.html";
      return false;
    }

    // Khởi tạo nơi lưu trữ đáp án tạm thời để tránh mất bài khi tải lại trang
    answersStorageKey = `userAnswers_${testId}`;
    userAnswers = JSON.parse(localStorage.getItem(answersStorageKey) || "{}");

    // Tính toán thời gian làm bài (chuyển từ phút sang miligiây)
    const minutes = parseInt(currentTest.time) || 10;
    timeLeftMs = minutes * 60 * 1000;

    return true;
  };

  // Cập nhật hiển thị đồng hồ đếm ngược trên giao diện
  const updateTimerDisplay = () => {
    document.getElementById("totalTime").textContent =
      `Thời gian: ${currentTest.time} phút`;
    document.getElementById("timeLeft").textContent =
      `Còn lại: ${formatTime(timeLeftMs)}`;
  };

  // Bắt đầu chạy đồng hồ đếm ngược
  const startTimer = () => {
    timerInterval = setInterval(() => {
      timeLeftMs -= 1000;
      if (timeLeftMs <= 0) {
        timeLeftMs = 0;
        clearInterval(timerInterval);
        finishTest(); // Tự động nộp bài khi hết thời gian
        return;
      }
      updateTimerDisplay();
    }, 1000);
    updateTimerDisplay();
  };

  // Hiển thị tên bài thi lên tiêu đề
  const renderTestInfo = () => {
    document.getElementById("quizTitle").textContent = currentTest.name;
  };

  // Vẽ danh sách các ô số câu hỏi (Navigation) giúp người dùng nhảy nhanh tới câu bất kỳ
  const renderQuickNav = () => {
    const grid = document.getElementById("questionGrid");
    grid.innerHTML = "";
    for (let i = 1; i <= totalQuestions; i++) {
      const btn = document.createElement("div");
      btn.className = "q-btn";
      btn.textContent = i;
      const q = currentQuestions[i - 1];
      const qId = q ? q.id : i;
      // Nếu câu hỏi đã có đáp án thì đổi màu ô số
      if (userAnswers[qId] !== undefined) btn.classList.add("answered");
      // Đánh dấu ô số câu hỏi hiện tại đang xem
      if (i === currentQuestionIndex + 1) btn.classList.add("active");
      btn.addEventListener("click", () => goToQuestion(i - 1));
      grid.appendChild(btn);
    }
  };

  // Hiển thị nội dung câu hỏi và các lựa chọn đáp án hiện tại
  const renderCurrentQuestion = () => {
    const q = currentQuestions[currentQuestionIndex];
    if (!q) {
      console.error("No question at", currentQuestionIndex);
      return;
    }
    document.getElementById("questionNumber").textContent =
      `Câu hỏi ${currentQuestionIndex + 1} trên ${totalQuestions}:`;
    document.getElementById("questionText").textContent = q.text;

    const optionsGroup = document.getElementById("optionsGroup");
    optionsGroup.innerHTML = "";

    // Duyệt qua danh sách đáp án của câu hỏi và tạo các thẻ input radio
    if (q.answers && q.answers.length > 0) {
      q.answers.forEach((ans, idx) => {
        const label = document.createElement("label");
        label.className = "option-item";
        label.innerHTML = `
          <input type="radio" name="ans" value="${idx}" ${userAnswers[q.id] === idx ? "checked" : ""}>
          <span class="square-box"></span> ${ans.text}
        `;
        // Lắng nghe sự kiện chọn đáp án
        label
          .querySelector("input")
          .addEventListener("change", () => saveAnswer(q.id, idx));
        optionsGroup.appendChild(label);
      });
    }

    // Xử lý logic ẩn/hiện và trạng thái của các nút Điều hướng (Trước/Sau)
    const prevBtn = document.getElementById("btnPrev");
    const nextBtn = document.getElementById("btnNext");
    const isFirst = currentQuestionIndex === 0;
    const isLast = currentQuestionIndex === totalQuestions - 1;
    prevBtn.disabled = isFirst;
    nextBtn.disabled = isLast;
    prevBtn.style.opacity = isFirst ? "0.5" : "1";
    nextBtn.style.opacity = isLast ? "0.5" : "1";
    prevBtn.style.cursor = isFirst ? "not-allowed" : "pointer";
    nextBtn.style.cursor = isLast ? "not-allowed" : "pointer";
    renderQuickNav();
  };

  // Lưu đáp án người dùng chọn vào bộ nhớ tạm thời
  const saveAnswer = (qId, idx) => {
    userAnswers[qId] = idx;
    localStorage.setItem(answersStorageKey, JSON.stringify(userAnswers));
    renderQuickNav();
  };

  // Chuyển đến một câu hỏi bất kỳ theo chỉ số (index)
  const goToQuestion = (index) => {
    currentQuestionIndex = index;
    renderCurrentQuestion();
  };

  const goPrev = () =>
    currentQuestionIndex > 0 && goToQuestion(currentQuestionIndex - 1);
  const goNext = () =>
    currentQuestionIndex < totalQuestions - 1 &&
    goToQuestion(currentQuestionIndex + 1);

  // Xử lý nộp bài và tính toán kết quả
  const finishTest = () => {
    clearInterval(timerInterval); // Dừng đồng hồ
    let score = 0;
    // Duyệt qua các câu hỏi và so sánh đáp án người dùng với đáp án đúng
    currentQuestions.forEach((q) => {
      if (
        userAnswers[q.id] !== undefined &&
        q.answers[userAnswers[q.id]].isCorrect
      )
        score++;
    });

    // Tính toán phần trăm và hiển thị lên Modal kết quả
    const percent = Math.round((score / totalQuestions) * 100);
    document.getElementById("resPercent").textContent = `${percent}%`;
    document.getElementById("resTotal").textContent = totalQuestions;
    document.getElementById("resCorrect").textContent = score;
    document.getElementById("resWrong").textContent = totalQuestions - score;
    document.getElementById("resultsModal").style.display = "flex";
  };

  // Thoát bài thi về trang chủ và dọn dẹp bộ nhớ tạm
  window.backToHome = () => {
    localStorage.removeItem(answersStorageKey);
    window.location.href = "./home.html";
  };

  // Chơi lại bài thi: Cập nhật số lượt chơi và reset trạng thái bài làm
  window.retakeTest = () => {
    const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
    const testIndex = allTests.findIndex((t) => t.id === testId);
    if (testIndex > -1) {
      // Tăng số lượt làm bài (plays) lên 1
      allTests[testIndex].plays = (allTests[testIndex].plays || 0) + 1;
      localStorage.setItem("tests", JSON.stringify(allTests));
    }
    userAnswers = {};
    localStorage.removeItem(answersStorageKey);
    currentQuestionIndex = 0;
    timeLeftMs = parseInt(currentTest.time) * 60 * 1000;
    document.getElementById("resultsModal").style.display = "none";
    startTimer();
    renderCurrentQuestion();
  };

  // Khởi tạo bài thi khi trang web đã sẵn sàng
  if (loadTest()) {
    renderTestInfo();
    renderQuickNav();
    renderCurrentQuestion();
    startTimer();
    // Gán sự kiện cho các nút điều khiển chính
    document.getElementById("btnPrev").addEventListener("click", goPrev);
    document.getElementById("btnNext").addEventListener("click", goNext);
    document.querySelector(".btn-finish").addEventListener("click", finishTest);
    // Nhấp vào vùng ngoài Modal kết quả sẽ coi như muốn làm lại bài
    document.getElementById("resultsModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) retakeTest();
    });
  }
});
