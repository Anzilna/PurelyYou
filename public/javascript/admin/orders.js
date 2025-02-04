document.addEventListener("DOMContentLoaded", () => {
  const ordersTableBody = document.getElementById("ordersTableBody");
  const noOrdersMessage = document.getElementById("noOrdersMessage");
  const fulltable = document.getElementById("fulltable");
  const prevPageBtn = document.getElementById("prevPageBtn");
  const nextPageBtn = document.getElementById("nextPageBtn");
  const pageNumbers = document.getElementById("pageNumbers");

  let currentPage = 1;
  const limit = 6;
  let totalPages = 1;

  async function fetchOrders(page = 1) {
    try {
      const response = await fetch(
        `/admin/Orders/fetch?page=${page}&limit=${limit}`
      );
      const data = await response.json();

      // Clear table and page numbers
      ordersTableBody.innerHTML = "";
      pageNumbers.innerHTML = "";

      if (data.orders && data.orders.length > 0) {
        noOrdersMessage.classList.add("hidden");
        fulltable.classList.remove("hidden");

        data.orders.forEach((order) => {
          const row = document.createElement("tr");
          row.classList.add(
            "hover:bg-gray-100",
            "min-h-[50px]",
            "cursor-pointer"
          );
          row.setAttribute("onclick", `handleRowClick('${order._id}')`);
          row.innerHTML = `
              <td class="px-6 py-3">${order.username}</td>
              <td class="px-6 py-3">${order.code}</td>
              <td class="px-6 py-3">${order.orderstatus}</td>
              <td class="px-6 py-3">Rs. ${order.totalAmount}</td>
              <td class="px-6 py-3">${new Date(
                order.updatedAt
              ).toLocaleString()}</td>
              <td class="px-6 py-3 text-right">
                <button
                  class="text-gray-600 hover:text-black mx-2"
                  data-bs-toggle="modal"
                  data-bs-target="#listProductModal"
                  data-order-id="${order._id}">
                  <i class="bi bi-card-checklist"></i>
                </button>
              </td>
            `;
          ordersTableBody.appendChild(row);
        });

        totalPages = data.totalPages;
        renderPageNumbers();

        prevPageBtn.disabled = data.currentPage === 1;
        nextPageBtn.disabled = !data.hasNextPage;
      } else {
        noOrdersMessage.classList.remove("hidden");
        fulltable.classList.add("hidden");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      noOrdersMessage.classList.remove("hidden");
      fulltable.classList.add("hidden");
    }
  }

  function renderPageNumbers() {
    for (let i = 1; i <= totalPages; i++) {
      const pageButton = document.createElement("button");
      pageButton.textContent = i;
      pageButton.className = `w-10 h-10 flex items-center justify-center rounded-full ${
        i === currentPage
          ? "bg-black text-white border-2 border-black"
          : "text-black hover:bg-gray-200"
      }`;
      pageButton.addEventListener("click", () => {
        currentPage = i;
        fetchOrders(currentPage);
      });
      pageNumbers.appendChild(pageButton);
    }
  }

  // Event listeners for pagination buttons
  prevPageBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      fetchOrders(currentPage);
    }
  });

  nextPageBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      fetchOrders(currentPage);
    }
  });

  fetchOrders(currentPage);
});

function handleRowClick(orderId) {
  console.log("Row clicked! Order ID:", orderId);
  location.assign(`/admin/orders/orderdetails/${orderId}`);
}
