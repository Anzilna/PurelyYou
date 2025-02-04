let offerIdToEdit = null;
const listProductModal = document.getElementById("listProductModal");
const confirmListButton = document.getElementById("confirmListButton");
const errorSelect = document.getElementById("error-select");
let categoryId = "";

listProductModal.addEventListener("show.bs.modal", (event) => {
  const button = event.relatedTarget;
  const offerId = button.getAttribute("data-offer-id");
  categoryId = button.getAttribute("data-category-id");
  console.log(categoryId, "idd");

  const offerStatus = button.getAttribute("data-status");

  console.log("Offer IDoooo:", offerId);

  document.getElementById("listingStatus").value = offerStatus;
  offerIdToEdit = offerId;
  console.log("Offer ID:", offerIdToEdit);
});

confirmListButton.addEventListener("click", async () => {
  if (!offerIdToEdit) return;

  console.log(offerIdToEdit, "last idddddd", categoryId);

  const listingStatus = document.getElementById("listingStatus").value;
  if (!listingStatus) {
    errorSelect.textContent = "Please select a valid option.";
    return;
  }

  try {
    const fetchResult = await fetch(
      `/admin/offers/editoffer/${offerIdToEdit}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: listingStatus, categoryId }),
      }
    );

    const fetchResultJSON = await fetchResult.json();
    if (fetchResultJSON.updated) {
      location.reload();
    } else {
      showNotification(fetchResultJSON.message);
    }
  } catch (error) {
    console.error("Error updating offer status:", error);
    alert("An error occurred while updating the offer status.");
  }
});

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