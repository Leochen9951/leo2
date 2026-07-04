(() => {
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector("[data-progress]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = [...document.querySelectorAll(".site-nav a")];
  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const chapterCards = [...document.querySelectorAll(".chapter-card")];
  const searchInput = document.querySelector("[data-search]");
  const emptyState = document.querySelector("[data-empty]");
  const storageKey = "it-takes-two-walkthrough-progress";

  const savedProgress = JSON.parse(localStorage.getItem(storageKey) || "{}");

  const persistProgress = () => {
    const values = {};
    document.querySelectorAll("[data-progress-check]").forEach((item) => {
      values[item.dataset.progressCheck] = item.checked;
    });
    localStorage.setItem(storageKey, JSON.stringify(values));
  };

  document.querySelectorAll("[data-progress-check]").forEach((item) => {
    item.checked = Boolean(savedProgress[item.dataset.progressCheck]);
    item.addEventListener("change", persistProgress);
  });

  const syncScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
    header.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  const closeNav = () => {
    body.classList.remove("nav-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "打开导航");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "关闭导航" : "打开导航");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.querySelectorAll("[data-scroll-to]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.scrollTo);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const applyFilters = () => {
    const active = document.querySelector("[data-filter].is-active")?.dataset.filter || "all";
    const query = (searchInput.value || "").trim().toLowerCase();
    let visibleCount = 0;

    chapterCards.forEach((card) => {
      const stageMatch = active === "all" || card.dataset.stage.includes(active);
      const text = `${card.textContent} ${card.dataset.keywords}`.toLowerCase();
      const searchMatch = !query || text.includes(query);
      const isVisible = stageMatch && searchMatch;
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) visibleCount += 1;
    });

    emptyState.hidden = visibleCount > 0;
  };

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((item) => item.classList.toggle("is-active", item === button));
      applyFilters();
    });
  });

  searchInput.addEventListener("input", applyFilters);

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
      });
    },
    { rootMargin: "-25% 0px -58% 0px", threshold: [0.1, 0.35, 0.6] }
  );

  navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean)
    .forEach((section) => sectionObserver.observe(section));

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  document.querySelectorAll(".reveal").forEach((node) => revealObserver.observe(node));

  window.addEventListener("scroll", syncScroll, { passive: true });
  window.addEventListener("resize", syncScroll);
  syncScroll();
  applyFilters();
})();
