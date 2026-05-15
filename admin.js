/* =========================================
   FIREBASE IMPORT
========================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* =========================================
   FIREBASE CONFIG
========================================= */
const firebaseConfig = {
  apiKey: "AIzaSyD3CrN0DWnJJC2b5R34oxegNuLOzyx_kOA",
  authDomain: "peminjaman-perpus.firebaseapp.com",
  projectId: "peminjaman-perpus",
  storageBucket: "peminjaman-perpus.firebasestorage.app",
  messagingSenderId: "419840349108",
  appId: "1:419840349108:web:743149e778ef151cab98e1"
};

/* =========================================
   INIT
========================================= */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const ADMIN_EMAIL = "kelompok3strudat@perpus.com";

/* =========================================
   TOAST POPUP
========================================= */
window.showToast = function(message, type = "success") {
  const oldToast = document.querySelector(".custom-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = "custom-toast";
  toast.textContent = message;

  toast.style.position = "fixed";
  toast.style.top = "24px";
  toast.style.right = "24px";
  toast.style.padding = "16px 20px";
  toast.style.borderRadius = "16px";
  toast.style.color = "white";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "99999";
  toast.style.boxShadow = "0 20px 40px rgba(0,0,0,.15)";
  toast.style.transform = "translateY(-20px)";
  toast.style.opacity = "0";
  toast.style.transition = ".25s ease";

  toast.style.background =
    type === "error"
      ? "#ef4444"
      : "#4f46e5";

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

/* =========================================
   PASSWORD VALIDATION
========================================= */
function validatePassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_-])[A-Za-z\d@$!%*?&.#_-]{8,}$/;

  return regex.test(password);
}

/* =========================================
   USER HELPERS
========================================= */
async function saveUserData(uid, data) {
  await setDoc(doc(db, "users", uid), data);
}

async function getUserData(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) return null;

  return snapshot.data();
}

window.getCurrentUserData = function() {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve(null);
        return;
      }

      try {
        const userData = await getUserData(user.uid);
        resolve(userData);
      } catch (err) {
        reject(err);
      }
    });
  });
};

/* =========================================
   REGISTER
========================================= */
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (password !== confirmPassword) {
      showToast("Password tidak cocok", "error");
      return;
    }

    if (!validatePassword(password)) {
      showToast(
        "Password min 8 karakter, huruf besar, kecil, angka, simbol",
        "error"
      );
      return;
    }

    try {
      const result =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      const role =
        email === ADMIN_EMAIL
          ? "admin"
          : "member";

      await saveUserData(result.user.uid, {
        name,
        email,
        role
      });

      showToast("Registrasi berhasil");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);

    } catch (error) {
      showToast(error.message, "error");
      console.error(error);
    }
  });
}

/* =========================================
   LOGIN EMAIL
========================================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email =
      document.getElementById("loginEmail").value.trim();

    const password =
      document.getElementById("loginPassword").value;

    try {
      const result =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const userData =
        await getUserData(result.user.uid);

      showToast("Login berhasil");

      setTimeout(() => {
        if (userData?.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "member.html";
        }
      }, 1000);

    } catch (error) {
      showToast("Email / password salah", "error");
      console.error(error);
    }
  });
}

/* =========================================
   GOOGLE LOGIN
========================================= */
window.loginWithGoogle = async function() {
  try {
    const result =
      await signInWithPopup(auth, googleProvider);

    const user = result.user;

    let userData = await getUserData(user.uid);

    if (!userData) {
      const role =
        user.email === ADMIN_EMAIL
          ? "admin"
          : "member";

      await saveUserData(user.uid, {
        name: user.displayName || "User",
        email: user.email,
        role
      });

      userData = {
        role
      };
    }

    showToast("Login Google berhasil");

    setTimeout(() => {
      if (userData.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "member.html";
      }
    }, 1000);

  } catch (error) {
    showToast("Login Google gagal", "error");
    console.error(error);
  }
};

/* =========================================
   FORGOT PASSWORD
========================================= */
window.resetPassword = async function() {
  const email = prompt("Masukkan email akun:");

  if (!email) return;

  try {
    await sendPasswordResetEmail(auth, email);

    showToast("Link reset password dikirim");

  } catch (error) {
    showToast("Gagal kirim reset email", "error");
    console.error(error);
  }
};

/* =========================================
   LOGOUT
========================================= */
window.logoutUser = async function() {
  try {
    await signOut(auth);

    showToast("Logout berhasil");

    setTimeout(() => {
      window.location.href = "index.html";
    }, 1000);

  } catch (error) {
    showToast("Logout gagal", "error");
  }
};

/* =========================================
   ROUTE PROTECTION
========================================= */
window.protectPage = function(requiredRole) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "login.html";
      return;
    }

    const userData = await getUserData(user.uid);

    if (!userData) {
      window.location.href = "login.html";
      return;
    }

    if (
      requiredRole &&
      userData.role !== requiredRole
    ) {
      showToast("Akses ditolak", "error");

      setTimeout(() => {
        if (userData.role === "admin") {
          window.location.href = "admin.html";
        } else {
          window.location.href = "member.html";
        }
      }, 1000);
    }
  });
};

/* =========================================
   BOOK HELPERS
========================================= */
window.getAllBooks = async function() {
  const snapshot =
    await getDocs(collection(db, "books"));

  const books = [];

  snapshot.forEach((docSnap) => {
    books.push({
      id: docSnap.id,
      ...docSnap.data()
    });
  });

  return books;
};

window.addBook = async function(bookData) {
  await addDoc(collection(db, "books"), bookData);
};

window.deleteBook = async function(bookId) {
  await deleteDoc(doc(db, "books", bookId));
};