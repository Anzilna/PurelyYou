document.addEventListener("DOMContentLoaded", () => {
    const errorEmail = document.getElementById("error-email-confirm");

    document
      .getElementById("submit-btn")
      .addEventListener("click", async (e) => {
        errorEmail.textContent = "";
        e.preventDefault();

        const email = document.getElementById("email-otp").value.trim();

        if (!email) {
          errorEmail.textContent = "Please enter an email";
          return;
        }

        try {
          const fetchResult = await fetch("/forgotpassword", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          const fetchResultJson = await fetchResult.json();

          if (fetchResultJson.message) {
            errorEmail.textContent = fetchResultJson.message || "";
          }
          if (fetchResultJson.otpsend) {
            location.assign(`/emailotp?value=forgotpassword`);
          }
          if (fetchResultJson.newpassword) {
            location.assign(`/newpassword`);
          }
        } catch (error) {
          console.log("Error in fetch request:", error);
        }
      });
  });