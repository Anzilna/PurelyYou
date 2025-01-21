const addMoneyModal = document.getElementById("addMoneyModal");
const openAddMoneyModal = document.getElementById("openAddMoneyModal");
const cancelAddMoney = document.getElementById("cancelAddMoney");
const addMoneyForm = document.getElementById("addMoneyForm");
const amountInput = document.getElementById("amount");
const amountError = document.getElementById("amountError");

const walletBalance = document.getElementById("walletBalance");
const transactionsList = document.getElementById("transactionsList");
const pagination = document.getElementById("pagination"); 

let currentPage = 1;
const limit = 10;  

openAddMoneyModal.addEventListener("click", () => {
  addMoneyModal.classList.remove("hidden");
});

cancelAddMoney.addEventListener("click", () => {
  addMoneyModal.classList.add("hidden");
});

document.addEventListener("DOMContentLoaded", async () => {
  await fetchWalletDetails();
});

async function fetchWalletDetails(page = 1) {
  try {
    const response = await fetch(`/accountsettings/walletdetails?page=${page}&limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (response.ok) {
      walletBalance.textContent = `Rs. ${result.balance}`;
      if (result.transactions.length > 0) {
        transactionsList.innerHTML = `
          <thead>
              <tr class="bg-gray-100 text-xs font-medium text-gray-600 uppercase tracking-wider">
                  <th class="py-3 px-4 border">Date</th>
                  <th class="py-3 px-4 border">Transaction ID</th>
                  <th class="py-3 px-4 border">Description</th>
                  <th class="py-3 px-4 border">Amount</th>
                  <th class="py-3 px-4 border">Type</th>
              </tr>
          </thead>
          <tbody>
              ${result.transactions
                .map(
                  (transaction) => `
                    <tr class="hover:bg-gray-50 text-xs">
                        <td class="py-3 px-4 border">${new Date(transaction.date).toLocaleDateString()}</td>
                        <td class="py-3 px-4 border">${transaction.transactionId}</td>
                        <td class="py-3 px-4 border">${transaction.description}</td>
                        <td class="py-3 px-4 border font-medium ${
                          transaction.type === "DEBIT" ? "text-red-600" : "text-green-600"
                        }">
                            ${
                              transaction.type === "DEBIT"
                                ? `- Rs. ${transaction.amount}`
                                : `+ Rs. ${transaction.amount}`
                            }
                        </td>
                        <td class="py-3 px-4 border">${transaction.type}</td>
                    </tr>
                  `
                )
                .join("")}
          </tbody>
        `;
        renderPagination(result.totalPages, result.currentPage);
      } else {
        transactionsList.innerHTML = `
          <div class="text-center text-gray-500 py-4">
              <p>No Transactions Found</p>
          </div>
        `;
      }
    } else {
      showNotification(`Error: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error fetching wallet details:", error);
    showNotification("Something went wrong. Please try again.", "error");
  }
}
function renderPagination(totalPages, currentPage) {
  let paginationHTML = "";

  paginationHTML += `
    <button class="px-4 py-2 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}" onclick="${currentPage > 1 ? `changePage(${currentPage - 1})` : ''}">
      <i class="bi bi-chevron-left"></i>
    </button>
  `;

  // Render page numbers
  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `
      <button class="px-4 py-2 ${i === currentPage ? 'bg-black text-white rounded-full' : ''}" onclick="changePage(${i})">
        ${i}
      </button>
    `;
  }

  paginationHTML += `
    <button class="px-4 py-2 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}" onclick="${currentPage < totalPages ? `changePage(${currentPage + 1})` : ''}">
      <i class="bi bi-chevron-right"></i>
    </button>
  `;

  pagination.innerHTML = paginationHTML;
}

function changePage(page) {
  currentPage = page;
  fetchWalletDetails(page); 
}


addMoneyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  amountError.classList.add("hidden");

  const amount = parseFloat(amountInput.value);
  const description = "Deposit";
  const type = "CREDIT";

  let isValid = true;

  if (isNaN(amount) || amount <= 0) {
    amountError.classList.remove("hidden");
    isValid = false;
  }

  if (!isValid) {
    return;
  }

  try {
    const response = await fetch("/accountsettings/wallet/addmoney", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount,
        description: description,
        type: type,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      showNotification(
        `Transaction successful: Rs. ${amount} ${type} added.`,
        "success"
      );
      amountInput.value = "";
      await fetchWalletDetails(currentPage); // Refresh the current page of transactions
    } else {
      showNotification(`Error: ${result.message}`, "error");
    }
  } catch (error) {
    console.error("Error adding money:", error);
    showNotification("Something went wrong. Please try again.", "error");
  }

  addMoneyModal.classList.add("hidden");
});

function showNotification(message, type) {
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
    "role",
    "alert"
  );

  if (type === "success") {
    notification.classList.add(
      "text-white",
      "bg-black",
      "dark:bg-gray-800",
      "dark:text-green-400"
    );
  } else if (type === "error") {
    notification.classList.add(
      "text-white",
      "bg-black",
      "dark:bg-gray-800",
      "dark:text-red-400"
    );
  }

  notification.innerHTML = `<span class="font-medium">${
    type === "success" ? "Success!" : "Error!"
  }</span> ${message}`;

  notification.classList.remove("hidden");

  setTimeout(() => {
    hideNotification();
  }, 5000);
}

function hideNotification() {
  const notification = document.getElementById("notification");
  notification.className = "hidden";
}
