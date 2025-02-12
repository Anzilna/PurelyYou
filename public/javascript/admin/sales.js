async function fetchData(filter = "today", startDate = "", endDate = "") {
    let queryParams = `?filter=${filter}`;
    if (filter === "custom") {
      queryParams += `&startDate=${startDate}&endDate=${endDate}`;
    }

    try {
      const response = await fetch(`/admin/salesfetch${queryParams}`);
      const {summaryData} = await response.json();

      updateSummaryFields(summaryData);

      const orderTableBody = document.getElementById("orderTableBody");
      orderTableBody.innerHTML = summaryData.orders
        .map(
          (order) => ` 
              <tr>
                <td class="px-6 py-4">${order.code}</td>
                <td class="px-6 py-4">${order.username}</td>
                <td class="px-6 py-4">${order.GrandtotalAmount.toFixed(2)}</td>
                <td class="px-6 py-4">${new Date(
                  order.createdAt
                ).toLocaleString()}</td>
                <td class="px-6 py-4">${order.orderstatus}</td>
              </tr>
            `
        )
        .join("");
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  }

  function updateSummaryFields(data) {
    document.getElementById("revenueCount").textContent =
      `₹${data.revenue.toFixed(2)}`;
    document.getElementById("totalDiscount").textContent =
      `₹${data.totalDiscount.toFixed(2)}`;
    document.getElementById("totalRegularPrice").textContent =
      `₹${data.totalRegularPrice.toFixed(2)}`;
    document.getElementById("totalCouponDiscount").textContent =
      `₹${data.totalCouponDiscount.toFixed(2)}`;
    document.getElementById("totalDeliveryCharge").textContent =
      `₹${data.totalDeliveryCharge.toFixed(2)}`;
      document.getElementById("totalReturnAmount").textContent =
      `₹${data.totalReturnedAmount.toFixed(2)}`;
      
  }

  document.addEventListener("DOMContentLoaded", () => {
    fetchData("today");
  });

  document.getElementById("filterDropdown").addEventListener("change", (e) => {
    const value = e.target.value;
    const customInputs = document.getElementById("customDateInputs");
    customInputs.classList.toggle("hidden", value !== "custom");
  });

  document.getElementById("filterButton").addEventListener("click", () => {
    const filter = document.getElementById("filterDropdown").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    fetchData(filter, startDate, endDate);
  });

  document
    .getElementById("downloadPDF")
    .addEventListener("click", async (e) => {
      const filter = document.getElementById("filterDropdown").value;
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;

      let queryParams = `?filter=${filter}`;
      if (filter === "custom") {
        queryParams += `&startDate=${startDate}&endDate=${endDate}`;
      }

      try {
        const response = await fetch(`/admin/generatepdfreport${queryParams}`, {
          method: "GET",
        });
        console.log(response.status); 

        if (!response.ok) {
          throw new Error("Failed to generate PDF");
        }

        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "purelyYou_sales_report.pdf";
        link.click();
      } catch (error) {
        console.error("Error downloading PDF:", error);
      }
    });

  document.getElementById("downloadExcel").addEventListener("click", () => {
    const filter = document.getElementById("filterDropdown").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    let queryParams = `?filter=${filter}`;
    if (filter === "custom") {
      queryParams += `&startDate=${startDate}&endDate=${endDate}`;
    }

    window.location.href = `/admin/generateexcelreport${queryParams}`;
  });