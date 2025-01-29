const form = document.querySelector("form");
const nameInput = document.getElementById("login-name");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const confirmPasswordInput = document.getElementById("login-password-confirm");
const loadingSpinner = document.getElementById("loading-spinner"); // Select the spinner element
const buttonText = document.getElementById("button-text");

const errorName = document.getElementById("error-name");
const errorEmail = document.getElementById("error-email");
const errorPassword = document.getElementById("error-password");
const errorConfirmPassword = document.getElementById("error-password-confirm");

const togglePasswordVisibility = document.getElementById(
  "toggle-password-visibility"
);
const toggleConfirmPasswordVisibility = document.getElementById(
  "toggle-confirm-password-visibility"
);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

togglePasswordVisibility.addEventListener("click", () => {
  const isPasswordVisible = passwordInput.type === "text";
  passwordInput.type = isPasswordVisible ? "password" : "text";

  const icon = togglePasswordVisibility.querySelector("i");
  icon.classList.toggle("bi-eye-slash", isPasswordVisible);
  icon.classList.toggle("bi-eye", !isPasswordVisible);
});

toggleConfirmPasswordVisibility.addEventListener("click", () => {
  const isPasswordVisible = confirmPasswordInput.type === "text";
  confirmPasswordInput.type = isPasswordVisible ? "password" : "text";

  const icon = toggleConfirmPasswordVisibility.querySelector("i");
  icon.classList.toggle("bi-eye-slash", isPasswordVisible);
  icon.classList.toggle("bi-eye", !isPasswordVisible);
});
const validateName = () => {
  const name = nameInput.value.trim();
  if (!name || name.length < 3) {
    errorName.textContent = "Name must be at least 3 characters long.";
    nameInput.classList.add("border-red-500");
    return false;
  }
  errorName.textContent = "";
  nameInput.classList.remove("border-red-500");
  return true;
};

const validateEmail = () => {
  const email = emailInput.value.trim();
  if (!emailPattern.test(email)) {
    errorEmail.textContent = "Please enter a valid email address.";
    emailInput.classList.add("border-red-500");
    return false;
  }
  errorEmail.textContent = "";
  emailInput.classList.remove("border-red-500");
  return true;
};

const validatePassword = () => {
  const password = passwordInput.value.trim();
  if (!passwordPattern.test(password)) {
    errorPassword.textContent =
      "Password must be at least 8 characters, include an uppercase letter, a number, and a special character.";
    passwordInput.classList.add("border-red-500");
    return false;
  }
  errorPassword.textContent = "";
  passwordInput.classList.remove("border-red-500");
  return true;
};

const validateConfirmPassword = () => {
  const password = passwordInput.value.trim();
  const confirmPassword = confirmPasswordInput.value.trim();
  if (password !== confirmPassword) {
    errorConfirmPassword.textContent = "Passwords do not match.";
    confirmPasswordInput.classList.add("border-red-500");
    return false;
  }
  errorConfirmPassword.textContent = "";
  confirmPasswordInput.classList.remove("border-red-500");
  return true;
};

// Real-time validation
nameInput.addEventListener("input", validateName);
emailInput.addEventListener("input", validateEmail);
passwordInput.addEventListener("input", validatePassword);
confirmPasswordInput.addEventListener("input", validateConfirmPassword);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const isNameValid = validateName();
  const isEmailValid = validateEmail();
  const isPasswordValid = validatePassword();
  const isConfirmPasswordValid = validateConfirmPassword();

  if (
    isNameValid &&
    isEmailValid &&
    isPasswordValid &&
    isConfirmPasswordValid
  ) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");

      const requestBody = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value.trim(),
      };

      if (ref) {
        requestBody.ref = ref;
      }

      loadingSpinner.classList.remove("hidden");
      buttonText.classList.add("hidden");
      const result = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const fetchResult = await result.json();

      if (fetchResult.err) {
        loadingSpinner.classList.add("hidden");
        buttonText.classList.remove("hidden");
        errorPassword.textContent = fetchResult.err.password || "";
        errorName.textContent = fetchResult.err.username || "";
        errorEmail.textContent = fetchResult.err.email || "";
      } else if (fetchResult.otpsend) {
        location.assign("/emailotp");
      } else if (fetchResult.message) {
        errorEmail.textContent = fetchResult.message || "";
        loadingSpinner.classList.add("hidden"); // Hide on error as well
        buttonText.classList.remove("hidden");
      }
    } catch (error) {
      console.log("An error occurred:", error);
    }
  }
});
