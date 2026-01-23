// Komik Reader - SCROLL ONLY (Cover + pages)
// ✅ Scroll mode only
// ✅ Progress auto update
// ✅ Zoom keyboard (+ / - / 0)
// ✅ Fullscreen on Start Reading
// ✅ Autosave last read
// ✅ Pages drawer (jump)
// ✅ Help modal
// ✅ NEW: Tombol Exit Fullscreen muncul saat fullscreen

const PAGES = [
  { label: "Cover",  src: "assets/cover.jpg" },
  { label: "Page 1", src: "assets/page1.jpg" },
  { label: "Page 2", src: "assets/page2.jpg" },
  { label: "Page 3", src: "assets/page3.jpg" },
  { label: "Page 4", src: "assets/page4.jpg" },
  { label: "Page 5", src: "assets/page5.jpg" },
];

const LS_KEY  = "komik_reader_last_index_v1";
const LS_ZOOM = "komik_reader_zoom_v1";

const el = (id) => document.getElementById(id);

// Elements
const loading     = el("loading");
const progressBar = el("progressBar");
const scrollList  = el("scrollList");

const miniCount = el("miniCount");
const modeTag   = el("modeTag");
const miniInfo  = el("miniInfo");

const btnStart  = el("btnStart");
const btnThumbs = el("btnThumbs");
const btnHelp   = el("btnHelp");

const drawer         = el("drawer");
const thumbs         = el("thumbs");
const drawerBackdrop = el("drawerBackdrop");
const drawerClose    = el("drawerClose");

const modal         = el("modal");
const modalBackdrop = el("modalBackdrop");
const modalClose    = el("modalClose");

const readerFrame = el("readerFrame");
const btnExitFs   = el("btnExitFs");

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

let index = clamp(parseInt(localStorage.getItem(LS_KEY) || "0", 10), 0, PAGES.length - 1);
let zoom  = clamp(parseFloat(localStorage.getItem(LS_ZOOM) || "1"), 0.6, 1.8);

function saveIndex(i){
  index = clamp(i, 0, PAGES.length - 1);
  localStorage.setItem(LS_KEY, String(index));
  setMiniCount();
  setProgressByIndex(index);
}

function setProgressByIndex(i){
  const pct = ((i) / (PAGES.length - 1)) * 100;
  if(progressBar) progressBar.style.width = `${pct}%`;
}

function setMiniCount(){
  if(miniCount) miniCount.textContent = `${index + 1} / ${PAGES.length}`;
}

function setZoom(z){
  zoom = clamp(z, 0.6, 1.8);
  localStorage.setItem(LS_ZOOM, String(zoom));

  document.querySelectorAll(".scrollItem img").forEach(img => {
    img.style.transformOrigin = "top center";
    img.style.transform = `scale(${zoom})`;
  });
}

function openDrawer(){
  if(!drawer) return;
  drawer.classList.add("on");
  drawer.setAttribute("aria-hidden", "false");
}
function closeDrawer(){
  if(!drawer) return;
  drawer.classList.remove("on");
  drawer.setAttribute("aria-hidden", "true");
}
function openModal(){
  if(!modal) return;
  modal.classList.add("on");
  modal.setAttribute("aria-hidden", "false");
}
function closeModal(){
  if(!modal) return;
  modal.classList.remove("on");
  modal.setAttribute("aria-hidden", "true");
}

function setFsUI(){
  if(!readerFrame) return;
  const isFs = !!document.fullscreenElement;
  readerFrame.classList.toggle("is-fs", isFs);
}

async function requestReaderFullscreen(){
  const elem = readerFrame;
  if(!elem) return false;
  try{
    if(!document.fullscreenElement){
      await elem.requestFullscreen?.();
    }
    setFsUI();
    return !!document.fullscreenElement;
  } catch {
    setFsUI();
    return false;
  }
}

function exitFullscreen(){
  document.exitFullscreen?.();
}

function toggleFullscreen(){
  const elem = readerFrame;
  if(!elem) return;
  if(!document.fullscreenElement) elem.requestFullscreen?.();
  else document.exitFullscreen?.();
}

async function preloadAll(){
  const jobs = PAGES.map(p => new Promise((res) => {
    const im = new Image();
    im.onload = () => res(true);
    im.onerror = () => res(false);
    im.src = p.src;
  }));
  await Promise.all(jobs);
}

function buildThumbs(){
  if(!thumbs) return;
  thumbs.innerHTML = "";
  PAGES.forEach((p, i) => {
    const card = document.createElement("button");
    card.className = "thumb";
    card.type = "button";
    card.innerHTML = `
      <img src="${p.src}" alt="${p.label}">
      <div class="cap">${p.label}</div>
    `;
    card.addEventListener("click", () => {
      closeDrawer();
      saveIndex(i);
      const target = scrollList?.querySelector?.(`[data-index="${i}"]`);
      if(target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    thumbs.appendChild(card);
  });
}

function buildScrollList(){
  if(!scrollList) return;
  scrollList.innerHTML = "";

  PAGES.forEach((p, i) => {
    const item = document.createElement("div");
    item.className = "scrollItem";
    item.dataset.index = String(i);
    item.innerHTML = `<img src="${p.src}" alt="${p.label}">`;
    scrollList.appendChild(item);
  });

  // reveal animation
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if(e.isIntersecting) e.target.classList.add("show");
    });
  }, { threshold: 0.12 });

  scrollList.querySelectorAll(".scrollItem").forEach(it => io.observe(it));

  // update index based on scroll
  scrollList.addEventListener("scroll", () => {
    const items = Array.from(scrollList.querySelectorAll(".scrollItem"));
    let best = 0;
    let bestTop = Infinity;

    items.forEach((it, i) => {
      const r = it.getBoundingClientRect();
      const d = Math.abs(r.top - 140);
      if(d < bestTop){
        bestTop = d;
        best = i;
      }
    });

    if(best !== index) saveIndex(best);
  }, { passive: true });
}

function scrollToIndex(i, smooth = true){
  const target = scrollList?.querySelector?.(`[data-index="${i}"]`);
  if(target) target.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

// Init
(async function init(){
  // HUD fixed text
  if(modeTag) modeTag.textContent = "SCROLL";
  if(miniInfo) miniInfo.textContent = "Scroll untuk membaca";

  setMiniCount();
  setProgressByIndex(index);
  setFsUI();

  buildThumbs();
  buildScrollList();

  // loading
  if(loading) loading.classList.remove("hidden");
  await preloadAll();
  if(loading) loading.classList.add("hidden");

  // apply zoom after images exist
  setZoom(zoom);

  // go to last read (no smooth at first load)
  scrollToIndex(index, false);

  // Start Reading: fullscreen + lanjut dari terakhir
  if(btnStart){
    btnStart.addEventListener("click", async () => {
      await requestReaderFullscreen();
      scrollToIndex(index, true);
    });
  }

  // Exit fullscreen button
  if(btnExitFs){
    btnExitFs.addEventListener("click", exitFullscreen);
  }

  // Drawer
  if(btnThumbs) btnThumbs.addEventListener("click", openDrawer);
  if(drawerBackdrop) drawerBackdrop.addEventListener("click", closeDrawer);
  if(drawerClose) drawerClose.addEventListener("click", closeDrawer);

  // Help
  if(btnHelp) btnHelp.addEventListener("click", openModal);
  if(modalBackdrop) modalBackdrop.addEventListener("click", closeModal);
  if(modalClose) modalClose.addEventListener("click", closeModal);

  // Fullscreen change listener (biar tombol muncul/hilang)
  document.addEventListener("fullscreenchange", setFsUI);

  // Keyboard
  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();

    if(key === "t") openDrawer();
    if(key === "h") openModal();

    if(key === "f") toggleFullscreen();

    // zoom
    if(key === "+" || key === "=") setZoom(zoom + 0.1);
    if(key === "-") setZoom(zoom - 0.1);
    if(key === "0") setZoom(1);

    if(key === "escape"){
      closeDrawer();
      closeModal();
      // keluar fullscreen tetap bisa via esc default browser
    }
  });
})();
