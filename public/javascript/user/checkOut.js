fetchCheckoutData();
const lastTotalAmountElement = document.getElementById("last-total-amount");
const addressesElement = document.getElementById("addresses-data");
const addressList = JSON.parse(addressesElement.getAttribute("data-addresses"));
console.log("Address List:", addressList);

const addressRadios = document.querySelectorAll('input[name="billingAddress"]');
const defaultCheckedRadio = document.querySelector(
  'input[name="billingAddress"]:checked'
);
if (defaultCheckedRadio) {
  updateAddressPreview(defaultCheckedRadio.value);
}

addressRadios.forEach((radio) => {
  radio.addEventListener("change", function () {
    console.log("Radio selected:", this.value);
    const selectedAddressId = this.value;
    updateAddressPreview(selectedAddressId);
  });
});

function updateAddressPreview(addressId) {
  const selectedAddressPreview = document.getElementById(
    "selected-address-preview"
  );
  const selectedAddress = addressList.addresses.find(
    (addr) => addr._id === addressId
  );

  if (selectedAddress) {
    selectedAddressPreview.innerHTML = `
    <div class="flex flex-col">
      <p class="text-sm mt-3 mb-1 font-medium">Selected Address:</p>
      <p class="text-xs text-gray-700">${selectedAddress.name}</p>
      <p class="text-xs text-gray-700">${selectedAddress.address}</p>
      <p class="text-xs text-gray-700">${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.pincode}</p>
      <p class="text-xs text-gray-700">${selectedAddress.phone}</p>
      <p class="text-xs text-gray-700">${selectedAddress.email}</p>
    </div>
  `;
  } else {
    selectedAddressPreview.innerHTML = `<p class="text-sm text-gray-500">No address selected.</p>`;
  }
}

const cartData = document.getElementById("cart-data");
var totalAmount = parseFloat(cartData.getAttribute("data-total-amount"));
let totalDiscount = parseFloat(cartData.getAttribute("data-total-discount"));
let deliveryCharge = parseFloat(cartData.getAttribute("data-delivery-charge"));
let finalOrderAmount = totalAmount - totalDiscount + deliveryCharge;

console.log("totallllllll", finalOrderAmount);

const username = cartData.getAttribute("data-username");
const email = cartData.getAttribute("data-email");
const couponDiscountDiv = document.getElementById("coupondiscountamountdiv");
let OrderCoupponCode = "";
let OrderCoupponDiscountedValue = "";
let OrderCoupponID = "";

console.log("Total Amount:", totalAmount);
console.log("Total Discount:", totalDiscount);
console.log("Delivery Charge:", deliveryCharge);
console.log("Username:", username);
console.log("Email:", email);

async function fetchCheckoutData() {
  const itemsDetails = document.getElementById("itemsdetails");
  try {
    const response = await fetch("/shoppingcart/checkoutfetch", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Checkout Data:", data);
    itemsDetails.innerHTML = data.cart.items
      .map((item) => {
        return `
  <div id="itemsdisplay" class="flex flex-col gap">
    <div class="flex flex-row gap-3 m-2">
      <div class="flex-[1]">
        <img
          src="${item.productId.images[0]}"
          class="h-full w-full"
          alt="${item.productId.productname}"
        />
      </div>
      <div class="flex-[6]">
        <div class="flex flex-col h-full w-full">
          <div
            class="flex-[2] flex justify-start flex-col gap-[1px] items-start"
          >
            <div class="text-sm lg:text-lg font-medium">
              ${item.productId.productname}
            </div>
            <div class="text-xs font-medium">
              Rs.${item.productId.saleprice}
            </div>
          </div>
          <div
            class="flex-[5] flex justify-end flex-col align-bottom"
          >
            <div class="flex">
              <div
                class="flex-[2] flex text-xs font-normal justify-start flex-col"
              >
                <div>Quantity</div>
                <div>Regular Price</div>
                <div>Total</div>
              </div>
              <div
                class="flex-[5] text-xs font-normal flex justify-start flex-col"
              >
                <div>${item.quantity}</div>
                <div>Rs.${item.regularprice}</div>
                <div>Rs.${item.saleprice}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;
      })
      .join("");
  } catch (error) {
    console.error("Error fetching checkout data:", error);
  }
}

document
  .getElementById("complete-btn")
  .addEventListener("click", async function () {
    const selectedAddress = document.querySelector(
      'input[name="billingAddress"]:checked'
    )?.value;

    const paymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value;

    console.log("Selected Address:", selectedAddress);
    console.log("Selected Payment Method:", paymentMethod);

    if (!selectedAddress || !paymentMethod) {
      showNotification("Please select both address and payment method.");

      return;
    }
    if (paymentMethod.includes("Cash on Delivery") && totalAmount > 1000) {
      return showNotification(
        "Cash on delivery is unavailable for orders above 1000. please select other paymentMethod."
      );
    }

    console.log("Final Amount:", finalOrderAmount);

    const orderData = {
      totalAmount: finalOrderAmount,
      totalDiscount,
      deliveryCharge,
      paymentMethod: paymentMethod,
      userInfo: {
        username: username,
        email: email,
      },
      addressId: selectedAddress,
    };

    if (OrderCoupponCode && OrderCoupponDiscountedValue && OrderCoupponID) {
      orderData.coupponCode = OrderCoupponCode;
      orderData.coupponDiscount = OrderCoupponDiscountedValue;
      orderData.coupponId = OrderCoupponID;
    }
    if (paymentMethod.includes("Razorpay")) {
      console.log("Inside Razorpay");

      try {
        const response = await fetch("/razorpay/createorder", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: finalOrderAmount,
            currency: "INR",
            orderData,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const { pendingOrder, razorpayOrder, key_id } = await response.json();

        const options = {
          key: key_id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: "PurelyYou",
          description: "Test Transaction",
          order_id: razorpayOrder.id,
          handler: async function (response) {
            console.log("Payment successful!", response);

            showNotification("Payment successful! Verifying your payment...");

            try {
              const verifyResponse = await fetch("/razorpay/verifypayment", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  pendingOrderId: pendingOrder._id,
                }),
              });
              const { order, success } = await verifyResponse.json();

              if (verifyResponse.ok && success) {
                showNotification(
                  "Payment verified successfully! Thank you for your purchase."
                );
                location.assign(
                  `/shoppingcart/checkout/orderplaced/${order._id}`
                );
              } else {
                showNotification(
                  "Payment verification failed. Please contact support."
                );

                console.error("Payment verification failed:");
              }
            } catch (error) {
              console.error("Error verifying payment:", error);
              showNotification(
                "An error occurred during payment verification. Please try again"
              );
            }
          },
          prefill: {
            name: username,
            email: email,
            contact: "9999999999",
          },
          theme: {
            color: "#3399cc",
          },
          notes: {
            address: "Razorpay HQ",
          },
          modal: {
            ondismiss: function () {
              console.log("Payment process closed by the user.");
            },
          },
        };

        options.method = ["card", "netbanking", "wallet", "upi"];

        const rzp = new Razorpay(options);
        rzp.open();

        rzp.on("payment.failed", function (response) {
          console.error("Payment failed:", response.error);
          showNotification("Payment failed. Please try again.");
        });
      } catch (error) {
        console.error("Error occurred while making Razorpay API call:", error);
      }
    } else {
      console.log("Order Data:", orderData);

      try {
        const response = await fetch("/shoppingcart/checkout/order", {
          method: "POST",
          body: JSON.stringify(orderData),
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (response.ok) {
          console.log("Order completed successfully:", data);
          showNotification(data.message);
          location.assign(
            `/shoppingcart/checkout/orderplaced/${data.order._id}`
          );
        } else {
          console.error("Error completing order:", data);
          showNotification(data.error);
        }
      } catch (error) {
        console.error("An error occurred:", error);
        showNotification("An error occurred while processing your order.");
      }
    }
  });

// Apply coupon functionality
const applyCouponBtn = document.getElementById("apply-coupon-btn");
const couponDropdown = document.getElementById("coupon-dropdown");

applyCouponBtn.addEventListener("click", function () {
  couponDropdown.classList.toggle("hidden");
});

const submitCouponBtn = document.getElementById("submit-coupon");
const couponCodeInput = document.getElementById("coupon-code");
const couponError = document.getElementById("coupon-error");

submitCouponBtn.addEventListener("click", async function () {
  const couponCode = couponCodeInput.value.trim();
  const finalAmount = totalAmount - totalDiscount + deliveryCharge;
  const couponContainer = document.getElementById("coupon-container");
  const couponCodeElement = document.getElementById("coupon-code");

  if (couponCode) {
    try {
      couponError.classList.add("hidden");

      const response = await fetch("/shoppingcart/checkout/couponapply", {
        method: "POST",
        body: JSON.stringify({ couponCode, finalAmount }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok) {
        showNotification(data.message);
        couponContainer.classList.remove("hidden");
        couponContainer.innerHTML = `
<span class="text-sm font-medium text-white">Coupon Applied: <strong id="coupon-code" class="text-white">${data.couponCode}</strong></span>
<button id="close-coupon-btn" class="text-white hover:text-gray-300 font-bold text-lg focus:outline-none">
&times;
</button>`;
        couponDiscountDiv.classList.remove("hidden");
        couponDiscountDiv.innerHTML = `
<p>Couppon Discount</p>
              <p class="text-red-600">
                Rs. -${data.reductionAmount}
              </p>
`;
        const closeCouponBtn = document.getElementById("close-coupon-btn");
        lastTotalAmountElement.innerHTML = `
<p>Total</p>
            <p >
              Rs. ${data.discountedAmount}
            </p>
`;
        finalOrderAmount = data.discountedAmount;
        OrderCoupponDiscountedValue = data.reductionAmount;
        OrderCoupponCode = data.couponCode;
        OrderCoupponID = data.couponId;

        closeCouponBtn.addEventListener("click", function () {
          couponContainer.classList.add("hidden");
          couponCodeInput.value = "";
          couponDiscountDiv.classList.add("hidden");
          OrderCoupponDiscountedValue = "";
          OrderCoupponCode = "";
          OrderCoupponID = "";

          lastTotalAmountElement.innerHTML = `
<p>Total</p>
            <p >
              Rs. ${data.originalAmount}
            </p>
`;
          finalOrderAmount = data.originalAmount;
        });
      } else {
        showError(data.message);
        showNotification(data.message);
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      showError("An error occurred while applying the coupon.");
    }
  } else {
    showError("Please enter a coupon code.");
  }
});

function showError(message) {
  couponError.textContent = message;
  couponError.classList.remove("hidden");
}

function toggleDropdown(id) {
  const element = document.getElementById(id);
  if (element) {
    console.log("Toggling dropdown visibility for:", id);
    element.classList.toggle("hidden");
  } else {
    console.log("Element not found for toggle:", id);
  }
}


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

function showPaymentDetails(showId, hideIds) {
  const showElement = document.getElementById(showId);
  const hideElements = hideIds.map((id) => document.getElementById(id));

  if (showElement) {
    console.log("Showing payment details for:", showId);
    showElement.classList.remove("hidden");
  } else {
    console.log("Element not found for show payment details:", showId);
  }

  hideElements.forEach((element) => {
    if (element) {
      console.log("Hiding element:", element.id);
      element.classList.add("hidden");
    }
  });
}

const addressesDataDiv = document.getElementById("addresses-data");

const addressesDataString = addressesDataDiv.getAttribute("data-addresses");

let addressesData;
try {
  addressesData = JSON.parse(addressesDataString);
  console.log("address", addressesData);
} catch (error) {
  console.error("Error parsing addresses data:", error);
}
renderAddressDetails(addressesData.addresses);

function renderAddressDetails(addresses) {
  const addressBox = document.getElementById("address-box");

  if (!addressBox) {
    console.error("Address box element not found.");
    return;
  }

  const addressHTML = `
<div class="flex justify-between" onclick="toggleDropdown('billingadress')">
  <div>Address</div>
  <a href="#" class="underline">Select</a>
</div>
<div id="selected-address-preview">
</div>
<div id="billingadress" class="hidden mt-3">
  <label class="block text-sm font-medium text-black mb-3">Select Address</label>
  <div>
    ${
      addresses && addresses.length > 0
        ? addresses
            .map(
              (addr, index) => `
      <div class="flex justify-between">
        <div class="flex items-center mb-3">
          <input 
            type="radio" 
            id="address-${index}" 
            name="billingAddress" 
            value="${addr._id}" 
            ${index === addresses.length - 1 ? "checked" : ""} 
            class="mr-2 accent-black" 
            onclick="showSelectedAddressPreview('${addr._id}')"
          />
          <label for="address-${index}" class="text-sm text-gray-700">
            <div>${addr.name}</div>
            <div>${addr.address}</div>
            <div>${addr.city}, ${addr.state}, ${addr.pincode}</div>
            <div>${addr.phone}</div>
            <div>${addr.email}</div>
          </label>
        </div>
        <div>
          <i class="bi bi-pencil" onclick="editAddress('${addr._id}')"></i>
        </div>
      </div>`
            )
            .join("")
        : "<p>No addresses available.</p>"
    }
  </div>
  <div>
    <button
      class="bg-black text-white px-4 py-2 my-2"
      id="addaddressboxbtn"
      onclick="toggleAddressBox()"
    >
      Add New Address
      <span class="icon">
        <i class="bi bi-plus-lg font-extrabold text-white"></i>
      </span>
    </button>
  </div>
  <div class="grid grid-cols-12 gap-7 hidden" id="addaddressbox">
    <div class="col-span-12 bg-white">
      <div class="grid grid-cols-1 gap-3">
        <div class="flex text-sm justify-start font-medium">Add Address</div>
        <div class="flex flex-col">
        <form id="billingAddressForm">
<div class="flex flex-col gap-2">
<div>
  <label for="name" class="text-sm">Name</label>
  <input class="w-full border p-2" type="text" id="name" name="name" />
  <span class="text-red-500 text-xs"></span>
</div>
<div>
  <label for="address" class="text-sm">Address</label>
  <input class="w-full border p-2" type="text" id="address" name="address" />
  <span class="text-red-500 text-xs"></span>
</div>
<div class="flex gap-3 justify-between">
  <div class="flex-grow">
    <label for="city" class="text-sm">City</label>
    <input class="w-full border p-2" type="text" id="city" name="city" />
    <span class="text-red-500 text-xs"></span>
  </div>
  <div class="flex-grow">
    <label for="pincode" class="text-sm">Pincode</label>
    <input class="w-full border p-2" type="text" id="pincode" name="pincode" />
    <span class="text-red-500 text-xs"></span>
  </div>
</div>
<div>
  <label for="state" class="text-sm">State</label>
  <input class="w-full border p-2" type="text" id="state" name="state" />
  <span class="text-red-500 text-xs"></span>
</div>
<div class="flex gap-3 justify-between">
  <div class="flex-grow">
    <label for="phone" class="text-sm">Phone</label>
    <input class="w-full border p-2" type="text" id="phone" name="phone" />
    <span class="text-red-500 text-xs"></span>
  </div>
  <div class="flex-grow">
    <label for="email" class="text-sm">Email</label>
    <input class="w-full border p-2" type="text" id="email" name="email" />
    <span class="text-red-500 text-xs"></span>
  </div>
</div>
</div>
<div class="mt-2 flex justify-center">
<button type="submit" class="py-3 px-6 bg-black text-white text-xs mt-2">
  Save
</button>
</div>
</form>

        </div>
      </div>
    </div>
  </div>
</div>
`;

  addressBox.innerHTML = addressHTML;
  const selectedAddressPreview = document.getElementById(
    "selected-address-preview"
  );

  window.showSelectedAddressPreview = function (addressId) {
    const selectedAddress = addresses.find((addr) => addr._id === addressId);
    if (selectedAddress) {
      selectedAddressPreview.innerHTML = `
    <div class="text-xs">${selectedAddress.name}</div>
    <div class="text-xs">${selectedAddress.address}</div>
    <div class="text-xs">${selectedAddress.city}, ${selectedAddress.state}, ${selectedAddress.pincode}</div>
    <div class="text-xs">${selectedAddress.phone}</div>
    <div class="text-xs">${selectedAddress.email}</div>
  `;
    }
  };
  if (addresses && addresses.length > 0) {
    showSelectedAddressPreview(addresses[addresses.length - 1]._id);
  }
}

function toggleAddressBox() {
  const addAddressBoxBtn = document.getElementById("addaddressboxbtn");
  const addressBox = document.getElementById("addaddressbox");

  addressBox.classList.toggle("hidden");

  if (addressBox.classList.contains("hidden")) {
    addAddressBoxBtn.innerHTML = `Add New Address <span class="icon"><i class="bi bi-plus-lg text-white font-extrabold"></i></span> `;
  } else {
    addAddressBoxBtn.innerHTML = `Add New Address <span class="icon"><i class="bi bi-dash-lg text-white font-extrabold"></i></span>`;
  }
}

document
  .getElementById("billingAddressForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault();
    console.log("heeeee");

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    const errors = {};

    if (!data.name || data.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters long.";
    }

    if (!data.address || data.address.trim().length < 5) {
      errors.address = "Address must be at least 5 characters long.";
    }

    if (!data.city || data.city.trim().length < 2) {
      errors.city = "City must be at least 2 characters long.";
    }

    if (!data.pincode || !/^\d{6}$/.test(data.pincode)) {
      errors.pincode = "Pincode must be a valid 6-digit number.";
    }

    if (!data.state || data.state.trim().length < 2) {
      errors.state = "State must be at least 2 characters long.";
    }

    if (!data.phone || !/^\d{10}$/.test(data.phone)) {
      errors.phone = "Phone number must be a valid 10-digit number.";
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.email = "Email must be a valid email address.";
    }

    document.querySelectorAll("span.text-red-500").forEach((span) => {
      span.textContent = "";
    });

    if (Object.keys(errors).length > 0) {
      for (const field in errors) {
        const errorSpan = document.querySelector(
          `#${field} + span.text-red-500`
        );
        if (errorSpan) {
          errorSpan.textContent = errors[field];
        }
      }
      return;
    }

    try {
      const response = await fetch("/accountsettings/address/addaddress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        showNotification(result.message);
        renderAddressDetails(result.userAddress.addresses);
        event.target.reset();
      } else {
        showNotification(result.message);
      }
    } catch (error) {
      console.error("Error saving address:", error);
      alert("An error occurred while saving the address.");
    }
  });


  document.querySelectorAll(".copy-btn").forEach(button => {
    button.addEventListener("click", function () {
      const couponCode = this.getAttribute("data-code");
      navigator.clipboard.writeText(couponCode).then(() => {
        this.innerText = "Copied!";
        this.classList.add("bg-green-500", "text-white");
        setTimeout(() => {
          this.innerText = "Copy";
          this.classList.remove("bg-green-500", "text-white");
        }, 1500);
      });
    });
  });