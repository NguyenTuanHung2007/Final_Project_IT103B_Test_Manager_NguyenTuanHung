document.addEventListener("DOMContentLoaded", function () {
  // 1. Xử lý Menu Mobile
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn) {
    menuBtn.addEventListener("click", () =>
      mobileMenu.classList.toggle("show"),
    );
  }

  // 2. Kiểm tra đăng nhập
  const currentUserStr = localStorage.getItem("currentUser");
  if (!currentUserStr) {
    window.location.href = "./login.html";
    return;
  }

  // 3. Khai báo biến toàn cục
  let testId = null;
  let currentTest = null;
  let currentQuestions = [];
  let totalQuestions = 0;
  let currentQuestionIndex = 0;
  let userAnswers = {};
  let timeLeftMs = 0;
  let timerInterval = null;
  let answersStorageKey = "";
  let endTimeStorageKey = ""; // Khóa lưu mốc thời gian kết thúc

  // Hàm định dạng mm:ss
  const formatTime = (ms) => {
    if (ms < 0) ms = 0;
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 4. Hàm tải dữ liệu bài test và Xử lý logic Thời gian (F5 không reset)
  const loadTest = () => {
    const urlParams = new URLSearchParams(window.location.search);
    testId = parseInt(urlParams.get("testId"));

    if (!testId) {
      alert("Không tìm thấy bài test!");
      window.location.href = "./home.html";
      return false;
    }

    const tests = JSON.parse(localStorage.getItem("tests") || "[]");
    currentTest = tests.find((t) => t.id === testId);
    if (!currentTest) {
      alert("Bài test không tồn tại!");
      window.location.href = "./home.html";
      return false;
    }

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

    answersStorageKey = `userAnswers_${testId}`;
    endTimeStorageKey = `testEndTime_${testId}`;
    // Khóa mới để theo dõi xem Admin có sửa thời gian không
    const durationUsedKey = `testDurationUsed_${testId}`;

    userAnswers = JSON.parse(localStorage.getItem(answersStorageKey) || "{}");

    const storedEndTime = localStorage.getItem(endTimeStorageKey);
    const storedDuration = localStorage.getItem(durationUsedKey);
    const currentDuration = currentTest.time.toString(); // Thời gian hiện tại trong DB
    const now = Date.now();

    // KIỂM TRA: Nếu đã có mốc thời gian cũ NHƯNG thời lượng bài test đã bị Admin thay đổi
    if (storedEndTime && storedDuration !== currentDuration) {
      console.log(
        "Phát hiện Admin đã thay đổi thời gian bài test. Reset đồng hồ.",
      );
      localStorage.removeItem(endTimeStorageKey);
      // Coi như lần đầu vào làm bài với thời gian mới
      const durationMs = (parseInt(currentDuration) || 10) * 60 * 1000;
      timeLeftMs = durationMs;
      localStorage.setItem(endTimeStorageKey, (now + durationMs).toString());
      localStorage.setItem(durationUsedKey, currentDuration);
    }
    // Nếu mốc thời gian khớp và hợp lệ (F5 bình thường)
    else if (storedEndTime) {
      timeLeftMs = parseInt(storedEndTime) - now;
      if (timeLeftMs <= 0) timeLeftMs = 0;
    }
    // Nếu là lần đầu tiên làm bài
    else {
      const durationMs = (parseInt(currentDuration) || 10) * 60 * 1000;
      timeLeftMs = durationMs;
      localStorage.setItem(endTimeStorageKey, (now + durationMs).toString());
      localStorage.setItem(durationUsedKey, currentDuration);
    }

    return true;
  };

  // 5. Điều khiển đồng hồ
  const updateTimerDisplay = () => {
    document.getElementById("totalTime").textContent =
      `Thời gian: ${currentTest.time} phút`;
    document.getElementById("timeLeft").textContent =
      `Còn lại: ${formatTime(timeLeftMs)}`;
  };

  const startTimer = () => {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      timeLeftMs -= 1000;
      if (timeLeftMs <= 0) {
        timeLeftMs = 0;
        updateTimerDisplay();
        clearInterval(timerInterval);
        finishTest();
      } else {
        updateTimerDisplay();
      }
    }, 1000);
    updateTimerDisplay();
  };

  // 6. Hiển thị Giao diện
  const renderTestInfo = () => {
    document.getElementById("quizTitle").textContent = currentTest.name;
  };

  const renderQuickNav = () => {
    const grid = document.getElementById("questionGrid");
    grid.innerHTML = "";
    for (let i = 1; i <= totalQuestions; i++) {
      const btn = document.createElement("div");
      btn.className = "q-btn";
      btn.textContent = i;
      const qId = currentQuestions[i - 1]?.id;
      if (userAnswers[qId] !== undefined) btn.classList.add("answered");
      if (i === currentQuestionIndex + 1) btn.classList.add("active");
      btn.addEventListener("click", () => goToQuestion(i - 1));
      grid.appendChild(btn);
    }
  };

  const renderCurrentQuestion = () => {
    const q = currentQuestions[currentQuestionIndex];
    if (!q) return;

    document.getElementById("questionNumber").textContent =
      `Câu hỏi ${currentQuestionIndex + 1} trên ${totalQuestions}:`;
    document.getElementById("questionText").textContent = q.text;

    const optionsGroup = document.getElementById("optionsGroup");
    optionsGroup.innerHTML = "";

    q.answers.forEach((ans, idx) => {
      const label = document.createElement("label");
      label.className = "option-item";
      label.innerHTML = `
        <input type="radio" name="ans" value="${idx}" ${userAnswers[q.id] === idx ? "checked" : ""}>
        <span class="square-box"></span> ${ans.text}
      `;
      label
        .querySelector("input")
        .addEventListener("change", () => saveAnswer(q.id, idx));
      optionsGroup.appendChild(label);
    });

    // Cập nhật trạng thái nút Trước/Sau
    const prevBtn = document.getElementById("btnPrev");
    const nextBtn = document.getElementById("btnNext");
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.disabled = currentQuestionIndex === totalQuestions - 1;
    renderQuickNav();
  };

  const saveAnswer = (qId, idx) => {
    userAnswers[qId] = idx;
    localStorage.setItem(answersStorageKey, JSON.stringify(userAnswers));
    renderQuickNav();
  };

  const goToQuestion = (index) => {
    currentQuestionIndex = index;
    renderCurrentQuestion();
  };

  // 7. Hoàn thành và Nộp bài
  const finishTest = () => {
    clearInterval(timerInterval);
    // Xóa mốc thời gian kết thúc vì bài đã nộp
    localStorage.removeItem(endTimeStorageKey);

    let score = 0;
    currentQuestions.forEach((q) => {
      if (
        userAnswers[q.id] !== undefined &&
        q.answers[userAnswers[q.id]].isCorrect
      ) {
        score++;
      }
    });

    const percent = Math.round((score / totalQuestions) * 100);
    document.getElementById("resPercent").textContent = `${percent}%`;
    document.getElementById("resTotal").textContent = totalQuestions;
    document.getElementById("resCorrect").textContent = score;
    document.getElementById("resWrong").textContent = totalQuestions - score;
    document.getElementById("resultsModal").style.display = "flex";
  };

  // 8. Các hàm điều hướng nút bấm (Global)
  window.backToHome = () => {
    localStorage.removeItem(answersStorageKey);
    localStorage.removeItem(endTimeStorageKey);
    localStorage.removeItem(`testDurationUsed_${testId}`); // Thêm dòng này
    window.location.href = "./home.html";
  };

  window.retakeTest = () => {
    // Cập nhật lượt chơi trong danh sách tests
    const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
    const idx = allTests.findIndex((t) => t.id === testId);
    if (idx > -1) {
      allTests[idx].plays = (allTests[idx].plays || 0) + 1;
      localStorage.setItem("tests", JSON.stringify(allTests));
    }

    // Reset dữ liệu bài làm
    userAnswers = {};
    localStorage.removeItem(answersStorageKey);

    // Thiết lập mốc thời gian mới cho lần làm lại
    const durationMs = (parseInt(currentTest.time) || 10) * 60 * 1000;
    timeLeftMs = durationMs;
    localStorage.setItem(
      endTimeStorageKey,
      (Date.now() + durationMs).toString(),
    );

    currentQuestionIndex = 0;
    document.getElementById("resultsModal").style.display = "none";

    startTimer();
    renderCurrentQuestion();
  };

  // Khởi tạo ứng dụng
  if (loadTest()) {
    renderTestInfo();
    renderQuickNav();
    renderCurrentQuestion();

    // Nếu thời gian còn lại > 0 thì mới chạy đồng hồ, không thì nộp luôn
    if (timeLeftMs > 0) {
      startTimer();
    } else {
      finishTest();
    }

    // Gán sự kiện cho nút bấm
    document.getElementById("btnPrev").addEventListener("click", () => {
      if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
    });
    document.getElementById("btnNext").addEventListener("click", () => {
      if (currentQuestionIndex < totalQuestions - 1)
        goToQuestion(currentQuestionIndex + 1);
    });
    document.querySelector(".btn-finish").addEventListener("click", finishTest);
  }
});
