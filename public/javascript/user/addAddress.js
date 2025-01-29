document
      .getElementById("billingAddressForm")
      .addEventListener("submit", async (event) => {
        event.preventDefault();

        const form = event.target;

        if (!form) {
          console.error("Form not found.");
          return;
        }

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
          const response = await fetch("/accountsettings/address/addaddress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formObject),
          });
          if (response.ok) {
            location.assign("/accountsettings/address");
            showNotification("Address saved successfully!");
          }

          const result = await response.json();
          if (result.limit) {
            console.log(result.limit);

            showNotification(result.limit, "error");
          }
        } catch (error) {
          console.error("Error:", error);
          showNotification(
            "Failed to save the address. Please try again."
          );
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
      location.assign("/accountsettings/address");
    }

    function validateForm(form) {
  let isValid = true;
  const requiredFields = ["name", "address", "city", "pincode", "state", "phone", "email"];

  requiredFields.forEach((field) => {
    const input = form.querySelector(`[name="${field}"]`);
    const errorSpan = input.nextElementSibling;

    if (input.value.trim() === '0'.repeat(input.value.trim().length)) {
      isValid = false;
      input.classList.add("border-red-500");
      if (errorSpan) errorSpan.textContent = `${field} cannot be all zeros.`;
    } else if (!input.value.trim()) {
      isValid = false;
      input.classList.add("border-red-500");
      if (errorSpan) errorSpan.textContent = `${field} is required.`;
    } else {
      input.classList.remove("border-red-500");
      if (errorSpan) errorSpan.textContent = "";
    }
  });

  const email = form.querySelector("[name='email']");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    isValid = false;
    email.classList.add("border-red-500");
    email.nextElementSibling.textContent = "Invalid email format.";
  }

  const phone = form.querySelector("[name='phone']");
  if (phone && !/^\d{10}$/.test(phone.value)) {
    isValid = false;
    phone.classList.add("border-red-500");
    phone.nextElementSibling.textContent = "Phone number must be 10 digits.";
  }

  return isValid;
}