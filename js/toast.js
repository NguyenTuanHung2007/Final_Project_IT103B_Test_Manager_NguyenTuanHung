const createToast = (type, customMsg = "") => {
  const container = document.getElementById("toast-container");
  const currentToasts = container.children;
  if (currentToasts.length >= 5) {
    const firstToast = currentToasts[0];
    firstToast.addEventListener(
      "animationend",
      () => createToast(type, customMsg),
      { once: true },
    );
    return;
  }

  let title = "";
  let msg = customMsg || "";

  if (!msg) {
    if (type === "success") {
      title = "Thành công";
      msg = "Thao tác hoàn tất.";
    } else if (type === "error") {
      title = "Lỗi";
      msg = "Có lỗi xảy ra.";
    }
  } else {
    title = type === "success" ? "Thành công" : "Lỗi";
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const html = `
    <div class="toast-content">
      <span class="toast-title">${title}</span>
      <span class="toast-msg">${msg}</span>
    </div>
    <span class="toast-close">&times;</span>
    <div class="progress"></div>
  `;

  toast.innerHTML = html;

  container.appendChild(toast);

  const autoClose = setTimeout(() => {
    removeToast(toast);
  }, 1500);

  const closeBtn = toast.querySelector(".toast-close");
  closeBtn.onclick = () => {
    clearTimeout(autoClose);
    removeToast(toast);
  };
};

const removeToast = (toastElement) => {
  if (toastElement.classList.contains("hide")) {
    return;
  }

  toastElement.classList.add("hide");

  toastElement.addEventListener("animationend", (e) => {
    if (e.animationName === "fadeOut") {
      toastElement.remove();
    }
  });
};
