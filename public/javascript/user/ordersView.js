function renderOrders(orders) {
  const ordersList = document.getElementById("orderslist");

  if (!orders || orders.length === 0) {
    ordersList.innerHTML = `
          <div class="text-center text-gray-600">
            No orders found
          </div>`;
    return;
  }

  const ordersHTML = orders
    .map(
      (order) => `
        <div
          class="p-4 bg-white flex justify-between cursor-pointer"
          onclick="orderGet('${order._id}','${order.orderstatus}')"
        >
          <div class="flex flex-col gap-2">
            <div class="text-sm font-medium">${order.orderstatus}</div>
            <div class="text-xs">${order.items.length} items</div>
          </div>
          <div class="flex flex-col gap-2 text-xs">
            <div>${new Date(order.createdAt).toLocaleDateString()}</div>
            <div>Rs.${order.totalAmount}</div>
          </div>
          <div class="flex justify-center items-center">
            <i class="bi bi-chevron-right"></i>
          </div>
        </div>
      `
    )
    .join("");

  ordersList.innerHTML = ordersHTML;
}

function getOrdersFromDataset() {
  const ordersList = document.getElementById("orderslist");
  return JSON.parse(ordersList.getAttribute("data-orders") || "[]");
}

function orderGet(id, type) {
  location.assign(`/accountsettings/orderdetails/${id}?type=${type}`);
}

document
  .getElementById("showPendingOrders")
  .addEventListener("click", async () => {
    try {
      const response = await fetch("/accountsettings/pendingorders");
      if (!response.ok) {
        throw new Error("Failed to fetch pending orders");
      }
      const data = await response.json();
      renderOrders(data.orders || []);
    } catch (error) {
      console.error("Error fetching pending orders:", error);
      renderOrders([]);
    }
  });

document.getElementById("showAllOrders").addEventListener("click", () => {
  const allOrders = getOrdersFromDataset();
  renderOrders(allOrders);
});

const allOrders = getOrdersFromDataset();
renderOrders(allOrders);
