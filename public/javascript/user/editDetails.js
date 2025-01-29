document
.getElementById("editDetailsForm")
.addEventListener("submit", async (event) => {
  event.preventDefault();

  const form = event.target;

  if (!validateForm(form)) {
    showNotification("Please correct the highlighted fields.");
    return;
  }

  const formData = new FormData(form);
  const formObject = {};
  formData.forEach((value, key) => {
    formObject[key] = value;
  });

  try {
    const response = await fetch("/accountsettings/mydetailsedit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formObject),
    });

    if (response.ok) {
      location.assign("/accountsettings");
      showNotification("Details updated successfully!");
    } else {
      const result = await response.json();
      showNotification(result.message || "Failed to update details.");
    }
  } catch (error) {
    console.error("Error:", error);
    showNotification("Failed to update details. Please try again.");
  }
});

function showNotification(message) {
const notification = document.getElementById("notification");

notification.className = "";

notification.classList.add(
  "p-4",
  "mb-4",
  "text-sm",
  "rounded-lg",
  "fixed",
  "bottom-10",
  "right-4",
  "z-50",
  "min-w-[150px]",
  "text-white",
  "bg-black",
  "dark:bg-gray-800",
  "dark:text-green-400",
  "role",
  "alert"
);

notification.innerHTML = ` ${message}`;

notification.classList.remove("hidden");

setTimeout(() => {
  hideNotification();
}, 5000);
}

function hideNotification() {
const notification = document.getElementById("notification");
notification.className = "hidden";
}

function cancel() {
location.assign("/accountsettings");
}

function validateForm(form) {
let isValid = true;
const requiredFields = ["name", "phone", "dob"];

requiredFields.forEach((field) => {
  const input = form.querySelector(`[name="${field}"]`);
  const errorSpan = input.nextElementSibling;

  if (!input.value.trim()) {
    isValid = false;
    input.classList.add("border-red-500");
    if (errorSpan) errorSpan.textContent = `${field} is required.`;
  } else {
    input.classList.remove("border-red-500");
    if (errorSpan) errorSpan.textContent = "";
  }

  input.addEventListener("input", () => {
    input.classList.remove("border-red-500");
    if (errorSpan) errorSpan.textContent = "";
  });
});

const phone = form.querySelector("[name='phone']");
if (phone && !/^\d{10}$/.test(phone.value)) {
  isValid = false;
  phone.classList.add("border-red-500");
  phone.nextElementSibling.textContent =
    "Phone number must be 10 digits.";
}

return isValid;
}