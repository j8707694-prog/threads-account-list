(function () {
  const accounts = Array.isArray(window.ACCOUNTS) ? window.ACCOUNTS : [];
  const storageKey = "threads-follow-checker:v3";
  const threadsPackage = "com.instagram.barcelona";

  const list = document.getElementById("accountList");
  const empty = document.getElementById("emptyState");
  const totalCount = document.getElementById("totalCount");
  const visibleCount = document.getElementById("visibleCount");
  const pendingCount = document.getElementById("pendingCount");
  const checkedCount = document.getElementById("checkedCount");
  const searchInput = document.getElementById("searchInput");
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const installButton = document.getElementById("installButton");

  let view = "pending";
  let checkedUrls = loadCheckedUrls();
  let deferredInstallPrompt = null;

  const normalize = (value) => value.trim().toLowerCase();
  const isAndroid = () => /Android/i.test(navigator.userAgent);

  function loadCheckedUrls() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
      return new Set();
    }
  }

  function saveCheckedUrls() {
    localStorage.setItem(storageKey, JSON.stringify(Array.from(checkedUrls)));
  }

  function currentAccounts() {
    const query = normalize(searchInput.value);
    return accounts.filter((account) => {
      const checked = checkedUrls.has(account.url);
      const inView = view === "checked" ? checked : !checked;
      const matchesSearch = !query || normalize(account.id).includes(query);
      return inView && matchesSearch;
    });
  }

  function buildAndroidIntentUrl(url) {
    const target = new URL(url);
    return `intent://${target.host}${target.pathname}${target.search}#Intent;scheme=${target.protocol.replace(":", "")};package=${threadsPackage};end`;
  }

  function openThreads(account) {
    if (isAndroid()) {
      window.location.href = buildAndroidIntentUrl(account.url);
      return;
    }

    window.open(account.url, "_blank", "noopener,noreferrer");
  }

  function markChecked(account) {
    checkedUrls.add(account.url);
    saveCheckedUrls();
  }

  function restorePending(account) {
    checkedUrls.delete(account.url);
    saveCheckedUrls();
    render();
  }

  function createButton(label, className, onClick, ariaLabel) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.setAttribute("aria-label", ariaLabel);
    button.addEventListener("click", onClick);
    return button;
  }

  function createRow(account) {
    const row = document.createElement("article");
    row.className = view === "checked" ? "account-row account-row-checked" : "account-row";

    const id = document.createElement("div");
    id.className = "account-id";
    id.textContent = account.id;

    const actions = document.createElement("div");
    actions.className = "account-actions";

    const openButton = createButton(
      view === "checked" ? "다시" : "열기",
      "action-button primary-button",
      () => {
        markChecked(account);
        render();
        openThreads(account);
      },
      `${account.id} Threads 열기`
    );
    actions.append(openButton);

    if (view === "checked") {
      actions.append(
        createButton(
          "복구",
          "action-button secondary-button",
          () => restorePending(account),
          `${account.id} 미확인으로 복구`
        )
      );
    }

    row.append(id, actions);
    return row;
  }

  function updateTabs() {
    for (const tab of tabs) {
      const active = tab.dataset.view === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    }
  }

  function updateCounts(items) {
    const checkedTotal = accounts.filter((account) => checkedUrls.has(account.url)).length;
    const pendingTotal = accounts.length - checkedTotal;

    totalCount.textContent = String(accounts.length);
    pendingCount.textContent = String(pendingTotal);
    checkedCount.textContent = String(checkedTotal);
    visibleCount.textContent = String(items.length);
  }

  function render() {
    const items = currentAccounts();
    const fragment = document.createDocumentFragment();

    for (const account of items) {
      fragment.append(createRow(account));
    }

    list.replaceChildren(fragment);
    updateTabs();
    updateCounts(items);

    empty.textContent = view === "checked"
      ? "아직 확인한 계정이 없습니다."
      : "미확인 계정이 없습니다.";
    empty.hidden = items.length !== 0;
  }

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      view = tab.dataset.view;
      searchInput.value = "";
      render();
    });
  }

  searchInput.addEventListener("input", render);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    installButton.hidden = true;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js");
    });
  }

  render();
})();
