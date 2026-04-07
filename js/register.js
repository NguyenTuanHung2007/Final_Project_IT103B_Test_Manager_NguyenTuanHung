// Lấy danh sách người dùng từ LocalStorage để kiểm tra trùng lặp
const users = JSON.parse(localStorage.getItem("users")) || [];
const registerForm = document.getElementById("registerForm");

// Lắng nghe sự kiện khi người dùng nhấn nút Đăng ký
registerForm.addEventListener("submit", (e) => {
  // Ngăn chặn trình duyệt tải lại trang
  e.preventDefault();

  // Lấy dữ liệu từ các ô nhập liệu
  const originalFullname = document.getElementById("fullname").value;
  const fullname = originalFullname.trim(); // Loại bỏ khoảng trắng thừa ở hai đầu
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Xóa sạch các thông báo lỗi cũ trước khi bắt đầu kiểm tra mới
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.innerText = ""));

  let isValid = true; // Biến đánh dấu xem form có hợp lệ hay không
  const nameError = document.getElementById("nameError");

  // Kiểm tra nếu người dùng cố tình nhập khoảng trắng ở đầu hoặc cuối tên
  if (originalFullname !== fullname) {
    nameError.innerText += "Tên không được có khoảng trắng đầu hoặc cuối; ";
    isValid = false;
  }

  // 1. Kiểm tra tính hợp lệ của Họ và tên (Fullname)
  // Regex này yêu cầu: Chỉ chứa chữ cái từ a-z, A-Z (không dấu, không khoảng trắng)
  const nameRegex = /^[a-zA-Z]+$/;
  let nameErrors = [];

  if (!fullname) {
    nameErrors.push("Họ và tên không được trống hoặc chỉ chứa khoảng trắng");
  } else if (fullname.length < 5) {
    nameErrors.push("Họ và tên phải có tối thiểu 5 ký tự");
  } else if (!nameRegex.test(fullname)) {
    nameErrors.push(
      "Họ và tên không được có dấu, không chứa khoảng trắng hoặc ký tự lạ",
    );
  }

  if (nameErrors.length > 0) {
    nameError.innerText += nameErrors.join(", ");
    isValid = false;
  }

  // 2. Kiểm tra tính hợp lệ của Email bằng Regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    document.getElementById("emailError").innerText =
      "Email không được để trống";
    isValid = false;
  } else if (!emailRegex.test(email)) {
    document.getElementById("emailError").innerText =
      "Email không đúng định dạng";
    isValid = false;
  }

  // 3. Kiểm tra độ dài Mật khẩu
  if (!password) {
    document.getElementById("passwordError").innerText =
      "Mật khẩu không được để trống";
    isValid = false;
  } else if (password.length < 8) {
    document.getElementById("passwordError").innerText =
      "Mật khẩu phải có tối thiểu 8 ký tự";
    isValid = false;
  }

  // 4. Kiểm tra Xác nhận mật khẩu (phải trùng khớp với mật khẩu đã nhập)
  if (!confirmPassword) {
    document.getElementById("confirmPasswordError").innerText =
      "Vui lòng xác nhận mật khẩu";
    isValid = false;
  } else if (confirmPassword !== password) {
    document.getElementById("confirmPasswordError").innerText =
      "Mật khẩu xác nhận không trùng khớp";
    isValid = false;
  }

  // Sau khi qua các bước kiểm tra định dạng, tiếp tục kiểm tra trùng lặp trong "Cơ sở dữ liệu" (LocalStorage)
  if (isValid) {
    // Kiểm tra xem tên đăng nhập này đã có người dùng chưa
    const isExistUser = users.find((user) => user.fullname === fullname);
    if (isExistUser) {
      nameError.innerText += "Tên người dùng này đã được đăng ký";
      isValid = false;
    }

    // Kiểm tra xem email này đã được sử dụng chưa
    const isExistEmail = users.find((user) => user.email === email);
    if (isExistEmail) {
      document.getElementById("emailError").innerText +=
        "Email này đã được đăng ký";
      isValid = false;
    }
  }

  // Nếu tất cả các điều kiện trên đều thỏa mãn (isValid vẫn là true)
  if (isValid) {
    createToast("success", "Đăng kí thành công");

    // Đợi 2 giây để hiển thị thông báo rồi mới thực hiện lưu và chuyển hướng
    setTimeout(() => {
      const newUser = {
        id: Date.now(), // Sử dụng timestamp làm ID duy nhất
        fullname: fullname,
        email: email,
        password: password,
        role: "admin", // Mặc định gán quyền admin (theo logic code của bạn)
      };

      // Thêm người dùng mới vào mảng và cập nhật lại LocalStorage
      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));

      // Chuyển hướng sang trang đăng nhập
      window.location.href = "../pages/login.html";
    }, 1500);
  } else {
    // Nếu có bất kỳ lỗi nào, hiển thị thông báo lỗi tổng quát
    createToast("error", "Vui lòng nhập đúng thông tin");
  }
});
