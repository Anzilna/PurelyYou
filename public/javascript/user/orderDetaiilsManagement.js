const orderData = document.getElementById("orderDetailsContainerData").dataset
  .order;
const order = JSON.parse(orderData);

renderOrderDetails(order);

function showReturnModal(productId, amount, quantity) {
  document.getElementById("returnItemId").value = productId;
  document.getElementById("amount").value = amount;
  document.getElementById("quantity").value = quantity;
  document.getElementById("returnModal").classList.remove("hidden");
}

function closeModal() {
  document.getElementById("returnModal").classList.add("hidden");
}
async function fetchAndPrintInvoice(orderId) {
  try {
    const response = await fetch(`/accountsettings/orderinvoice/${orderId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch invoice");
    }

    const blob = await response.blob();

    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, "_blank");

    newWindow.onload = function () {
      newWindow.print();
    };
  } catch (error) {
    console.error("Error while fetching and printing invoice:", error);
  }
}

document
  .getElementById("returnForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    // Reset all error messages
    const errorDivs = document.querySelectorAll(".text-red-500");
    errorDivs.forEach((div) => div.classList.add("hidden"));

    const returnReason = document.getElementById("returnReason").value.trim();
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const address = document.getElementById("address").value.trim();
    const city = document.getElementById("city").value.trim();
    const pincode = document.getElementById("pincode").value.trim();
    const state = document.getElementById("state").value.trim();
    const email = document.getElementById("email").value.trim();
    const productId = document.getElementById("returnItemId").value;
    const orderId = document.getElementById("orderId").value;
    const amount = document.getElementById("amount").value;
    const quantity = document.getElementById("quantity").value;

    let isValid = true;
    if (!returnReason) {
      document.getElementById("errorReturnReason").classList.remove("hidden");
      isValid = false;
    }

    if (!name) {
      document.getElementById("errorName").classList.remove("hidden");
      isValid = false;
    }

    if (!/^[1-9][0-9]{9}$/.test(phone)) {
      document.getElementById("errorPhone").textContent =
        "Phone number must be exactly 10 digits and cannot start with zero.";
      document.getElementById("errorPhone").classList.remove("hidden");
      isValid = false;
    }

    if (!address) {
      document.getElementById("errorAddress").classList.remove("hidden");
      isValid = false;
    }

    if (!city) {
      document.getElementById("errorCity").classList.remove("hidden");
      isValid = false;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      document.getElementById("errorPincode").classList.remove("hidden");
      isValid = false;
    }

    if (!state) {
      document.getElementById("errorState").classList.remove("hidden");
      isValid = false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      document.getElementById("errorEmail").classList.remove("hidden");
      isValid = false;
    }

    if (isValid) {
      const formData = {
        returnReason,
        name,
        phone,
        address,
        city,
        pincode,
        state,
        email,
        productId,
        orderId,
        amount,
        quantity,
      };

      try {
        const response = await fetch("/accountsettings/orderdetails/return", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.done) {
          closeModal();
          document.getElementById("returnForm").reset();
          showNotification("Return request submitted successfully!");
          renderOrderDetails(result.order);
        } else {
          alert(result.message);
        }
      } catch (error) {
        console.error("Error submitting return request:", error);
        alert("An unexpected error occurred. Please try again later.");
      }
    }
  });

document.getElementById("cancelReturn").addEventListener("click", closeModal);

function renderOrderDetails(order) {
  const isRepayment = order.orderstatus === "Payment Pending";
  const isOrderCancelled = order.orderstatus === "Cancelled";
  const isOrderDelivered = order.orderstatus === "Delivered";
  const isNotDelivered = order.orderstatus !== "Delivered";

  const orderDate = new Date(order.updatedAt);
  const currentDate = new Date();
  const timeDifference = currentDate - orderDate;
  const daysDifference = timeDifference / (1000 * 3600 * 24);

  const orderDetailsHTML = `
<div class="flex justify-center bg-white p-2 font-medium">
  <div>ORDER DETAILS</div>
</div>
<input type="hidden" id="orderId" value="${order._id}"/>

<div class="p-4 bg-white flex flex-col cursor-pointer gap-2" id="fororderboxes">
  <div class="flex flex-col gap-4">
    <div class="flex flex-col">
      <div class="flex justify-between gap-1">
        <div class="text-sm font-medium">Order code</div>
        <div class="text-sm font-medium">Order date</div>
      </div>
      <div class="flex justify-between">
        <div class="text-sm">${order.code}</div>
        <div class="text-xs">${new Date(
          order.createdAt
        ).toLocaleDateString()}</div>
      </div>
    </div>

    <div class="flex flex-col text-xs">
      <div class="font-medium text-sm">Mode of Payment</div>
      <div>${order.paymentMethod}</div>
    </div>

    <div class="flex flex-col gap-1 text-xs">
      <div class="font-medium text-sm">Delivery Address</div>
      <div class="flex flex-col">
        <div>${order.selectedAddress.name}</div>
        <div>${order.selectedAddress.phone}</div>
        <div>${order.selectedAddress.address}</div>
        <div>${order.selectedAddress.city}</div>
        <div>${order.selectedAddress.state}</div>
        <div>${order.selectedAddress.pincode}</div>
      </div>
    </div>

    <div class="flex-col" id="orderid">
      <div id="title" class="flex justify-center">
        <h1 class="font-semibold">ORDER SUMMARY</h1>
      </div>
      ${order.items
        .map((item) => {
          const isReturnDisabled =
            isOrderCancelled ||
            isNotDelivered ||
            (isOrderDelivered && daysDifference > 7) ||
            item.returnRequest;

          const returnStatusText = item.returnStatus
            ? "Return Status: " + item.returnStatus
            : "";

          const OrderCancelledText = isOrderCancelled ? "Cancelled" : "";

          let returnButtonText = "Return Option Only Available for 7 days";

          if (isOrderCancelled) {
            returnButtonText = "Cancelled";
          } else if (isReturnDisabled) {
            returnButtonText = returnStatusText || OrderCancelledText;
          } else {
            returnButtonText = "Return";
          }

          if (isNotDelivered || isRepayment) {
            return `
              <div id="itemsdisplay" class="flex flex-col gap">
                <div class="flex flex-row gap-3 m-3">
                  <div class="flex-[2]">
                    <img src="${item.productId.images[0]}" class="h-full w-full" alt="" />
                  </div>
                  <div class="flex-[6]">
                    <div class="flex flex-col h-full w-full">
                      <div class="flex-[2] flex justify-start flex-col gap-[1px] items-start">
                        <div class="text-sm font-medium">${item.productId.productname}</div>
                        <div class="text-xs font-normal">Rs.${item.productId.saleprice}</div>
                      </div>
                      <div class="flex-[5] flex justify-end flex-col align-bottom">
                        <div class="flex">
                          <div class="flex-[2] flex text-xs font-normal justify-start flex-col">
                            <div>Quantity</div>
                            <div>Regular Price</div>
                            <div>Total</div>
                          </div>
                          <div class="flex-[5] text-xs font-normal flex justify-start flex-col">
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
          }

          return `
          <div id="itemsdisplay" class="flex flex-col gap">
            <div class="flex flex-row gap-3 m-3">
              <div class="flex-[2]">
                <img src="${
                  item.productId.images[0]
                }" class="h-full w-full" alt="" />
              </div>
              <div class="flex-[6]">
                <div class="flex flex-col h-full w-full">
                  <div class="flex-[2] flex justify-start flex-col gap-[1px] items-start">
                    <div class="text-sm font-medium">${
                      item.productId.productname
                    }</div>
                    <div class="text-xs font-normal">Rs.${
                      item.productId.saleprice
                    }</div>
                  </div>
                  <div class="flex-[5] flex justify-end flex-col align-bottom">
                    <div class="flex">
                      <div class="flex-[2] flex text-xs font-normal justify-start flex-col">
                        <div>Quantity</div>
                        <div>Regular Price</div>
                        <div>Total</div>
                      </div>
                      <div class="flex-[5] text-xs font-normal flex justify-start flex-col">
                        <div>${item.quantity}</div>
                        <div>Rs.${item.regularprice}</div>
                        <div>Rs.${item.saleprice}</div>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3 flex justify-end">
                    <button 
                      id="returnbtn"
                      class="py-2 border border-black px-6 text-black text-xs rounded" 
                      onclick="showReturnModal('${item.productId._id}','${
            item.saleprice
          }','${item.quantity}')" 
                      ${isReturnDisabled ? "disabled" : ""}>
                      ${returnButtonText}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("")}

      <div class="mt-4 p-3 border-t">
      <div class="text-sm font-medium mb-2">Amount</div>
      <div class="flex justify-between text-xs">
        <span>Total Regular Price:</span>
        <span>Rs.${order.totalRegularprice}</span>
      </div>
      <div class="flex justify-between text-xs">
        <span>Discount:</span>
        <span>- Rs.${order.totalDiscount}</span>
      </div>
      <div class="flex justify-between text-xs">
        <span>Delivery Charge:</span>
        <span>+ Rs.${order.deliveryCharge}</span>
      </div>
      ${
        order.coupponUsed
          ? `
        <div class="flex justify-between text-xs">
          <span>Coupon (${order.coupponCode}):</span>
          <span>- Rs.${order.coupponDiscount}</span>
        </div>
      `
          : ""
      }
      <div class="flex justify-between text-sm font-medium mt-2">
        <span>Final Amount:</span>
        <span>Rs.${order.totalAmount}</span>
      </div>
    </div>

      <div class="flex justify-end mt-3 gap-3">
        ${
          !isOrderCancelled && isOrderDelivered
            ? `<button onclick="fetchAndPrintInvoice('${order._id}')" class="px-4 py-2 border border-black text-black ">Print Invoice</button>`
            : ""
        }
        ${
          isRepayment
            ? `<button onclick="initiateRepayment('${order.razorPayOrderId}','${order.keyid}','${order.totalAmount}','${order._id}','${order.username}','${order.email}')" class="px-4 py-2 border border-black text-black ">Repay Now</button>`
            : ""
        }
        ${
          !isOrderCancelled && !isOrderDelivered && !isRepayment
            ? `<button class="py-2 px-5 border border-black text-black"
          onclick="openCancelOrderModal('${order._id}', '${order.paymentMethod}')">Cancel Order</button>`
            : ""
        }
        <a href="/accountsettings/orders">
          <button class="py-2 px-5 border border-black bg-black text-white">Back</button>
        </a>
      </div>
    </div>
  </div>
</div>
`;

  const orderDetailsContainer = document.getElementById("orderdisplay");
  orderDetailsContainer.innerHTML = orderDetailsHTML;
}

async function cancelOrder(orderId, paymentMethod) {
  try {
    const response = await fetch(`/accountsettings/cancelorders/${orderId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentMethod }),
    });

    const data = await response.json();

    if (data.message === "Order cancelled successfully") {
      showNotification("Order has been cancelled");

      renderOrderDetails(data.order);
    } else {
      showNotification("Failed to cancel order");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("An error occurred while canceling the order");
  }
}

let currentOrderId = null;
let currentPaymentMethod = null;

function openCancelOrderModal(orderId, paymentMethod) {
  currentOrderId = orderId;
  currentPaymentMethod = paymentMethod;
  document.getElementById("cancelOrderModal").classList.remove("hidden");
}

function closeCancelOrderModal() {
  currentOrderId = null;
  currentPaymentMethod = null;
  document.getElementById("cancelOrderModal").classList.add("hidden");
}

async function confirmCancelOrder() {
  const cancelReason = document.getElementById("cancelReason").value.trim();

  if (!cancelReason) {
    showNotification("Please provide a valid reason for cancellation.");
    return;
  }

  try {
    const response = await fetch(
      `/accountsettings/cancelorders/${currentOrderId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethod: currentPaymentMethod,
          reason: cancelReason,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      showNotification(data.message);
      renderOrderDetails(data.order);
      closeCancelOrderModal();
    } else {
      showNotification(data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    showNotification("An error occurred while canceling the order.");
  }
}

async function initiateRepayment(
  razorPayOrderId,
  keyid,
  amount,
  id,
  username,
  email
) {
  const response = await fetch("/razorpay/createorder?type=pending", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount,
      currency: "INR",
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const { razorpayOrder } = await response.json();

  const options = {
    key: keyid,
    amount: razorpayOrder.amount,
    currency: "INR",
    name: "PurelyYou",
    description: "Test Transaction",
    order_id: razorpayOrder.id,
    handler: async function (response) {
      showNotification("Payment successful! Verifying your payment...");

      try {
        const verifyResponse = await fetch("/razorpay/verifypayment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            razorpay_order_id: razorpayOrder.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            pendingOrderId: id,
          }),
        });
        const { order, success } = await verifyResponse.json();

        if (verifyResponse.ok && success) {
          showNotification(
            "Payment verified successfully! Thank you for your purchase."
          );
          location.assign(`/shoppingcart/checkout/orderplaced/${order._id}`);
        } else {
          showNotification(
            "Payment verification failed. Please contact support."
          );
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
      ondismiss: function () {},
    },
  };

  options.method = ["card", "netbanking", "wallet", "upi"];

  const rzp = new Razorpay(options);
  rzp.open();

  rzp.on("payment.failed", function (response) {
    showNotification("Payment failed. Please try again.");
  });
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
