document.addEventListener("DOMContentLoaded", async () => {
  window.protectPage("member");

  const memberName = document.getElementById("memberName");
  const memberAvatar = document.getElementById("memberAvatar");

  try {
    const userData = await window.getCurrentUserData();

    if (!userData) return;

    if (memberName) {
      memberName.textContent = userData.name || "Member";
    }

    if (memberAvatar) {
      memberAvatar.textContent =
        (userData.name || "M").charAt(0).toUpperCase();
    }

  } catch (error) {
    console.error(error);
    window.showToast("Gagal memuat data user", "error");
  }
});