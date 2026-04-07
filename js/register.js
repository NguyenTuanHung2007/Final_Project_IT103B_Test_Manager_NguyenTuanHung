const users = JSON.parse(localStorage.getItem("users")) || [];
const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Lấy dữ liệu từ input
  const originalFullname = document.getElementById("fullname").value;
  const fullname = originalFullname.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Reset thông báo lỗi
  document
    .querySelectorAll(".error-message")
    .forEach((el) => (el.innerText = ""));
  let isValid = true;

  const nameError = document.getElementById("nameError");

  // Validate lead/trail spaces
  if (originalFullname !== fullname) {
    nameError.innerText += "Tên không được có khoảng trắng đầu hoặc cuối; ";
    isValid = false;
  }

  //1. Validate Họ tên (Fullname)
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

  //2. Validate Email
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

  //3. Validate Mật khẩu
  if (!password) {
    document.getElementById("passwordError").innerText =
      "Mật khẩu không được để trống";
    isValid = false;
  } else if (password.length < 8) {
    document.getElementById("passwordError").innerText =
      "Mật khẩu phải có tối thiểu 8 ký tự";
    isValid = false;
  }

  //4. Validate Xác nhận mật khẩu
  if (!confirmPassword) {
    document.getElementById("confirmPasswordError").innerText =
      "Vui lòng xác nhận mật khẩu";
    isValid = false;
  } else if (confirmPassword !== password) {
    document.getElementById("confirmPasswordError").innerText =
      "Mật khẩu xác nhận không trùng khớp";
    isValid = false;
  }

  // Validate nếu tên hoặc email đã được đăng ký hay chưa
  if (isValid) {
    const isExistUser = users.find((user) => user.fullname === fullname);
    if (isExistUser) {
      nameError.innerText += "Tên người dùng này đã được đăng ký";
      isValid = false;
    }

    const isExistEmail = users.find((user) => user.email === email);
    if (isExistEmail) {
      document.getElementById("emailError").innerText +=
        "Email này đã được đăng ký";
      isValid = false;
    }
  }

  if (isValid) {
    createToast("success", "Đăng kí thành công");

    setTimeout(() => {
      const newUser = {
        id: Date.now(),
        fullname: fullname,
        email: email,
        password: password,
        role: "admin", //"admin" là để chuyển sang trang admin
      };

      users.push(newUser);
      localStorage.setItem("users", JSON.stringify(users));
      window.location.href = "../pages/login.html";
    }, 2000);
  } else {
    createToast("error", "Vui lòng nhập đúng thông tin");
  }
});
