// Get userType and userId from localStorage
const userType = localStorage.getItem("userType");
const userId = localStorage.getItem("userId");

// If userType is not "Customer" or userId is null, redirect to the unauthorized page
if (userType !== "Customer" || !userId) {
  window.location.href = "unauthorized.html";
}
