document.addEventListener("DOMContentLoaded", async () => {
  const catalogGrid = document.getElementById("catalogGrid");
  const searchInput = document.getElementById("searchBook");

  if (!catalogGrid) return;

  let books = [];

  async function loadBooks() {
    try {
      books = await window.getAllBooks();
      renderBooks(books);
    } catch (error) {
      window.showToast("Gagal memuat buku", "error");
      console.error(error);
    }
  }

  function renderBooks(bookList) {
    if (!bookList.length) {
      catalogGrid.innerHTML = `
        <div class="empty-state">
          <h3>Belum ada buku</h3>
          <p>Admin belum menambahkan buku.</p>
        </div>
      `;
      return;
    }

    catalogGrid.innerHTML = bookList.map(book => `
      <div class="book-card">
        <div class="book-cover">
          ${
            book.image
              ? `<img src="${book.image}" alt="${book.title}">`
              : ""
          }
        </div>

        <div class="book-body">
          <div class="book-title">${book.title}</div>

          <div class="book-author">
            ${book.author || "Penulis tidak diketahui"}
          </div>

          <div class="book-footer">
            <span class="badge badge-primary">
              Stok: ${book.stock || 0}
            </span>

            <a href="book-detail.html?id=${book.id}" class="btn-primary">
              Detail
            </a>
          </div>
        </div>
      </div>
    `).join("");
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const keyword = searchInput.value.toLowerCase();

      const filtered = books.filter(book =>
        (book.title || "").toLowerCase().includes(keyword) ||
        (book.author || "").toLowerCase().includes(keyword)
      );

      renderBooks(filtered);
    });
  }

  loadBooks();
});