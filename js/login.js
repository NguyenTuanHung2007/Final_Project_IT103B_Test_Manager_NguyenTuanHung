const users = JSON.parse(localStorage.getItem("users")) || [];
const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.innerText = ""));

  // Tìm user khớp email và pass
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    createToast("success", "Đăng nhập thành công");

    setTimeout(() => {
      // Lưu thông tin user đang đăng nhập
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Phân quyền điều hướng
      if (user.role === "admin") {
        window.location.href = "../pages/category-manager.html"; // Trang quản lý danh mục
      } else {
        window.location.href = "../pages/home.html"; // Trang chủ
      }
    }, 2000);
  } else {
    document.getElementById("loginPassError").innerText =
      "Email hoặc mật khẩu không đúng";
    createToast("error", "Vui lòng nhập đúng thông tin");
  }
});
