document.addEventListener("DOMContentLoaded", () => {
    const returnsTableBody = document.getElementById("returnsTableBody");
    const noReturnsMessage = document.getElementById("noReturnsMessage");
    const fulltable = document.getElementById("fulltable");
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageNumbers = document.getElementById("pageNumbers");

    let currentPage = 1;
    const limit = 6;
    let totalPages = 1;

    async function fetchReturns(page = 1) {
      try {
        const response = await fetch(
          `/admin/returnsfetch?page=${page}&limit=${limit}`
        );
        const data = await response.json();

        // Clear table and page numbers
        returnsTableBody.innerHTML = "";
        pageNumbers.innerHTML = "";

        if (data.returns && data.returns.length > 0) {
          noReturnsMessage.classList.add("hidden");
          fulltable.classList.remove("hidden");

          data.returns.forEach((returnRequest) => {
            const row = document.createElement("tr");
            row.classList.add(
              "hover:bg-gray-100",
              "min-h-[50px]",
              "cursor-pointer"
            );
            row.setAttribute(
              "onclick",
              `handleRowClick('${returnRequest._id}')`
            );
            row.innerHTML = `
    <td class="px-6 py-3">${returnRequest.pickupAddress.name}</td>
    <td class="px-6 py-3">${returnRequest.productId.productname}</td>
    <td class="px-6 py-3">${returnRequest.status}</td>
    <td class="px-6 py-3">${new Date(
      returnRequest.createdAt
    ).toLocaleString()}</td>
    <td class="px-6 py-3 text-right">
      <button
        class="text-gray-600 hover:text-black mx-2"
        data-bs-toggle="modal"
        data-bs-target="#listProductModal"
        data-return-id="${returnRequest._id}">
        <i class="bi bi-card-checklist"></i>
      </button>
    </td>
  `;
            returnsTableBody.appendChild(row);
          });

          totalPages = data.totalPages;
          renderPageNumbers();

          prevPageBtn.disabled = data.currentPage === 1;
          nextPageBtn.disabled = !data.hasNextPage;
        } else {
          noReturnsMessage.classList.remove("hidden");
          fulltable.classList.add("hidden");
        }
      } catch (error) {
        console.error("Error fetching returns:", error);
        noReturnsMessage.classList.remove("hidden");
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
          fetchReturns(currentPage);
        });
        pageNumbers.appendChild(pageButton);
      }
    }

    // Pagination event listeners
    prevPageBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        fetchReturns(currentPage);
      }
    });

    nextPageBtn.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchReturns(currentPage);
      }
    });

    fetchReturns(currentPage);
  });

  function handleRowClick(returnId) {
    console.log("Row clicked! Return ID:", returnId);
    location.assign(`/admin/returns/details/${returnId}`);
  }