import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { collection, getDocs, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

// ==================== DATA ====================
const appsData = [
  { id: 'a1', title: 'ASK Permission', icon: 'fa-clipboard-check', category: 'tools', file: 'permission.html' },
  { id: 'a2', title: 'AI', icon: 'fa-brain', category: 'tools', file: 'ai.html' },
  { id: 'a3', title: 'Chat', icon: 'fa-comments', category: 'tools', file: 'chat.html' },
  { id: 'a4', title: 'News', icon: 'fa-newspaper', category: 'tools', file: 'news.html' },

  
  { id: 'a7', title: 'Result', icon: 'fa-chart-line', category: 'tools', file: 'results.html' },
  
  { id: 'a9', title: 'Science', icon: 'fa-book', category: 'learning', file: 'soon.html' },
  { id: 'a10', title: 'Quizzes', icon: 'fa-pen-to-square', category: 'learning', file: 'soon.html' },
  { id: 'a11', title: 'Games', icon: 'fa-gamepad', category: 'fun', file: 'game.html' },
  { id: 'a8', title: 'Dev', icon: 'fa-code', category: 'learning', file: 'dev.html' },
  

 
 
];

const staffData = [
  { name: 'Mr. Dejene', role: 'director', roleLabel: 'S/Director', subject: 'School Leadership', img: 'djne.png', bio: 'Visionary leader with 20+ years in education.' },
  { name: 'Mr. Baba', role: 'leader', roleLabel: 'Unit Leader', subject: 'Administration', img: 'img.png', bio: 'MA in School Administration. 15 years experience.' },
  { name: 'Ms. Mama', role: 'teacher', roleLabel: 'Teacher', subject: 'Mathematics', img: 'img.png', bio: 'AP Calculus instructor and math competition coach.' },
  { name: 'Mr. ema', role: 'teacher', roleLabel: 'Teacher', subject: 'Science', img: 'img.png', bio: 'STEM program coordinator and science fair mentor.' },
  { name: 'Ms. bema', role: 'teacher', roleLabel: 'Teacher', subject: 'English', img: 'img.png', bio: 'Debate club mentor and creative writing workshop leader.' },
];

const achieversData = [
  { name: 'Jamal Williams', cat: 'gpa', achievement: '4.0 GPA Valedictorian', img: 'https://randomuser.me/api/portraits/men/11.jpg' },
  { name: 'Alex Chen', cat: 'it', achievement: 'National Coding Champion', img: 'https://randomuser.me/api/portraits/men/22.jpg' },
  { name: 'Maria Rodriguez', cat: 'gpa', achievement: '3.9 GPA Honor Roll', img: 'https://randomuser.me/api/portraits/women/33.jpg' },
  { name: 'Sophie Park', cat: 'art', achievement: 'State Art Competition Winner', img: 'https://randomuser.me/api/portraits/women/55.jpg' },
  { name: 'Ethan Brown', cat: 'football', achievement: 'Team Captain State Finals', img: 'https://randomuser.me/api/portraits/men/44.jpg' },
  { name: 'Olivia Davis', cat: 'debate', achievement: 'Regional Debate Champion', img: 'https://randomuser.me/api/portraits/women/66.jpg' },
  { name: 'Noah Martinez', cat: 'it', achievement: 'App Development Award', img: 'https://randomuser.me/api/portraits/men/77.jpg' },
  { name: 'Ava Thompson', cat: 'gpa', achievement: '3.8 GPA Honor Roll', img: 'https://randomuser.me/api/portraits/women/88.jpg' },
];

const timelineData = [
  { year: '2005', title: 'Foundation', desc: 'SASS was founded with a vision to revolutionize education.', details: 'Established by Fikir Hatamnu with 50 students.' },
  { year: '2010', title: 'First Expansion', desc: 'Added new campus wing and digital tools.', details: 'First computer lab with 60 workstations.' },
  { year: '2015', title: 'Digital Transformation', desc: 'Launched Smart School Platform.', details: 'Won National Education Innovation Award.' },
  { year: '2024', title: 'SASS 2.0', desc: 'Complete platform redesign with 24+ tools.', details: 'New interface and gamified learning.' },
];

const phrasesByLang = {
  en: ['Learn Smarter, Not Harder', 'AI-Powered Insights', 'Real-time Collaboration', 'Gamified Learning'],
  am: ['በብልህነት ተማር፣ በከባድ አይደለም', 'AI-የተጎላበተ ግንዛቤ', 'በእውነተኛ ጊዜ ትብብር', 'በጨዋታ የተደገፈ ትምህርት'],
  om: ['Dubbadhu qaxalee, hin dhamaa', 'Yaada AI-in gargaarame', 'Hojii yeroo dhugaa', 'Barnoota taphaan']
};

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ==================== LANGUAGE ====================
const translations = {
  en: {
    onboarding_title: "Welcome to SASS", onboarding_subtitle: "Tell us about yourself", get_started: "Get Started",
    nav_home: "Home", nav_about: "About", nav_staff: "Staff", nav_achievers: "Achievers", nav_history: "History", nav_apps: "Apps",
    sign_in: "Sign In",
    hero_title: "Smart School Platform", hero_students: "Students", hero_teachers: "Teachers", hero_tools: "Smart Tools",
    about_title: "About Our School", about_subtitle: "Learn about our institution, statistics, and location",
    school_name: "SASS International School", school_address: "Bishoftu, Ethiopia",
    school_hours: "Mon–Fri: 8:00 AM – 4:00 PM", school_established: "Established: 2005",
    school_description: "SASS is a premier international school in Addis Ababa dedicated to academic excellence and innovation. Our campus spans 15 acres with state-of-the-art facilities.",
    staff_title: "Our Staff", staff_subtitle: "Meet our dedicated team of educators",
    achievers_title: "Top Achievers", achievers_subtitle: "Celebrating student excellence across all fields",
    ach_all: "All", ach_gpa: "GPA", ach_it: "IT", ach_football: "Football", ach_art: "Art", ach_debate: "Debate",
    history_title: "School History", history_subtitle: "Our journey through the years",
    apps_title: "Smart Apps", apps_subtitle: "Browse our collection of smart learning tools",
    app_filter_all: "All Categories", app_filter_learning: "Learning", app_filter_tools: "Tools", app_filter_fun: "Fun",
    search_apps: "Search apps...",
    footer_call: "Call Us", footer_email: "Email", footer_home: "Home",
    footer_copy: "© 2024 SASS – Smart Academic School System. All rights reserved.",
    profile_name_label: "Name", profile_subject_label: "Favorite Subject", profile_class_label: "Class",
    save_profile: "Save Profile", favorite_apps_title: "Favorite Apps", reset_data: "Reset All Data",
    toggle_theme: "Toggle Theme", logout: "Logout",
    name_placeholder: "Your Name", subject_placeholder: "Favorite Subject", class_placeholder: "Your Class (e.g. Grade 10)",
  },
  am: {
    onboarding_title: "እንኳን ወደ SASS በደህና መጡ", onboarding_subtitle: "ስለራስዎ ይንገሩን", get_started: "ይጀምሩ",
    nav_home: "መነሻ", nav_about: "ስለ", nav_staff: "ሰራተኞች", nav_achievers: "ውጤቶች", nav_history: "ታሪክ", nav_apps: "መተግበሪያዎች",
    sign_in: "ግባ",
    hero_title: "ስማርት ትምህርት ቤት ሲስተም", hero_students: "ተማሪዎች", hero_teachers: "አስተማሪዎች", hero_tools: "ስማርት መሳሪያዎች",
    about_title: "ስለ ትምህርት ቤታችን", about_subtitle: "ስለ ተቋማችን፣ ስታቲስቲክስ እና አድራሻ ይወቁ",
    school_name: "SASS ዓለም አቀፍ ትምህርት ቤት", school_address: "Bishoftu፣ ኢትዮጵያ",
    school_hours: "ሰኞ–አርብ፡ 8:00 AM – 4:00 PM", school_established: "የተቋቋመው: 2005",
    school_description: "SASS በአዲስ አበባ የሚገኝ ከፍተኛ ደረጃ ያለው ዓለም አቀፍ ትምህርት ቤት ሲሆን ለትምህርታዊ ጥራትና ፈጠራ የቆመ ነው።",
    staff_title: "ሰራተኞቻችን", staff_subtitle: "የኛን ቁርጠኛ አስተማሪዎችን ይተዋወቁ",
    achievers_title: "ምርጥ ተማሪዎች", achievers_subtitle: "በሁሉም ዘርፍ የተማሪዎችን የላቀ ውጤት እናከብራለን",
    ach_all: "ሁሉም", ach_gpa: "GPA", ach_it: "IT", ach_football: "እግር ኳስ", ach_art: "ሥነ ጥበብ", ach_debate: "ክርክር",
    history_title: "የትምህርት ቤቱ ታሪክ", history_subtitle: "በዓመታት ውስጥ ያለው ጉዟችን",
    apps_title: "ስማርት መተግበሪያዎች", apps_subtitle: "የኛን ስማርት የትምህርት መሳሪያዎች ይወቁ",
    app_filter_all: "ሁሉም ምድቦች", app_filter_learning: "ትምህርት", app_filter_tools: "መሳሪያዎች", app_filter_fun: "መዝናኛ",
    search_apps: "መተግበሪያዎችን ይፈልጉ...",
    footer_call: "ይደውሉ", footer_email: "ኢሜል", footer_home: "መነሻ",
    footer_copy: "© 2024 SASS – ስማርት አካዳሚክ ትምህርት ቤት ሲስተም. ሁሉም መብቶች የተጠበቁ ናቸው.",
    profile_name_label: "ስም", profile_subject_label: "የሚወዱት ትምህርት", profile_class_label: "ክፍል",
    save_profile: "መገለጫ አስቀምጥ", favorite_apps_title: "ተወዳጅ መተግበሪያዎች", reset_data: "ሁሉንም ውሂብ አጥፋ",
    toggle_theme: "ገጽታ ቀይር", logout: "ውጣ",
    name_placeholder: "ስምዎ", subject_placeholder: "የሚወዱት ትምህርት", class_placeholder: "ክፍልዎ (ለምሳሌ Grade 10)",
  },
  om: {
    onboarding_title: "Baga nagaan SASS dhuftan", onboarding_subtitle: "Waa'ee keessan nutti himaa", get_started: "Jalqabi",
    nav_home: "Seensa", nav_about: "Waa'ee", nav_staff: "Hojjattoota", nav_achievers: "Milkaa'oota", nav_history: "Seenaa", nav_apps: "Appilikeeshinii",
    sign_in: "Galmaa'i",
    hero_title: "Sirna Barnoota Smart", hero_students: "Barattoota", hero_teachers: "Barsiisota", hero_tools: "Meeshaalee Smart",
    about_title: "Waa'ee Mana Barnootaa Keenyaa", about_subtitle: "Waa'ee dhaabbata keenyaa, istaatistiksii fi bakka jireenyaa baradhaa",
    school_name: "SASS Mana Barnootaa Idil-addunyaa", school_address: "Bishooftuu, Itoophiyaa",
    school_hours: "Wiixata–Jimaata: 8:00 AM – 4:00 PM", school_established: "Kan hundeefame: 2005",
    school_description: "SASS mana barnootaa idil-addunyaa olaanaa Finfinnee keessatti argamu kan akkaataan barnootaa fi haaromsaaf of kennedha.",
    staff_title: "Hojjattoota Keenyaa", staff_subtitle: "Barsiisota keenyaa of kennoo ta'an wal barri",
    achievers_title: "Milkaa'oota Gurguddoo", achievers_subtitle: "Barattoota hundumaa keessatti milkaa'ina argataniif kabaja",
    ach_all: "Hunda", ach_gpa: "GPA", ach_it: "IT", ach_football: "Kubbaa Miillaa", ach_art: "Aartii", ach_debate: "Falmii",
    history_title: "Seenaa Mana Barnootaa", history_subtitle: "Imala keenya waggaawwan keessa",
    apps_title: "Appilikeeshinii Smart", apps_subtitle: "Meeshaalee barnootaa keenyaa sakatta'i",
    app_filter_all: "Ramaddii Hunda", app_filter_learning: "Barnoota", app_filter_tools: "Meeshaalee", app_filter_fun: "Bashannana",
    search_apps: "Appilikeeshinii barbaadi...",
    footer_call: "Bilbilaa", footer_email: "Email", footer_home: "Seensa",
    footer_copy: "© 2024 SASS – Sirna Barnoota Smart. Mirgi hundi eegamaadha.",
    profile_name_label: "Maqaa", profile_subject_label: "Barnoota Jaallattu", profile_class_label: "Kutaa",
    save_profile: "Profile Olkaa'i", favorite_apps_title: "Appilikeeshinii Jaallattan", reset_data: "Daataa Hunda Haqi",
    toggle_theme: "Theme Jijjiiri", logout: "Ba'i",
    name_placeholder: "Maqaa Kee", subject_placeholder: "Barnoota Jaallattu", class_placeholder: "Kutaa Kee (fkn Grade 10)",
  }
};

// ==================== GLOBAL STATE ====================
let currentLang = localStorage.getItem('sass_lang') || 'en';
let theme = localStorage.getItem('sass_theme') || 'dark';
let favorites = JSON.parse(localStorage.getItem('sass_favorites') || '[]');
let userProfileData = null;
let currentUser = null;
let heroCounted = false;
let achieverCat = 'all';
let pIdx = 0, cIdx = 0, deleting = false;
let botHideTimer, botDragOffset, botWasDragged, botStartPos;
let botX = window.innerWidth - 70, botY = window.innerHeight - 120;
let mapZoom = 1;

// ==================== FUNCTIONS ====================

function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('sass_lang', lang);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (translations[lang] && translations[lang][key]) el.placeholder = translations[lang][key];
  });
  const langSelect = $('#lang-select');
  if (langSelect) langSelect.value = lang;
  restartTyping();
}

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  const icon = document.querySelector('#theme-toggle i');
  if (icon) icon.className = t === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
  localStorage.setItem('sass_theme', t);
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  $('#toast-container').appendChild(t);
  setTimeout(() => t.remove(), 2500);
}

function typeLoop() {
  const phrases = phrasesByLang[currentLang] || phrasesByLang.en;
  const cur = phrases[pIdx];
  if (!cur) return setTimeout(typeLoop, 200);
  const typingSpan = $('#typing-span');
  if (deleting) {
    typingSpan.textContent = cur.substring(0, cIdx - 1);
    cIdx--;
    if (cIdx <= 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; }
    setTimeout(typeLoop, 38);
  } else {
    typingSpan.textContent = cur.substring(0, cIdx + 1);
    cIdx++;
    if (cIdx >= cur.length) { setTimeout(() => { deleting = true; typeLoop(); }, 1700); }
    else setTimeout(typeLoop, 65);
  }
}
function restartTyping() {
  pIdx = 0; cIdx = 0; deleting = false;
  const span = $('#typing-span');
  if (span) span.textContent = '';
  typeLoop();
}

async function fetchUserProfile(uid) {
  const cols = ['admins', 'teachers', 'students'];
  for (const col of cols) {
    try {
      const q = query(collection(db, col), where('uid', '==', uid));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        return {
          name: data.name || data.displayName || '',
          email: currentUser?.email || data.email || '',
          role: col.slice(0, -1),
          docId: snap.docs[0].id,
          collection: col,
          subject: data.subject || '',
          class: data.class || ''
        };
      }
    } catch (e) {}
  }
  return null;
}

function updateAuthUI() {
  const signInBtn = $('#sign-in-btn');
  const profileBtn = $('#profile-btn');
  if (currentUser) {
    if (signInBtn) signInBtn.style.display = 'none';
    if (profileBtn) profileBtn.style.display = 'inline-flex';
    const emailEl = $('#profile-email-display');
    if (emailEl) emailEl.textContent = userProfileData?.email || currentUser.email || '';
    const nameEl = $('#profile-name-display');
    if (nameEl) nameEl.textContent = userProfileData?.name || currentUser.email?.split('@')[0] || 'Alex Mentor';
    const roleEl = $('#profile-role-display');
    if (roleEl) roleEl.textContent = userProfileData?.role || '';
  } else {
    if (signInBtn) signInBtn.style.display = 'inline-flex';
    if (profileBtn) profileBtn.style.display = 'none';
    const emailEl = $('#profile-email-display');
    if (emailEl) emailEl.textContent = '';
    const nameEl = $('#profile-name-display');
    if (nameEl) nameEl.textContent = 'Alex Mentor';
    const roleEl = $('#profile-role-display');
    if (roleEl) roleEl.textContent = '';
  }
}

function showProfileLoading(show) {
  const el = $('#profile-loading');
  if (el) el.style.display = show ? 'flex' : 'none';
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  updateAuthUI();
  if (user) {
    showProfileLoading(true);
    userProfileData = await fetchUserProfile(user.uid);
    showProfileLoading(false);
    updateAuthUI();
    const onboarding = $('#onboarding-overlay');
    if (onboarding) onboarding.classList.remove('active');
  } else {
    userProfileData = null;
    updateAuthUI();
    const local = JSON.parse(localStorage.getItem('sass_profile') || 'null');
    if (!local?.name) {
      setTimeout(() => {
        const onboarding = $('#onboarding-overlay');
        if (onboarding) onboarding.classList.add('active');
      }, 700);
    }
  }
});

const signInBtn = $('#sign-in-btn');
if (signInBtn) signInBtn.addEventListener('click', () => window.location.href = 'login.html');
const logoutBtn = $('#logout-btn');
if (logoutBtn) logoutBtn.addEventListener('click', async () => {
  await signOut(auth);
  closeSidebar();
});

// Sidebar
async function openSidebar() {
  const sidebar = $('#profile-sidebar');
  if (sidebar) sidebar.classList.add('open');
  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.classList.add('active');
  renderFavList();

  if (currentUser) {
    try {
      const latest = await fetchUserProfile(currentUser.uid);
      if (latest) {
        userProfileData = latest;
        updateAuthUI();
        loadProfileToSidebar();
      }
    } catch (err) {
      console.warn('Could not fetch latest profile – using cached data');
      loadProfileToSidebar();
    }
  } else {
    loadProfileToSidebar();
  }
}

function closeSidebar() {
  const sidebar = $('#profile-sidebar');
  if (sidebar) sidebar.classList.remove('open');
  const overlay = $('#sidebar-overlay');
  if (overlay) overlay.classList.remove('active');
}

function loadProfileToSidebar() {
  const input = $('#profile-edit-name');
  if (input) input.value = userProfileData?.name || '';
}

const profileBtn = $('#profile-btn');
if (profileBtn) profileBtn.onclick = openSidebar;
const closeSidebarBtn = $('#close-sidebar');
if (closeSidebarBtn) closeSidebarBtn.onclick = closeSidebar;
const sidebarOverlay = $('#sidebar-overlay');
if (sidebarOverlay) sidebarOverlay.onclick = closeSidebar;

const onboardSave = $('#onboard-save-btn');
if (onboardSave) onboardSave.onclick = () => {
  const name = $('#onboard-name').value.trim();
  if (!name) { showToast('Please enter your name'); return; }
  localStorage.setItem('sass_profile', JSON.stringify({
    name,
    subject: $('#onboard-subject').value.trim(),
    class: $('#onboard-class').value.trim()
  }));
  const onboarding = $('#onboarding-overlay');
  if (onboarding) onboarding.classList.remove('active');
  showToast('Welcome, ' + name + '!');
};

window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = $('#loader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }
  }, 500);
  applyLanguage(currentLang);
  initSchoolStatsChart();
  observeHeroCounters();
  setTimeout(renderStaff, 100);
  setTimeout(renderAchievers, 200);
  setTimeout(renderTimeline, 300);
  renderAllApps();
});

window.scrollToSection = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

function observeHeroCounters() {
  const hero = $('#hero');
  if (!hero) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !heroCounted) { heroCounted = true; animateCounters(); }
  }, { threshold: 0.25 });
  obs.observe(hero);
  setTimeout(() => { if (!heroCounted) { heroCounted = true; animateCounters(); } }, 1800);
}
function animateCounters() {
  $$('#hero .stat-num').forEach(el => {
    const tgt = parseInt(el.dataset.target);
    const dur = 1600, st = performance.now();
    function upd(ts) {
      const prog = Math.min((ts - st) / dur, 1);
      el.textContent = Math.floor(prog * tgt).toLocaleString() + '+';
      if (prog < 1) requestAnimationFrame(upd);
      else el.textContent = tgt.toLocaleString() + '+';
    }
    requestAnimationFrame(upd);
  });
}

function renderStaff() {
  const grid = $('#staff-grid');
  if (!grid) return;
  grid.innerHTML = '';
  staffData.forEach((s, i) => {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.style.transitionDelay = (i * 0.08) + 's';
    card.innerHTML = `<div class="card-inner"><div class="image-zone"><div class="moving-glow"></div><img class="teacher-img" src="${s.img}" alt="${s.name}" loading="lazy"></div><h2 class="teacher-name">${s.name}</h2><div class="teacher-role ${s.role}">${s.roleLabel}</div><div class="teacher-subject">${s.subject}</div></div>`;
    card.onclick = () => openStaffModal(s);
    grid.appendChild(card);
  });
  observeStaffCards();
}
function observeStaffCards() {
  const cards = $$('.teacher-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('revealed');
        const img = e.target.querySelector('.teacher-img');
        if (img) img.classList.add('animate-img');
      }
    });
  }, { threshold: 0.2 });
  cards.forEach(c => obs.observe(c));
}
function openStaffModal(s) {
  const content = $('#staff-modal-content');
  if (!content) return;
  content.innerHTML = `<img src="${s.img}" style="width:100px;height:100px;border-radius:50%;object-fit:cover;border:3px solid var(--blue);margin-bottom:10px;"><h3>${s.name}</h3><span class="teacher-role ${s.role}" style="display:inline-block;margin-bottom:8px;">${s.roleLabel}</span><p style="color:var(--text2);">${s.subject}</p><p>${s.bio}</p>`;
  openModal('staff-modal');
}

function renderAchievers() {
  const grid = $('#achievers-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const list = achieverCat === 'all' ? achieversData : achieversData.filter(a => a.cat === achieverCat);
  list.forEach((a, i) => {
    const card = document.createElement('div');
    card.className = 'achiever-card';
    card.style.transitionDelay = (i * 0.06) + 's';
    card.innerHTML = `<div class="ach-img-wrap"><img src="${a.img}" alt="${a.name}"></div><h4>${a.name}</h4><p class="ach-desc">${a.achievement}</p><span class="ach-cat-tag">${a.cat}</span>`;
    grid.appendChild(card);
  });
  observeAchieverCards();
}
function observeAchieverCards() {
  const cards = $$('.achiever-card');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('revealed'); });
  }, { threshold: 0.12 });
  cards.forEach(c => obs.observe(c));
}
const achieverCategories = $('#achiever-categories');
if (achieverCategories) achieverCategories.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;
  $$('#achiever-categories button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  achieverCat = btn.dataset.cat;
  renderAchievers();
});

function renderTimeline() {
  const tl = $('#timeline');
  if (!tl) return;
  tl.innerHTML = '';
  timelineData.forEach(ev => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `<div class="pin"></div><div class="timeline-card"><span class="year">${ev.year}</span><h3>${ev.title}</h3><p style="color:var(--text2);font-size:0.85rem;">${ev.desc}</p><span class="info-icon"><i class="fa-solid fa-circle-info"></i></span></div>`;
    item.querySelector('.info-icon').onclick = e => {
      e.stopPropagation();
      const titleEl = $('#timeline-modal-title');
      if (titleEl) titleEl.textContent = ev.year + ' - ' + ev.title;
      const descEl = $('#timeline-modal-desc');
      if (descEl) descEl.textContent = ev.details;
      openModal('timeline-modal');
    };
    tl.appendChild(item);
  });
  observeTimeline();
}
function observeTimeline() {
  const items = $$('.timeline-item');
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    if ($$('.timeline-item.visible').length >= items.length) {
      const timeline = $('#timeline');
      if (timeline) timeline.classList.add('fill-line');
    }
  }, { threshold: 0.2 });
  items.forEach(it => obs.observe(it));
}

function saveFavs() { localStorage.setItem('sass_favorites', JSON.stringify(favorites)); }
function toggleFav(id) {
  const idx = favorites.indexOf(id);
  if (idx > -1) { favorites.splice(idx, 1); showToast('Removed from favorites'); }
  else { favorites.push(id); showToast('Added to favorites'); }
  saveFavs();
  renderAllApps();
  renderFavList();
}
function isFav(id) { return favorites.includes(id); }
function createAppCard(app) {
  const card = document.createElement('div');
  card.className = 'app-card';
  card.setAttribute('data-category', app.category);
  card.innerHTML = `<button class="btn-fav-app ${isFav(app.id) ? 'favorited' : ''}" data-app-id="${app.id}"><i class="fa-solid fa-heart"></i></button><div class="app-icon-wrap"><i class="fa-solid ${app.icon}"></i></div><h4>${app.title}</h4>`;
  card.querySelector('.btn-fav-app').onclick = e => { e.stopPropagation(); toggleFav(app.id); };
  card.onclick = () => openAppIframe(app);
  return card;
}
function renderAllApps() {
  const catV = $('#app-category-filter')?.value || 'all';
  const searchV = ($('#app-search-local')?.value || '') + ' ' + ($('#global-search')?.value || '');
  const filtered = appsData.filter(a => (catV === 'all' || a.category === catV) && (!searchV.trim() || a.title.toLowerCase().includes(searchV.toLowerCase())));
  const grid = $('#apps-grid');
  if (!grid) return;
  grid.innerHTML = '';
  filtered.forEach(a => grid.appendChild(createAppCard(a)));
}
function openAppIframe(app) {
  const titleEl = $('#iframe-title');
  if (titleEl) titleEl.textContent = app.title;
  const iframe = $('#iframe-content');
  if (iframe) iframe.src = app.file;
  const overlay = $('#iframe-overlay');
  if (overlay) overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function renderFavList() {
  const list = $('#fav-list-sidebar');
  if (!list) return;
  list.innerHTML = '';
  if (favorites.length === 0) { list.innerHTML = '<li style="color:var(--text2);">No favorites</li>'; return; }
  favorites.forEach(fid => {
    const app = appsData.find(a => a.id === fid);
    if (!app) return;
    const li = document.createElement('li');
    li.innerHTML = `<span><i class="fa-solid ${app.icon}"></i> ${app.title}</span><button data-remove="${fid}"><i class="fa-solid fa-xmark"></i></button>`;
    li.querySelector('button').onclick = () => { toggleFav(fid); renderFavList(); };
    list.appendChild(li);
  });
}
const iframeClose = $('#iframe-close-btn');
if (iframeClose) iframeClose.onclick = () => {
  const overlay = $('#iframe-overlay');
  if (overlay) overlay.classList.remove('active');
  const iframe = $('#iframe-content');
  if (iframe) iframe.src = '';
  document.body.style.overflow = '';
};
const iframeOverlay = $('#iframe-overlay');
if (iframeOverlay) iframeOverlay.addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('active');
    const iframe = $('#iframe-content');
    if (iframe) iframe.src = '';
    document.body.style.overflow = '';
  }
});
const appCategoryFilter = $('#app-category-filter');
if (appCategoryFilter) appCategoryFilter.addEventListener('change', renderAllApps);
const appSearchLocal = $('#app-search-local');
if (appSearchLocal) appSearchLocal.addEventListener('input', renderAllApps);
const globalSearch = $('#global-search');
if (globalSearch) globalSearch.addEventListener('input', renderAllApps);

const mapZoomIn = $('#map-zoom-in');
if (mapZoomIn) mapZoomIn.onclick = () => { mapZoom = Math.min(2.5, mapZoom + 0.2); const mi = $('#map-inner'); if (mi) mi.style.transform = `scale(${mapZoom})`; };
const mapZoomOut = $('#map-zoom-out');
if (mapZoomOut) mapZoomOut.onclick = () => { mapZoom = Math.max(0.5, mapZoom - 0.2); const mi = $('#map-inner'); if (mi) mi.style.transform = `scale(${mapZoom})`; };
const mapZoomReset = $('#map-zoom-reset');
if (mapZoomReset) mapZoomReset.onclick = () => { mapZoom = 1; const mi = $('#map-inner'); if (mi) mi.style.transform = 'scale(1)'; };

window.openModal = id => {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('active');
};
window.closeModal = id => {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('active');
};
$$('.modal-overlay').forEach(m => m.addEventListener('click', function(e) { if (e.target === this) this.classList.remove('active'); }));

// ==================== FLOATING BOT ====================
const bot = $('#floating-bot');
function positionBot() {
  if (!bot) return;
  bot.style.left = botX + 'px';
  bot.style.top = botY + 'px';
  bot.style.right = 'auto';
  bot.style.bottom = 'auto';
}
function hideBotToEdge() {
  if (!bot) return;
  const rect = bot.getBoundingClientRect();
  const w = window.innerWidth;
  const distLeft = rect.left;
  const distRight = w - rect.right;
  let tx = 0;
  if (distLeft < distRight) {
    tx = -rect.left - 25;
  } else {
    tx = w - rect.right + 25;
  }
  bot.style.transform = `translate(${tx}px, 0)`;
  bot.classList.add('hiding');
}
function resetBot() {
  if (!bot) return;
  bot.classList.remove('hiding');
  bot.style.transform = '';
  clearTimeout(botHideTimer);
  botHideTimer = setTimeout(hideBotToEdge, 5000);
}
if (bot) {
  bot.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    botWasDragged = false;
    botStartPos = { x: e.clientX, y: e.clientY };
    const rect = bot.getBoundingClientRect();
    botDragOffset = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    bot.classList.add('dragging');
    resetBot();
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!bot.classList.contains('dragging')) return;
    if (Math.abs(e.clientX - botStartPos.x) > 3 || Math.abs(e.clientY - botStartPos.y) > 3) botWasDragged = true;
    botX = Math.max(0, Math.min(window.innerWidth - 50, e.clientX - botDragOffset.x));
    botY = Math.max(0, Math.min(window.innerHeight - 50, e.clientY - botDragOffset.y));
    positionBot();
    resetBot();
  });
  document.addEventListener('mouseup', () => {
    if (bot.classList.contains('dragging')) {
      bot.classList.remove('dragging');
      if (!botWasDragged) {
        const iframeTitle = $('#iframe-title');
        if (iframeTitle) iframeTitle.textContent = 'AI Assistant';
        const iframeContent = $('#iframe-content');
        if (iframeContent) iframeContent.src = 'ai.html';
        const iframeOverlay = $('#iframe-overlay');
        if (iframeOverlay) iframeOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      resetBot();
    }
  });
  positionBot();
  resetBot();
  window.addEventListener('resize', () => {
    botX = Math.min(botX, window.innerWidth - 50);
    botY = Math.min(botY, window.innerHeight - 50);
    positionBot();
  });
}

function initSchoolStatsChart() {
  const canvas = $('#school-stats-chart');
  if (!canvas) return;

  const styles = getComputedStyle(document.documentElement);
  const primary = styles.getPropertyValue('--primary').trim() || '#38bdf8';
  const accent = styles.getPropertyValue('--accent').trim() || '#818cf8';
  const textColor = styles.getPropertyValue('--text2').trim() || '#94a3b8';

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: ['2018', '2019', '2020', '2021', '2022', '2023', '2024'],
      datasets: [
        {
          label: 'Students',
          data: [800, 1100, 1400, 1700, 2000, 2250, 2450],
          borderColor: primary,
          backgroundColor: primary + '14',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Teachers',
          data: [30, 40, 48, 56, 65, 75, 84],
          borderColor: accent,
          backgroundColor: accent + '14',
          fill: true,
          tension: 0.4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: textColor }
        }
      },
      scales: {
        x: { ticks: { color: textColor } },
        y: { ticks: { color: textColor }, beginAtZero: true }
      }
    }
  });
}
const resetDataBtn = $('#reset-data-btn');
if (resetDataBtn) resetDataBtn.onclick = () => {
  if (confirm('Reset all data?')) {
    localStorage.clear();
    favorites = [];
    theme = 'dark';
    applyTheme(theme);
    renderAllApps();
    renderFavList();
    closeSidebar();
    setTimeout(() => {
      if (!userProfileData && !localStorage.getItem('sass_profile'))
        $('#onboarding-overlay')?.classList.add('active');
    }, 400);
  }
};

const themeToggle = $('#theme-toggle');
if (themeToggle) themeToggle.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(theme); };
const sidebarThemeToggle = $('#sidebar-theme-toggle');
if (sidebarThemeToggle) sidebarThemeToggle.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; applyTheme(theme); };

const langSelect = $('#lang-select');
if (langSelect) langSelect.addEventListener('change', (e) => applyLanguage(e.target.value));

applyLanguage(currentLang);
applyTheme(theme);

/* ========== NEW UI ENHANCEMENTS (added at end, no existing code touched) ========== */
// Scroll progress bar + Navbar blur on scroll
window.addEventListener('scroll', () => {
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    progressBar.style.width = progress + '%';
  }

  const nav = document.querySelector('nav');
  if (nav) {
    nav.classList.toggle('scrolled', window.scrollY > 50);
  }
});
