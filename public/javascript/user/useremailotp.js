document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const resendotp = document.getElementById("resendotp");
    const timer = document.getElementById("timer");
    const timermain = document.getElementById("timermain");
    const otperror = document.getElementById("error-otp-confirm");
    let queryParams;
    if (window.location.search) {
      queryParams = window.location.search;
    }
    resendotptimer();
    function resendotptimer() {

      let countDown = 30;
      const newCountdown = setInterval(() => {
        timer.textContent = `${countDown.toString().padStart(2, "0")}`;
        countDown--;

        if (countDown < 0) {
          clearInterval(newCountdown);
          timermain.style.display = "none";
          resendotp.style.display = "block";
        }
      }, 1000);
    }
    form.addEventListener("submit", async (e) => {
      let UrlToPost = "/emailotp";
      if (queryParams) {
        UrlToPost = `/emailotp${queryParams}`;
      }
      e.preventDefault();
      otperror.textContent = "";
      const userentredotp = document.getElementById("login-otp").value;
      if (!/^\d+$/.test(userentredotp)) {
        otperror.textContent = "Please enter a valid numeric OTP.";
        otperror.style.color = "red";
        return;
      }
      try {
        const fetchresult = await fetch(UrlToPost, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userentredotp }),
        });

        const result = await fetchresult.json();
        if (result.message) {
          otperror.textContent = result.message || "";
          otperror.style.color = "red";
        }
        if (result.login) {
          location.assign("/login");
        }
        if (result.newpassword) {
          location.assign("/newpassword");
        }
      } catch (error) {
        console.log(error);
      }
    });

    const sendagainid = document.getElementById("sendagain");
    sendagainid.addEventListener("click", async (e) => {
      e.preventDefault();
      let UrlToPost = "/newemailotp";
      if (queryParams) {
        UrlToPost = `/newemailotp${queryParams}`;
      }
      try {
        const result = await fetch(UrlToPost, {
          method: "post",
        });

        if(result.ok){
          const jsonresult = await result.json();
        if (jsonresult.otp) otperror.textContent = jsonresult.otp || "";
        otperror.style.color = "green";
        }
       
      } catch (error) {
        console.log("error in otp new fetch");
      }
    });
  });