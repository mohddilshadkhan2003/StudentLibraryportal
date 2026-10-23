document.addEventListener('DOMContentLoaded', () => {
  const currentUser = JSON.parse(localStorage.getItem('studentLibraryCurrentUser') || 'null');
  if (!currentUser) {
    window.location.href = 'login.html';
    return;
  }

  const catalogGrid = document.getElementById('catalogGrid');
  const categoryList = document.getElementById('categoryList');
  const chipRow = document.getElementById('chipRow');
  const searchInput = document.getElementById('searchInput');
  const resultsCount = document.getElementById('resultsCount');
  const welcomeName = document.getElementById('welcomeName');
  const welcomeRoll = document.getElementById('welcomeRoll');
  const dashGreeting = document.getElementById('dashGreeting');
  const avatarInitial = document.getElementById('avatarInitial');
  const logoutBtn = document.getElementById('logoutBtn');
  const statTotal = document.getElementById('statTotal');
  const statAvailable = document.getElementById('statAvailable');
  const statCategories = document.getElementById('statCategories');
  const countAll = document.getElementById('countAll');

  const defaultBooks = [
    { id: 1, title: 'Clean Code', author: 'Robert C. Martin', category: 'Programming', availableCopies: 3 },
    { id: 2, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', category: 'Software', availableCopies: 2 },
    { id: 3, title: 'Data Structures in Java', author: 'R. S. Salaria', category: 'Computer Science', availableCopies: 5 },
    { id: 4, title: 'Operating System Concepts', author: 'Silberschatz', category: 'Systems', availableCopies: 1 },
    { id: 5, title: 'Database System Concepts', author: 'Korth', category: 'Database', availableCopies: 4 },
    { id: 6, title: 'Discrete Mathematics', author: 'Rosen', category: 'Mathematics', availableCopies: 2 },
    { id: 7, title: 'Artificial Intelligence', author: 'Russell & Norvig', category: 'AI', availableCopies: 3 },
    { id: 8, title: 'Engineering Mathematics', author: 'Erwin Kreyszig', category: 'Mathematics', availableCopies: 0 },
  ];

  const getBooks = () => JSON.parse(localStorage.getItem('studentLibraryBooks') || 'null') || defaultBooks;
  const saveBooks = (books) => localStorage.setItem('studentLibraryBooks', JSON.stringify(books));

  const getInitials = (name) => {
    const parts = name.split(' ').filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
  };

  const updateUserMeta = () => {
    const firstName = currentUser.fullName.split(' ')[0] || 'Student';
    welcomeName.textContent = firstName;
    welcomeRoll.textContent = currentUser.rollNumber;
    dashGreeting.textContent = `Welcome back, ${firstName}`;
    avatarInitial.textContent = getInitials(currentUser.fullName);
  };

  const renderStats = (books) => {
    const total = books.length;
    const available = books.filter((book) => book.availableCopies > 0).length;
    const categories = new Set(books.map((book) => book.category)).size;

    statTotal.textContent = total;
    statAvailable.textContent = available;
    statCategories.textContent = categories;
    countAll.textContent = total;
  };

  const buildCategoryFilters = (books) => {
    const categories = ['All', ...new Set(books.map((book) => book.category))];
    categoryList.innerHTML = '';

    categories.forEach((category) => {
      const item = document.createElement('li');
      item.className = 'cat-item active';
      const label = category === 'All' ? 'All titles' : category;
      const count = category === 'All' ? books.length : books.filter((book) => book.category === category).length;
      item.dataset.category = category === 'All' ? '' : category;
      item.innerHTML = `${label} <span class="count">${count}</span>`;
      item.addEventListener('click', () => {
        document.querySelectorAll('.cat-item').forEach((node) => node.classList.remove('active'));
        item.classList.add('active');
        applyFilters();
      });
      categoryList.appendChild(item);
    });

    chipRow.innerHTML = '';
    categories.forEach((category) => {
      const button = document.createElement('button');
      button.className = 'chip';
      button.textContent = category;
      button.dataset.category = category === 'All' ? '' : category;
      button.addEventListener('click', () => {
        document.querySelectorAll('.chip').forEach((chip) => chip.classList.remove('active'));
        button.classList.add('active');
        const item = categoryList.querySelector(`li[data-category="${button.dataset.category}"]`);
        if (item) {
          document.querySelectorAll('.cat-item').forEach((node) => node.classList.remove('active'));
          item.classList.add('active');
        }
        applyFilters();
      });
      chipRow.appendChild(button);
    });

    const firstChip = chipRow.querySelector('.chip');
    if (firstChip) firstChip.classList.add('active');
  };

  const renderBooks = (books) => {
    catalogGrid.innerHTML = '';

    if (!books.length) {
      catalogGrid.innerHTML = '<div class="book-card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--muted);">No books match your search.</div>';
      resultsCount.textContent = '0 results';
      return;
    }

    books.forEach((book) => {
      const card = document.createElement('article');
      card.className = 'book-card';

      const stockClass = book.availableCopies === 0 ? 'out' : book.availableCopies <= 2 ? 'low' : '';
      const stockText = book.availableCopies === 0 ? 'Out of stock' : `${book.availableCopies} available`;

      card.innerHTML = `
        <div class="book-cover">
          <span class="cover-text">${book.title}</span>
          <span class="cover-badge">${book.category}</span>
        </div>
        <div class="book-body">
          <div class="book-top">
            <h3 class="book-title">${book.title}</h3>
            <span class="tag">${book.category}</span>
          </div>
          <div class="book-meta">
            By <strong>${book.author}</strong>
          </div>
          <div class="book-footer">
            <span class="stock ${stockClass}">${stockText}</span>
            <button class="borrow-btn" ${book.availableCopies === 0 ? 'disabled' : ''} data-id="${book.id}">
              ${book.availableCopies === 0 ? 'Unavailable' : 'Borrow'}
            </button>
          </div>
        </div>
      `;

      const borrowButton = card.querySelector('.borrow-btn');
      borrowButton.addEventListener('click', () => borrowBook(book.id));
      catalogGrid.appendChild(card);
    });

    resultsCount.textContent = `${books.length} result${books.length === 1 ? '' : 's'}`;
  };

  const applyFilters = () => {
    const books = getBooks();
    const selectedCategory = document.querySelector('.cat-item.active')?.dataset.category || '';
    const query = (searchInput.value || '').trim().toLowerCase();

    const filtered = books.filter((book) => {
      const matchesCategory = !selectedCategory || book.category === selectedCategory;
      const matchesQuery = !query || [book.title, book.author, book.category].join(' ').toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });

    renderBooks(filtered);
  };

  const borrowBook = (bookId) => {
    const books = getBooks();
    const book = books.find((item) => item.id === bookId);
    if (!book || book.availableCopies <= 0) return;

    book.availableCopies -= 1;
    saveBooks(books);

    renderStats(books);
    applyFilters();
  };

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('studentLibraryCurrentUser');
    window.location.href = 'login.html';
  });

  updateUserMeta();
  const books = getBooks();
  renderStats(books);
  buildCategoryFilters(books);
  renderBooks(books);

  searchInput.addEventListener('input', applyFilters);

  const firstChip = chipRow.querySelector('.chip');
  if (firstChip) firstChip.classList.add('active');
});
