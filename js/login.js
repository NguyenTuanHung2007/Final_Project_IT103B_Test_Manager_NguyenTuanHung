// Lấy danh sách tài liệu người dùng từ LocalStorage, nếu không có thì mặc định là mảng rỗng
const users = JSON.parse(localStorage.getItem("users")) || [];
const loginForm = document.getElementById("loginForm");

// Lắng nghe sự kiện gửi form (submit)
loginForm.addEventListener("submit", (e) => {
  // Ngăn chặn hành động mặc định của form (không cho trang load lại)
  e.preventDefault();

  // Lấy giá trị từ các ô nhập liệu
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Xóa bỏ tất cả các thông báo lỗi cũ trên giao diện trước khi kiểm tra mới
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.innerText = ""));

  // Logic kiểm tra tài khoản: Tìm trong mảng 'users' người dùng có email và mật khẩu khớp hoàn toàn
  const user = users.find((u) => u.email === email && u.password === password);

  if (user) {
    createToast("success", "Đăng nhập thành công");

    // Đợi 2 giây để người dùng kịp nhìn thấy thông báo thành công trước khi chuyển trang
    setTimeout(() => {
      // Lưu thông tin người dùng hiện tại vào LocalStorage để các trang khác biết ai đang đăng nhập
      localStorage.setItem("currentUser", JSON.stringify(user));

      // Nếu là Admin thì đưa vào trang quản lý, nếu là người dùng thường thì đưa vào trang chủ bài test
      if (user.role === "admin") {
        window.location.href = "../pages/category-manager.html";
      } else {
        window.location.href = "../pages/home.html";
      }
    }, 1500);
  } else {
    // Hiển thị thông báo lỗi cụ thể tại ô mật khẩu và hiện thông báo Toast
    document.getElementById("loginPassError").innerText =
      "Email hoặc mật khẩu không đúng";
    createToast("error", "Vui lòng nhập đúng thông tin");
  }
});
