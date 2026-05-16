/* =========================================
   PERPUSDIGITAL CORE APP.JS
   PART 1
========================================= */

/* FIREBASE IMPORT */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updatePassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

/* FIREBASE CONFIG */
const firebaseConfig = {
  apiKey: "AIzaSyD3CrN0DWnJJC2b5R34oxegNuLOzyx_kOA",
  authDomain: "peminjaman-perpus.firebaseapp.com",
  projectId: "peminjaman-perpus",
  storageBucket: "peminjaman-perpus.appspot.com",
  messagingSenderId: "419840349108",
  appId: "1:419840349108:web:743149e778ef151cab98e1"
};

/* INIT */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(
  auth,
  browserLocalPersistence
).catch(console.error);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

/* =========================================
   AUTO LOGOUT IF IDLE 5 HOURS
========================================= */
const IDLE_TIMEOUT = 5 * 60 * 60 * 1000; // 5 jam
let idleTimer;

function resetIdleTimer() {
  clearTimeout(idleTimer);

  idleTimer = setTimeout(async () => {
    if (auth.currentUser) {
      showToast("Sesi habis karena tidak ada aktivitas. Login ulang.", "error");

      await signOut(auth);

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    }
  }, IDLE_TIMEOUT);
}

/* aktivitas yang reset timer */
["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(event => {
  document.addEventListener(event, resetIdleTimer);
});

/* cek login */
onAuthStateChanged(auth, (user) => {
  if (user) {
    resetIdleTimer();
  }
});

/* GLOBAL EXPORT */
window.auth = auth;
window.db = db;
window.storage = storage;

/* =========================================
   TOAST SYSTEM
========================================= */
window.showToast = function(message, type = "success") {
  const oldToast = document.querySelector(".app-toast");

  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.className = `app-toast ${type}`;
  toast.textContent = message;

  Object.assign(toast.style, {
    position: "fixed",
    top: "24px",
    right: "24px",
    background:
      type === "error"
        ? "#ef4444"
        : "#4f46e5",
    color: "white",
    padding: "14px 18px",
    borderRadius: "16px",
    fontWeight: "600",
    zIndex: "99999",
    boxShadow: "0 18px 40px rgba(0,0,0,.15)",
    opacity: "0",
    transform: "translateY(-20px)",
    transition: ".25s ease"
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-20px)";
    setTimeout(() => toast.remove(), 250);
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
  await setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp()
  });
}

async function getUserData(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data();
}

window.getCurrentUserData = async function() {
  const user = auth.currentUser;

  if (!user) return null;

  const userData = await getUserData(user.uid);

  if (!userData) return null;

  return {
    uid: user.uid,
    ...userData
  };
};

/* =========================================
   ROLE HELPERS
========================================= */
function getDashboardRoute(role) {
  return role === "admin"
    ? "admin.html"
    : "member.html";
}

/* =========================================
   AUTH: REGISTER
========================================= */
window.registerUser = async function(name, email, password) {
  if (!validatePassword(password)) {
    throw new Error(
      "Password minimal 8 karakter, huruf besar, kecil, angka, simbol"
    );
  }

  const result =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

  await saveUserData(result.user.uid, {
    name,
    email,
    role: "member",
    isActive: true,
    photoURL: ""
  });

  return result.user;
};

/* =========================================
   AUTH: LOGIN
========================================= */
window.loginUser = async function(email, password) {
  const result =
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

  return result.user;
};

/* =========================================
   GOOGLE LOGIN
========================================= */
window.loginWithGoogle = async function () {
  const result =
    await signInWithPopup(
      auth,
      googleProvider
    );

  const user = result.user;

  const existingUser =
    await getUserData(user.uid);

  if (!existingUser) {
    await saveUserData(user.uid, {
      name: user.displayName || "User",
      email: user.email,
      role: "member",
      isActive: true,
      photoURL: user.photoURL || ""
    });
  }

  const freshUser =
    await getUserData(user.uid);

  const role =
    freshUser?.role
      ?.trim()
      ?.toLowerCase();

  window.location.href =
    role === "admin"
      ? "admin.html"
      : "member.html";
};

/* =========================================
   FORGOT PASSWORD
========================================= */
window.resetPassword = async function(email) {
  await sendPasswordResetEmail(
    auth,
    email
  );
};

/* =========================================
   CHANGE PASSWORD
========================================= */
window.changePassword = async function(newPassword) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User tidak login");
  }

  if (!validatePassword(newPassword)) {
    throw new Error(
      "Password minimal 8 karakter, huruf besar, kecil, angka, simbol"
    );
  }

  await updatePassword(
    user,
    newPassword
  );
};

/* =========================================
   LOGOUT
========================================= */
window.logoutUser = async function() {
  await signOut(auth);

  window.showToast("Logout berhasil");

  setTimeout(() => {
    window.location.href = "login.html";
  }, 800);
};

/* =========================================
   SESSION / AUTH STATE
========================================= */
window.waitForAuth = function() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resolve(null);
        return;
      }

      const userData = await getUserData(user.uid);

      if (!userData) {
        resolve(null);
        return;
      }

      resolve({
        uid: user.uid,
        ...userData
      });
    });
  });
};

/* =========================================
   ROUTE PROTECTION
========================================= */
window.protectPage = async function(requiredRole) {
  await auth.authStateReady();

  const user = auth.currentUser;

  if (!user) {
    window.location.href =
      "login.html";
    return;
  }

  const userData =
    await getUserData(
      user.uid
    );

  const role =
    userData?.role
      ?.trim()
      ?.toLowerCase();

  if (role !== requiredRole) {
    window.showToast(
      "Akses ditolak",
      "error"
    );

    setTimeout(() => {
      if (role === "admin") {
        window.location.href =
          "admin.html";
      } else {
        window.location.href =
          "member.html";
      }
    }, 1000);

    return;
  }
};

/* =========================================
   PROFILE UPDATE
========================================= */
window.updateProfileName = async function(name) {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("User tidak login");
  }

  await updateDoc(
    doc(db, "users", user.uid),
    {
      name
    }
  );
};

/* =========================================
   NAVBAR RENDER
========================================= */
window.renderNavbar = async function() {
  const nav =
    document.querySelector(
      ".dynamic-navbar"
    );

  if (!nav) return;

  return new Promise((resolve) => {
    onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) {
          nav.innerHTML = `
            <a href="index.html">Home</a>
            <a href="catalog.html">Katalog</a>
            <a href="login.html">Login</a>
          `;
          resolve();
          return;
        }

        const userData =
        await getUserData(
          user.uid
        );

        const role =
          userData?.role
            ?.trim()
            ?.toLowerCase();

        const dashboardLink =
          role === "admin"
            ? "admin.html"
            : "member.html";

        nav.innerHTML = `
          <a href="index.html">Home</a>
          <a href="catalog.html">Katalog</a>
          <a href="${dashboardLink}">
            Dashboard
          </a>

          <div class="profile-dropdown">
            <button
              class="profile-trigger"
              id="profileTrigger"
            >
              Halo,
              ${userData?.name || "User"}
            </button>

            <div
              class="profile-menu"
              id="profileMenu"
            >
              <a href="profile.html">
                Profil Saya
              </a>

              <a href="${dashboardLink}">
                Dashboard
              </a>

              <button onclick="logoutUser()">
                Logout
              </button>
            </div>
          </div>
        `;

        const trigger =
          document.getElementById(
            "profileTrigger"
          );

        const menu =
          document.getElementById(
            "profileMenu"
          );

        trigger.addEventListener(
          "click",
          (e) => {
            e.stopPropagation();
            menu.classList.toggle("show");
          }
        );

        document.addEventListener(
          "click",
          () => {
            menu.classList.remove("show");
          }
        );

        resolve();
      }
    );
  });
};

/* =========================================
   BORROW SYSTEM
========================================= */
window.borrowBook = async function(bookId) {
  const user = await window.getCurrentUserData();

  if (!user) {
    throw new Error("Silakan login dulu");
  }

  const book = await window.getBookById(bookId);

  if (!book) {
    throw new Error("Buku tidak ditemukan");
  }

  if (book.stock <= 0) {
    throw new Error("Stok habis");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  await addDoc(collection(db, "borrowings"), {
    userId: user.uid,
    bookId,
    borrowedAt: serverTimestamp(),
    dueDate: dueDate.toISOString(),
    returned: false
  });

  await updateBook(bookId, {
    stock: book.stock - 1
  });

  await addDoc(collection(db, "history"), {
    userId: user.uid,
    bookId,
    action: "borrow",
    timestamp: serverTimestamp()
  });
};

/* =========================================
   RETURN BOOK
========================================= */
window.returnBook = async function(
  borrowingId,
  bookId
) {
  const book =
    await window.getBookById(bookId);

  await updateDoc(
    doc(db, "borrowings", borrowingId),
    {
      returned: true
    }
  );

  await updateBook(bookId, {
    stock: (book.stock || 0) + 1
  });

  const user =
    await window.getCurrentUserData();

  await addDoc(collection(db, "history"), {
    userId: user.uid,
    bookId,
    action: "return",
    timestamp: serverTimestamp()
  });

  await window.processQueue(bookId);
};

/* =========================================
   QUEUE
========================================= */
window.joinQueue = async function(bookId) {
  const user =
    await window.getCurrentUserData();

  if (!user) {
    throw new Error("Silakan login dulu");
  }

  const existing =
    await getDocs(
      query(
        collection(db, "queues"),
        where("bookId", "==", bookId),
        where("userId", "==", user.uid)
      )
    );

  if (!existing.empty) {
    throw new Error(
      "Anda sudah ada di antrian"
    );
  }

  await addDoc(collection(db, "queues"), {
    bookId,
    userId: user.uid,
    joinedAt: serverTimestamp()
  });
};

window.processQueue = async function(bookId) {
  const queueSnapshot =
    await getDocs(
      query(
        collection(db, "queues"),
        where("bookId", "==", bookId),
        orderBy("joinedAt", "asc")
      )
    );

  if (queueSnapshot.empty) return;

  const first =
    queueSnapshot.docs[0];

  await deleteDoc(
    doc(db, "queues", first.id)
  );

  window.showToast(
    "Antrian berikutnya tersedia"
  );
};

/* =========================================
   MEMBER DATA
========================================= */
window.getMyBorrowings =
  async function() {
    const user =
      await window.getCurrentUserData();

    const snapshot =
      await getDocs(
        query(
          collection(db, "borrowings"),
          where("userId", "==", user.uid),
          where("returned", "==", false)
        )
      );

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  };

window.getMyHistory =
  async function() {
    const user =
      await window.getCurrentUserData();

    const snapshot =
      await getDocs(
        query(
          collection(db, "history"),
          where("userId", "==", user.uid),
          orderBy("timestamp", "desc")
        )
      );

    return snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data()
    }));
  };

/* =========================================
   ADMIN USERS
========================================= */
window.getAllUsers = async function() {
  const snapshot =
    await getDocs(collection(db, "users"));

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
};

window.setUserRole = async function(
  uid,
  role
) {
  await updateDoc(
    doc(db, "users", uid),
    { role }
  );
};

window.setUserStatus =
  async function(uid, isActive) {
    await updateDoc(
      doc(db, "users", uid),
      { isActive }
    );
  };

  /* =========================================
   BOOK STORAGE + CRUD
========================================= */
window.uploadBookCover = async function(file) {
  if (!file) return "";

  const fileName =
    `book-covers/${Date.now()}-${file.name}`;

  const storageRef =
    ref(storage, fileName);

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
};

window.addBook = async function(bookData) {
  await addDoc(
    collection(db, "books"),
    {
      ...bookData,
      createdAt: serverTimestamp()
    }
  );
};

window.getAllBooks = async function() {
  const snapshot = await getDocs(
    query(
      collection(db, "books"),
      orderBy("createdAt", "desc")
    )
  );

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
};

window.getBookById = async function(bookId) {
  const snapshot =
    await getDoc(
      doc(db, "books", bookId)
    );

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...snapshot.data()
  };
};

window.updateBook = async function(
  bookId,
  updatedData
) {
  await updateDoc(
    doc(db, "books", bookId),
    updatedData
  );
};

window.deleteBook = async function(bookId) {
  await deleteDoc(
    doc(db, "books", bookId)
  );
};

/* =========================================
   SEARCH + SORT
========================================= */
window.searchBooks = function(
  books,
  keyword
) {
  if (!keyword) return books;

  const term =
    keyword.toLowerCase();

  return books.filter((book) =>
    (
      book.title?.toLowerCase().includes(term) ||
      book.author?.toLowerCase().includes(term) ||
      book.category?.toLowerCase().includes(term) ||
      book.isbn?.toLowerCase().includes(term)
    )
  );
};

window.sortBooks = function(
  books,
  mode
) {
  const cloned = [...books];

  switch (mode) {
    case "az":
      return cloned.sort((a, b) =>
        a.title.localeCompare(b.title)
      );

    case "za":
      return cloned.sort((a, b) =>
        b.title.localeCompare(a.title)
      );

    case "stock":
      return cloned.sort((a, b) =>
        b.stock - a.stock
      );

    case "year":
      return cloned.sort((a, b) =>
        (b.year || 0) - (a.year || 0)
      );

    default:
      return cloned;
  }
};

window.filterAvailableBooks =
  function(books) {
    return books.filter(
      (book) => book.stock > 0
    );
  };
  window.protectAuthOnly = async function () {
  await auth.authStateReady();

  const user = auth.currentUser;

  if (!user) {
    window.location.href = "login.html";
    return;
  }
};
