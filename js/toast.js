/**
 * Hàm tạo thông báo nổi (Toast) trên màn hình
 */
const createToast = (type, customMsg = "") => {
  const container = document.getElementById("toast-container");
  const currentToasts = container.children;

  // Giới hạn số lượng thông báo hiển thị cùng lúc là 5 để tránh tràn màn hình
  if (currentToasts.length >= 5) {
    const firstToast = currentToasts[0];
    // Đợi thông báo cũ nhất biến mất rồi mới tạo thông báo mới (đệ quy)
    firstToast.addEventListener(
      "animationend",
      () => createToast(type, customMsg),
      { once: true },
    );
    return;
  }

  let title = "";
  let msg = customMsg || "";

  // Logic thiết lập tiêu đề và nội dung mặc định nếu không có customMsg
  if (!msg) {
    if (type === "success") {
      title = "Thành công";
      msg = "Thao tác hoàn tất.";
    } else if (type === "error") {
      title = "Lỗi";
      msg = "Có lỗi xảy ra.";
    }
  } else {
    // Nếu có customMsg, chỉ cần đặt tiêu đề dựa theo loại (type)
    title = type === "success" ? "Thành công" : "Lỗi";
  }

  // Tạo phần tử HTML cho Toast
  const toast = document.createElement("div");
  toast.className = `toast ${type}`; // Thêm class để định dạng màu sắc (xanh/đỏ)

  const html = `
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-msg">${msg}</span>
    </div>
    <span class="toast-close">&times;</span>
    <div class="progress"></div> 
  `; // .progress dùng để hiển thị thanh thời gian chạy ngược phía dưới

  toast.innerHTML = html;
  container.appendChild(toast);

  // Tự động đóng thông báo sau 1.5 giây
  const autoClose = setTimeout(() => {
    removeToast(toast);
  }, 1500);

  // Xử lý khi người dùng nhấn nút đóng (x) thủ công
  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.onclick = () => {
    clearTimeout(autoClose); // Hủy đếm ngược tự động đóng nếu người dùng đã đóng thủ công
    removeToast(toast);
  };
};

/**
 * Hàm xử lý xóa bỏ phần tử Toast khỏi giao diện
 */
const removeToast = (toastElement) => {
  // Tránh việc gọi hàm xóa nhiều lần trên cùng một phần tử
  if (toastElement.classList.contains("hide")) {
    return;
  }

  // Thêm class 'hide' để kích hoạt animation mờ dần (fadeOut) trong CSS
  toastElement.classList.add("hide");

  // Lắng nghe sự kiện kết thúc animation trước khi thực sự xóa phần tử khỏi DOM
  toastElement.addEventListener("animationend", (e) => {
    // Chỉ xóa khi animation 'fadeOut' kết thúc
    if (e.animationName === "fadeOut") {
      toastElement.remove();
    }
  });
};
