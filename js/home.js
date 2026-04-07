// Kiểm tra trạng thái đăng nhập: Đảm bảo người dùng đã login mới được xem nội dung
const checkLogin = () => {
  let currentUser = localStorage.getItem("currentUser");
  if (!currentUser) {
    window.location.href = "../pages/login.html";
    return;
  }
  try {
    // Thử parse dữ liệu để kiểm tra xem JSON có hợp lệ không
    JSON.parse(currentUser);
  } catch (e) {
    // Nếu dữ liệu hỏng, xóa sạch và yêu cầu đăng nhập lại
    localStorage.removeItem("currentUser");
    window.location.href = "../pages/login.html";
  }
};

// Khai báo các biến phục vụ logic phân trang
let currentPage = 1; // Trang hiện tại người dùng đang xem
const ITEMS_PER_PAGE = 6; // Mỗi trang chỉ hiển thị tối đa 6 bài test

// Hàm hiển thị danh sách bài test lên giao diện (Grid)
const renderQuizGrid = (filteredTests = tests) => {
  const quizCards = document.querySelectorAll(".quiz-card");

  // Cắt mảng dữ liệu để chỉ lấy các bài test thuộc trang hiện tại
  const pageTests = filteredTests.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  // Xử lý trường hợp không tìm thấy kết quả nào (khi search hoặc lọc)
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

  // Ẩn tất cả các card trước khi đổ dữ liệu mới
  quizCards.forEach((card) => {
    card.style.display = "none";
    card.querySelector(".quiz-info").innerHTML = "";
  });

  // Đổ dữ liệu của trang hiện tại vào các card tương ứng
  pageTests.forEach((test, i) => {
    const card = quizCards[i];
    if (card) {
      let emoji = "📚";
      // Logic bóc tách tên danh mục: Xóa các ký tự emoji/đặc biệt ở đầu chuỗi để lấy tên gốc
      let categoryName = test.category.replace(/^[^a-zA-ZÀ-ỹ]*/, "");

      // Tìm emoji tương ứng từ danh sách categories đã lưu
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

  // Vẽ lại thanh điều hướng phân trang
  renderPagination(filteredTests);
};

// Hàm vẽ thanh phân trang (Số trang, nút Trước/Sau)
const renderPagination = (filteredTests) => {
  const paginationWrapper = document.querySelector(".pagination-wrapper");
  if (!paginationWrapper) return;

  const totalPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);

  // Nút quay lại (arrow)
  let html = `<button class="page-item arrow ${currentPage === 1 ? "disabled" : ""}" data-page="${currentPage - 1}"><</button>`;

  const maxVisible = 5; // Số lượng nút số tối đa hiển thị
  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

  // Hiển thị trang 1 và dấu "..." nếu danh sách quá dài
  if (startPage > 1) {
    html += `<button class="page-item" data-page="1">1</button>`;
    if (startPage > 2) html += "<span>...</span>";
  }

  // Các nút số trang ở giữa
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="page-item ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`;
  }

  // Hiển thị trang cuối và dấu "..." nếu cần
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += "<span>...</span>";
    html += `<button class="page-item" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Nút đi tiếp (arrow)
  html += `<button class="page-item arrow ${currentPage === totalPages ? "disabled" : ""}" data-page="${currentPage + 1}">></button>`;

  paginationWrapper.innerHTML = html;

  // Gán sự kiện click để đổi trang
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

  // Xử lý Menu trên thiết bị di động (Hamburger Menu)
  const hamburger = document.querySelector(".hamburger");
  const header = document.querySelector("header");
  const navLinks = document.querySelectorAll("nav a");

  const toggleMenu = () => {
    header.classList.toggle("nav-active");
    document.body.classList.toggle("menu-open");
    hamburger.setAttribute(
      "aria-expanded",
      header.classList.contains("nav-active"),
    );
  };

  const closeMenu = () => {
    header.classList.remove("nav-active");
    document.body.classList.remove("menu-open");
    hamburger.setAttribute("aria-expanded", "false");
  };

  if (hamburger) {
    hamburger.addEventListener("click", toggleMenu);
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Đóng menu khi nhấn phím Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && header.classList.contains("nav-active"))
      closeMenu();
  });

  // Logic phân quyền: Nếu là Admin thì tự động thêm link "Quản lý" vào Menu
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
        manageLink.addEventListener("click", closeMenu);
      }
    }
  }

  // Khởi tạo dữ liệu từ LocalStorage
  let categories = JSON.parse(localStorage.getItem("categories")) || [];
  let tests = JSON.parse(localStorage.getItem("tests")) || [];

  // Gán vào biến global để các hàm render bên ngoài có thể truy cập
  window.categories = categories;
  window.tests = tests;

  // Hiển thị bài test lần đầu tiên
  renderQuizGrid(tests);

  // Logic chọn bài test ngẫu nhiên (Tính năng "Chơi ngẫu nhiên")
  const playRandomQuestion = () => {
    const allTests = JSON.parse(localStorage.getItem("tests") || "[]");
    if (allTests.length === 0) {
      createToast("error", "Không có bài test nào");
      return;
    }

    const randomIndex = Math.floor(Math.random() * allTests.length);
    const randomTest = allTests[randomIndex];

    // Kiểm tra xem bài test được chọn có câu hỏi không trước khi chuyển trang
    const questionsData = JSON.parse(
      localStorage.getItem(`testQuestions_${randomTest.id}`) || "{}",
    );

    if (questionsData.questions && questionsData.questions.length > 0) {
      // Tăng lượt chơi cho bài test đó
      allTests[randomIndex].plays = (allTests[randomIndex].plays || 0) + 1;
      localStorage.setItem("tests", JSON.stringify(allTests));
      window.location.href = `./do-test.html?testId=${randomTest.id}`;
    } else {
      // Nếu bài test rỗng, đệ quy gọi lại để tìm bài khác
      playRandomQuestion();
    }
  };

  const randomBtn = document.querySelector(".btn-play-random");
  if (randomBtn) {
    randomBtn.addEventListener("click", playRandomQuestion);
  }

  // Xử lý khi click vào nút "Chơi ngay" trên từng card bài test
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

  // Logic tìm kiếm bài test theo tên (Real-time search)
  const searchInput = document.querySelector(".search-bar input");
  if (searchInput) {
    searchInput.oninput = (e) => {
      const filtered = tests.filter((t) =>
        t.name.toLowerCase().includes(e.target.value.toLowerCase()),
      );
      currentPage = 1; // Reset về trang 1 khi search
      renderQuizGrid(filtered);
    };
  }

  // Logic lọc bài test (Sắp xếp theo lượt chơi Tăng/Giảm)
  document.querySelectorAll(".btn-filter").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Thay đổi giao diện nút đang chọn
      document.querySelectorAll(".btn-filter").forEach((b) => {
        b.classList.remove("active");
        b.style.backgroundColor = "";
      });
      const clickedBtn = e.target.closest(".btn-filter");
      clickedBtn.classList.add("active");

      let filtered = [...tests];
      const sortType = clickedBtn.textContent;

      // Thực hiện sắp xếp dữ liệu
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
