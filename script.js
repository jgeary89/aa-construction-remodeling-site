const navToggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");
const contactForm = document.querySelector("[data-contact-form]");
const formNote = document.querySelector("[data-form-note]");
const galleryGrid = document.querySelector("[data-gallery-grid]");
const galleryStatusNodes = [...document.querySelectorAll("[data-gallery-status]")];
const galleryTitle = document.querySelector("[data-gallery-title]");
const galleryModal = document.querySelector("[data-gallery-modal]");
const galleryCloseButtons = [...document.querySelectorAll("[data-gallery-close]")];
const galleryFilterButtons = [...document.querySelectorAll("[data-gallery-filter]")];

const fallbackGalleryItems = [
  {
    id: "seed-kitchen",
    title: "Kitchen Remodel",
    caption: "Kitchen cabinetry, stone counters, tile backsplash, and lighting inspiration.",
    category: "kitchen",
    mediaType: "IMAGE",
    src: "assets/kitchen-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
  {
    id: "seed-bathroom",
    title: "Bathroom Renovation",
    caption: "Bathroom tile, glass shower, vanity, fixtures, and clean finish work.",
    category: "bathroom",
    mediaType: "IMAGE",
    src: "assets/bath-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
  {
    id: "seed-exterior",
    title: "Exterior Improvement",
    caption: "Exterior entry, porch, siding accents, door, and trim project inspiration.",
    category: "exterior",
    mediaType: "IMAGE",
    src: "assets/exterior-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
  {
    id: "seed-interior",
    title: "Interior Upgrade",
    caption: "Interior finish work, flooring, trim, living space, and room refresh inspiration.",
    category: "interior",
    mediaType: "IMAGE",
    src: "assets/hero-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
  {
    id: "seed-new-build",
    title: "New Build",
    caption: "New construction, ground-up build, framing, foundation, and finish work inspiration.",
    category: "new-builds",
    mediaType: "IMAGE",
    src: "assets/hero-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
  {
    id: "seed-addition",
    title: "Room Addition",
    caption: "Room addition, expanded living space, build-out, tie-in, and home expansion inspiration.",
    category: "additions",
    mediaType: "IMAGE",
    src: "assets/exterior-remodel.png",
    permalink: "https://www.instagram.com/aaconstruction.inc/",
  },
];

let galleryItems = fallbackGalleryItems;
let activeGalleryFilter = "all";
let galleryLastFocus = null;

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation");
    }
  });
}

if (contactForm && formNote) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const message = [
      "Hi A&A Construction & Remodeling, I would like to talk about a project.",
      "",
      `Name: ${data.get("name")}`,
      `Phone: ${data.get("phone")}`,
      `Email: ${data.get("email")}`,
      `Project type: ${data.get("project")}`,
      `Message: ${data.get("message")}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(message);
      formNote.textContent = "Message copied. Open Instagram and paste it to start the conversation.";
    } catch {
      formNote.textContent = "Message is ready. Copy your details and send them through Instagram.";
    }
  });
}

function classifyGalleryItem(item) {
  if (item.category) return item.category;

  const text = `${item.title || ""} ${item.caption || ""}`.toLowerCase();
  const categories = [
    ["kitchen", ["kitchen", "cabinet", "counter", "backsplash", "island", "pantry", "sink"]],
    ["bathroom", ["bath", "bathroom", "shower", "vanity", "toilet", "tub", "waterproof"]],
    ["exterior", ["exterior", "siding", "porch", "entry", "door", "deck", "roof", "gutter", "fascia"]],
    ["interior", ["interior", "drywall", "paint", "flooring", "trim", "baseboard", "living", "bedroom"]],
    ["new-builds", ["new build", "new-build", "new construction", "ground up", "ground-up", "framing", "foundation"]],
    ["additions", ["addition", "room addition", "add-on", "add on", "build-out", "buildout", "expansion"]],
    ["repair", ["repair", "restore", "patch", "damage", "replace", "fix"]],
  ];

  return categories.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] || "interior";
}

function prettyCategory(category) {
  return {
    all: "All",
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    interior: "Interior",
    exterior: "Exterior",
    "new-builds": "New Build",
    additions: "Room Addition",
    repair: "Repair",
  }[category] || "Project";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getFilteredGalleryItems() {
  return activeGalleryFilter === "all"
    ? galleryItems
    : galleryItems.filter((item) => classifyGalleryItem(item) === activeGalleryFilter);
}

function syncGalleryFilterButtons() {
  galleryFilterButtons.forEach((button) => {
    const isActive = (button.dataset.galleryFilter || "all") === activeGalleryFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function updateGallerySummary(filteredItems) {
  const label =
    activeGalleryFilter === "all"
      ? "project media items"
      : `${prettyCategory(activeGalleryFilter).toLowerCase()} items`;
  const summary = `${filteredItems.length} ${label} loaded`;

  galleryStatusNodes.forEach((status) => {
    status.textContent = summary;
  });

  if (galleryTitle) {
    galleryTitle.textContent =
      activeGalleryFilter === "all" ? "All Projects" : `${prettyCategory(activeGalleryFilter)} Projects`;
  }
}

function renderGallery() {
  const filteredItems = getFilteredGalleryItems();

  if (galleryGrid) {
    galleryGrid.innerHTML = filteredItems.length
      ? filteredItems
          .map((item) => {
            const category = classifyGalleryItem(item);
            const mediaType = (item.mediaType || item.media_type || "IMAGE").toUpperCase();
            const source = item.src || item.mediaUrl || item.media_url || item.thumbnailUrl || item.thumbnail_url;
            const poster = item.thumbnailUrl || item.thumbnail_url || source;
            const title = item.title || `${prettyCategory(category)} Project`;
            const caption = item.caption || "Latest A&A project media.";
            const media =
              mediaType === "VIDEO"
                ? `<video controls playsinline preload="metadata" poster="${escapeHtml(poster)}"><source src="${escapeHtml(source)}"></video>`
                : `<img src="${escapeHtml(source)}" alt="${escapeHtml(title)}">`;

            return `
              <article class="gallery-card" data-category="${escapeHtml(category)}">
                <div class="gallery-card-inner">
                  ${media}
                  <div class="gallery-card-copy">
                    <div class="gallery-meta">
                      <span class="media-chip">${escapeHtml(prettyCategory(category))}</span>
                      ${mediaType === "VIDEO" ? '<span class="media-chip video">Video</span>' : ""}
                    </div>
                    <h3>${escapeHtml(title)}</h3>
                    <p>${escapeHtml(caption)}</p>
                  </div>
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="gallery-empty">No ${escapeHtml(prettyCategory(activeGalleryFilter).toLowerCase())} media is loaded yet.</p>`;
  }

  updateGallerySummary(filteredItems);
}

function setActiveGalleryFilter(filter) {
  activeGalleryFilter = filter || "all";
  syncGalleryFilterButtons();
  renderGallery();
}

function openGallery(filter = activeGalleryFilter) {
  if (!galleryModal) return;

  const wasOpen = galleryModal.classList.contains("is-open");
  galleryLastFocus = wasOpen ? galleryLastFocus : document.activeElement;
  setActiveGalleryFilter(filter);
  galleryModal.classList.add("is-open");
  galleryModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("gallery-modal-open");

  if (!wasOpen) {
    const closeButton = galleryModal.querySelector("[data-gallery-close]:not(.gallery-modal-backdrop)");
    closeButton?.focus({ preventScroll: true });
  }
}

function closeGallery() {
  if (!galleryModal || !galleryModal.classList.contains("is-open")) return;

  galleryModal.classList.remove("is-open");
  galleryModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gallery-modal-open");
  galleryModal.querySelectorAll("video").forEach((video) => video.pause());

  if (galleryLastFocus instanceof HTMLElement) {
    galleryLastFocus.focus({ preventScroll: true });
  }
}

function keepGalleryFocus(event) {
  if (!galleryModal?.classList.contains("is-open") || event.key !== "Tab") return;

  const focusable = [...galleryModal.querySelectorAll("button, video, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hasAttribute("disabled") && element.offsetParent !== null);

  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

galleryFilterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    openGallery(button.dataset.galleryFilter || "all");
  });
});

galleryCloseButtons.forEach((button) => {
  button.addEventListener("click", closeGallery);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeGallery();
  keepGalleryFocus(event);
});

async function loadGalleryFeed() {
  try {
    const response = await fetch("data/gallery-feed.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Gallery feed unavailable");
    const feed = await response.json();
    galleryItems = Array.isArray(feed.items) && feed.items.length ? feed.items : fallbackGalleryItems;
  } catch {
    galleryItems = fallbackGalleryItems;
  }

  renderGallery();
}

syncGalleryFilterButtons();
loadGalleryFeed();
