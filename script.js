const ACCESS_KEY = "1p4lyiuh-OnwH0tdzfRRBVizzXSr0P_2Mbd2jXANPmE";
const PER_PAGE = 12;

const searchForm = document.getElementById("search-form");
const searchBox = document.getElementById("search-box");
const gallery = document.getElementById("search-result");
const loader = document.getElementById("loader");
const categoryButtons = document.querySelectorAll(".categories button");
const themeToggle = document.getElementById("themeToggle");

let keyword = "";
let page = 1;
let loading = false;
let photos = [];

function showLoader(on = true) {
  loader.style.display = on ? "flex" : "none";
}
function debounce(fn, wait = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function createCard(photo) {
  const card = document.createElement("div");
  card.className = "card";

  const img = document.createElement("img");
  img.dataset.src = photo.urls.small;
  img.alt = photo.alt_description || photo.description || "Unsplash photo";
  card.appendChild(img);

  const chipWrap = document.createElement("div");
  chipWrap.className = "chips";
  const tags = photo.tags?.length
    ? photo.tags.slice(0, 2).map((t) => t.title || t)
    : [];
  if (photo.alt_description)
    tags.push(...photo.alt_description.split(" ").slice(0, 2));
  tags.slice(0, 3).forEach((t) => {
    const c = document.createElement("div");
    c.className = "chip";
    c.textContent = t.length > 18 ? t.slice(0, 16) + "…" : t;
    chipWrap.appendChild(c);
  });
  card.appendChild(chipWrap);

  const info = document.createElement("div");
  info.className = "info";
  info.innerHTML = `<div class="title">${photo.user.name}</div>
  <div class="meta">${photo.width}×${photo.height} • ${photo.likes}♥</div>
  <div style="margin-top:6px;color:rgba(255,255,255,0.9);font-size:12px;max-height:42px;overflow:hidden">${
    photo.alt_description || photo.description || "No description"
  }</div>`;
  card.appendChild(info);

  return card;
}

function lazyLoad() {
  const imgs = document.querySelectorAll("img[data-src]");
  const io = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          obs.unobserve(img);
        }
      });
    },
    { rootMargin: "120px" }
  );
  imgs.forEach((img) => io.observe(img));
}

function addSkeletons(count = 12) {
  const s = [];
  for (let i = 0; i < count; i++) {
    const sk = document.createElement("div");
    sk.className = "skeleton";
    gallery.appendChild(sk);
    s.push(sk);
  }
  return s;
}

async function fetchImages(query, pageNum = 1) {
  if (loading) return;
  loading = true;
  showLoader(true);
  const skeletons = addSkeletons(PER_PAGE);
  const endpoint = new URL("https://api.unsplash.com/search/photos");
  endpoint.searchParams.set("query", query || "random");
  endpoint.searchParams.set("page", pageNum);
  endpoint.searchParams.set("per_page", PER_PAGE);

  try {
    const res = await fetch(endpoint.toString(), {
      headers: {
        Authorization: "Client-ID " + ACCESS_KEY,
        "Accept-Version": "v1",
      },
    });
    if (!res.ok) throw new Error("API error: " + res.status);
    const data = await res.json();
    skeletons.forEach((s) => s.remove());
    if (pageNum === 1) {
      photos = [];
      gallery.innerHTML = "";
    }
    data.results.forEach((p) => {
      photos.push(p);
      gallery.appendChild(createCard(p));
    });
    lazyLoad();
  } catch (err) {
    console.error(err);
    document.querySelectorAll(".skeleton").forEach((s) => s.remove());
  } finally {
    loading = false;
    showLoader(false);
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  keyword = searchBox.value.trim();
  if (!keyword) return alert("Enter a search term");
  page = 1;
  fetchImages(keyword, page);
});
categoryButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    keyword = btn.dataset.cat;
    searchBox.value = keyword;
    page = 1;
    fetchImages(keyword, page);
  });
});

function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  themeToggle.setAttribute("aria-pressed", dark ? "true" : "false");
  localStorage.setItem("ig_theme_dark", dark ? "1" : "0");
}
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.setAttribute("aria-pressed", isDark ? "true" : "false");
  localStorage.setItem("ig_theme_dark", isDark ? "1" : "0");
});
if (localStorage.getItem("ig_theme_dark") === "1") setTheme(true);

const onScroll = debounce(() => {
  if (loading) return;
  const nearBottom =
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 140;
  if (nearBottom && photos.length > 0) {
    page++;
    fetchImages(keyword || "random", page);
  }
}, 180);
window.addEventListener("scroll", onScroll);
// Back-to-Top Button
const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop.style.display = "block";
  } else {
    backToTop.style.display = "none";
  }
});

backToTop.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
