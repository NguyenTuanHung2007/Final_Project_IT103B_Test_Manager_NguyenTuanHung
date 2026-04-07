// Kiểm tra đăng nhập đơn giản
const checkLogin = () => {
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    window.location.href = "../pages/login.html";
    return;
  }
  try {
    JSON.parse(currentUser);
  } catch (e) {
    localStorage.removeItem("currentUser");
    window.location.href = "../pages/login.html";
  }
};

// Pagination vars
let currentPage = 1;
const ITEMS_PER_PAGE = 6;

const renderQuizGrid = (filteredTests = tests) => {
  const quizCards = document.querySelectorAll(".quiz-card");
  const pageTests = filteredTests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  if (filteredTests.length === 0) {
    quizCards.forEach((card) => {
      card.style.display = "none";
    });
    const paginationWrapper = document.querySelector(".pagination-wrapper");
    if (paginationWrapper)
      paginationWrapper.innerHTML =
        '<span style="padding: 10px; color: #6c757d;">Không tìm thấy bài test</span>';
    return;
  }

  // Clear and hide all
  quizCards.forEach((card) => {
    card.style.display = "none";
    card.querySelector(".quiz-info").innerHTML = "";
  });

  // Show and fill only page tests
  pageTests.forEach((test, i) => {
    const card = quizCards[i];
    if (card) {
      let emoji = "📚";
      let categoryName = test.category.replace(/^[^a-zA-ZÀ-ỹ]*/, "");
      window.categories.forEach((cat) => {
        if (cat.name === categoryName) emoji = cat.emoji;
      });
      let plays = test.plays || 0;
      let imgSrc = test.image || "../assets/images/Image.png";

      card.style.display = "flex";
      card.querySelector(".quiz-image img").src = imgSrc;
      card.querySelector(".quiz-info").innerHTML = `
        <div class="category">${emoji} ${categoryName}</div>
        <div class="quiz-title">${test.name}</div>
        <div class="stats">${test.questions} câu hỏi - ${plays} lượt chơi</div>
        <input type="hidden" data-test-id="${test.id}">
      `;
    }
  });

  renderPagination(filteredTests);
};

// Render pagination (from test-manager)
const renderPagination = (filteredTests) => {
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (!paginationWrapper) {
    return;
  }
  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);

  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5;
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  if (startPage > 1) {
    html += `<button class="page-item" data-page="1">1</button>`;
    if (startPage > 2) {
      html += "<span>...</span>";
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += "<span>...</span>";
    }
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" data-page="${currentPage + 1}">></button>`;

  paginationWrapper.innerHTML = html;

  // Events
  paginationWrapper
    .querySelectorAll(".page-item:not(.disabled)")
    .forEach((btn) => {
      btn.onclick = (e) => {
        currentPage = parseInt(e.target.dataset.page);
        renderQuizGrid(filteredTests);
      };
    });
};

document.addEventListener("DOMContentLoaded", () => {
  checkLogin();

  // Mobile menu toggle
  const hamburger = document.querySelector('.hamburger');
  const header = document.querySelector('header');
  const navLinks = document.querySelectorAll('nav a');

  const toggleMenu = () => {
    header.classList.toggle('nav-active');
    document.body.classList.toggle('menu-open');
    
    // ARIA accessibility
    hamburger.setAttribute('aria-expanded', header.classList.contains('nav-active'));
  };

  const closeMenu = () => {
    header.classList.remove('nav-active');
    document.body.classList.remove('menu-open');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'nav');
  }

  navLinks.forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // Close on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('nav-active')) {
      closeMenu();
    }
  });

  // Add admin manage link (after potential dynamic nav changes)
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  if (currentUser && currentUser.role === "admin") {
    const nav = document.querySelector("nav");
    if (nav) {
      const homeLink = nav.querySelector('a[href="./home.html"]');
      if (homeLink) {
        const manageLink = document.createElement("a");
        manageLink.href = "./category-manager.html";
        manageLink.textContent = "Quản lý";
        homeLink.insertAdjacentElement("afterend", manageLink);
        
        // Re-attach close event to new link
        manageLink.addEventListener('click', closeMenu);
      }
    }
  }

  // Load data
  let categories = JSON.parse(localStorage.getItem("categories")) || [];
  let tests = JSON.parse(localStorage.getItem("tests")) || [];

  // Global for render functions
  window.categories = categories;
  window.tests = tests;

  // Initial render
  renderQuizGrid(tests);

  // Random question play - fixed function definition
  const playRandomQuestion = () => {
    const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
    if (allTests.length === 0) {
      createToast("error", "Không có bài test nào");
      return;
    }

    const randomIndex = Math.floor(Math.random() * allTests.length);
    const randomTest = allTests[randomIndex];

    const questionsData = JSON.parse(
      localStorage.getItem(`testQuestions_${randomTest.id}`) || "{}",
    );

    if (questionsData.questions && questionsData.questions.length > 0) {
      allTests[randomIndex].plays = (allTests[randomIndex].plays || 0) + 1;
      localStorage.setItem("tests", JSON.stringify(allTests));

      window.location.href = `./do-test.html?testId=${randomTest.id}`;
    } else {
      alert("Bài test ngẫu nhiên chưa có câu hỏi! Đang thử lại bài khác...");
      playRandomQuestion();
    }
  };

  const randomBtn = document.querySelector(".btn-play-random");
  if (randomBtn) {
    randomBtn.addEventListener("click", playRandomQuestion);
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-card-play")) {
      const quizCard = e.target.closest(".quiz-card");
      const testId = parseInt(
        quizCard.querySelector("[data-test-id]").dataset.testId,
      );
      const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
      const testIndex = allTests.findIndex((t) => t.id === testId);

      if (testIndex > -1) {
        allTests[testIndex].plays = (allTests[testIndex].plays || 0) + 1;
        localStorage.setItem("tests", JSON.stringify(allTests));
      }

      window.location.href = `./do-test.html?testId=${testId}`;
    }
  });

  // Search
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      const filtered = tests.filter((t) =>
        t.name.toLowerCase().includes(e.target.value.toLowerCase()),
      );
      currentPage = 1;
      renderQuizGrid(filtered);
    };
  }

  // Filter buttons
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".btn-filter").forEach((b) => {
        b.classList.remove("active");
        b.style.backgroundColor = "";
      });
      const clickedBtn = e.target.closest(".btn-filter");
      clickedBtn.classList.add("active");

      let filtered = [...tests];
      const sortType = clickedBtn.textContent;
      if (sortType.includes("tăng")) {
        filtered.sort((a, b) => (a.plays || 0) - (b.plays || 0));
      } else if (sortType.includes("giảm")) {
        filtered.sort((a, b) => (b.plays || 0) - (a.plays || 0));
      }
      currentPage = 1;
      renderQuizGrid(filtered);
    });
  });
});
