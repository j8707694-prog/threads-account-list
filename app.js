(function () {
  const accounts = Array.isArray(window.ACCOUNTS) ? window.ACCOUNTS : [];
  const list = document.getElementById("accountList");
  const empty = document.getElementById("emptyState");
  const totalCount = document.getElementById("totalCount");
  const visibleCount = document.getElementById("visibleCount");
  const searchInput = document.getElementById("searchInput");

  const normalize = (value) => value.trim().toLowerCase();

  function createRow(account) {
    const row = document.createElement("article");
    row.className = "account-row";

    const id = document.createElement("div");
    id.className = "account-id";
    id.textContent = account.id;

    const button = document.createElement("a");
    button.className = "open-button";
    button.href = account.url;
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    button.textContent = "열기";
    button.setAttribute("aria-label", `${account.id} Threads 열기`);

    row.append(id, button);
    return row;
  }

  function render(items) {
    const fragment = document.createDocumentFragment();
    for (const account of items) {
      fragment.append(createRow(account));
    }

    list.replaceChildren(fragment);
    visibleCount.textContent = String(items.length);
    empty.hidden = items.length !== 0;
  }

  function filterAccounts() {
    const query = normalize(searchInput.value);
    if (!query) {
      render(accounts);
      return;
    }

    render(accounts.filter((account) => normalize(account.id).includes(query)));
  }

  totalCount.textContent = String(accounts.length);
  searchInput.addEventListener("input", filterAccounts);
  render(accounts);
})();
