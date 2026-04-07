document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu toggle (keep existing)
  const menuBtn = document.getElementById("menuBtn");
  const mobileMenu = document.getElementById("mobileMenu");
  if (menuBtn) {
    menuBtn.addEventListener("click", function () {
      mobileMenu.classList.toggle("show");
    });
  }

  // Login check
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

  // Globals
  let testId = null;
  let currentTest = null;
  let currentQuestions = [];
  let totalQuestions = 0;
  let currentQuestionIndex = 0;
  let userAnswers = {};
  let timeLeftMs = 0;
  let timerInterval = null;
  let answersStorageKey = "";

  // Format time mm:ss
  const formatTime = (ms) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load test data
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

    // User answers storage
    answersStorageKey = `userAnswers_${testId}`;
    userAnswers = JSON.parse(localStorage.getItem(answersStorageKey) || "{}");

    // Time
    const minutes = parseInt(currentTest.time) || 10;
    timeLeftMs = minutes * 60 * 1000;

    return true;
  };

  // Update timer display
  const updateTimerDisplay = () => {
    document.getElementById("totalTime").textContent =
      `Thời gian: ${currentTest.time} phút`;
    document.getElementById("timeLeft").textContent =
      `Còn lại: ${formatTime(timeLeftMs)}`;
  };

  // Start countdown
  const startTimer = () => {
    timerInterval = setInterval(() => {
      timeLeftMs -= 1000;
      if (timeLeftMs <= 0) {
        timeLeftMs = 0;
        clearInterval(timerInterval);
        finishTest();
        return;
      }
      updateTimerDisplay();
    }, 1000);
    updateTimerDisplay();
  };

  // Render test info
  const renderTestInfo = () => {
    document.getElementById("quizTitle").textContent = currentTest.name;
  };

  // Render quick nav
  const renderQuickNav = () => {
    const grid = document.getElementById("questionGrid");
    grid.innerHTML = "";
    for (let i = 1; i <= totalQuestions; i++) {
      const btn = document.createElement("div");
      btn.className = "q-btn";
      btn.textContent = i;
      const q = currentQuestions[i - 1];
      const qId = q ? q.id : i;
      if (userAnswers[qId] !== undefined) btn.classList.add("answered");
      if (i === currentQuestionIndex + 1) btn.classList.add("active");
      btn.addEventListener("click", () => goToQuestion(i - 1));
      grid.appendChild(btn);
    }
  };

  // Render current question
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
    if (q.answers && q.answers.length > 0) {
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
    }

    // Nav buttons
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

  const saveAnswer = (qId, idx) => {
    userAnswers[qId] = idx;
    localStorage.setItem(answersStorageKey, JSON.stringify(userAnswers));
    renderQuickNav();
  };

  const goToQuestion = (index) => {
    currentQuestionIndex = index;
    renderCurrentQuestion();
  };

  const goPrev = () =>
    currentQuestionIndex > 0 && goToQuestion(currentQuestionIndex - 1);
  const goNext = () =>
    currentQuestionIndex < totalQuestions - 1 &&
    goToQuestion(currentQuestionIndex + 1);

  const finishTest = () => {
    clearInterval(timerInterval);
    let score = 0;
    currentQuestions.forEach((q) => {
      if (
        userAnswers[q.id] !== undefined &&
        q.answers[userAnswers[q.id]].isCorrect
      )
        score++;
    });
    const percent = Math.round((score / totalQuestions) * 100);
    document.getElementById("resPercent").textContent = `${percent}%`;
    document.getElementById("resTotal").textContent = totalQuestions;
    document.getElementById("resCorrect").textContent = score;
    document.getElementById("resWrong").textContent = totalQuestions - score;
    document.getElementById("resultsModal").style.display = "flex";
  };

  window.backToHome = () => {
    localStorage.removeItem(answersStorageKey);
    window.location.href = "./home.html";
  };

  window.retakeTest = () => {
    const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
    const testIndex = allTests.findIndex((t) => t.id === testId);
    if (testIndex > -1) {
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

  // Init
  if (loadTest()) {
    renderTestInfo();
    renderQuickNav();
    renderCurrentQuestion();
    startTimer();
    document.getElementById("btnPrev").addEventListener("click", goPrev);
    document.getElementById("btnNext").addEventListener("click", goNext);
    document.querySelector(".btn-finish").addEventListener("click", finishTest);
    document.getElementById("resultsModal").addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) retakeTest();
    });
  }
});
