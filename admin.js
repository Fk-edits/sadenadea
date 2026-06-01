import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  collection, addDoc, getDocs, query, where, orderBy, doc, getDoc, deleteDoc,
  updateDoc, setDoc, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ==================== THEME ====================
const savedTheme = localStorage.getItem('sass_theme') || 'dark';
document.documentElement.setAttribute('data-theme', savedTheme);
const updateThemeIcon = () => {
  const icon = document.querySelector('#theme-toggle i');
  if (!icon) return;
  const current = document.documentElement.getAttribute('data-theme');
  icon.className = current === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
};
updateThemeIcon();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sass_theme', newTheme);
  updateThemeIcon();
});

// ==================== AUTH ====================
onAuthStateChanged(auth, async (user) => {
  setTimeout(() => {
    const loader = $('#loader');
    if (loader && !loader.classList.contains('hidden')) loader.classList.add('hidden');
  }, 3000);

  if (!user) { window.location.href = 'login.html'; return; }
  try {
    const q = query(collection(db, "admins"), where("uid", "==", user.uid), where("role", "==", "admin"));
    const snap = await getDocs(q);
    if (snap.empty) { await signOut(auth); window.location.href = 'login.html'; return; }
    $('#loader').classList.add('hidden');
    showSection('dashboard');
  } catch (e) {
    console.error(e);
    $('#loader').classList.add('hidden');
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// ==================== SIDEBAR NAVIGATION ====================
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    showSection(link.dataset.section);
  });
});

function showSection(section) {
  const main = $('#admin-main');
  if (!main) return;
  main.innerHTML = '';
  switch(section) {
    case 'dashboard': loadDashboard(); break;
    case 'statistics': loadStatistics(); break;
    case 'teachers': loadTeachersSection(); break;
    case 'students': loadStudentsSection(); break;
    case 'groups': loadGroupsSection(); break;
    case 'subjects': loadSubjectsSection(); break;
    case 'announcements': loadAnnouncementsSection(); break;
    case 'permissions': loadPermissionsSection(); break;
    case 'apikeys': loadApiKeysSection(); break;   // NEW
    case 'settings': loadSettingsSection(); break;
  }
}

// ==================== HELPER ====================
async function createAuthUser(email, password) {
  const API_KEY = "AIzaSyDDceDGKyu8tyZ_ZLPefkL3ElzVNHfQmN4";
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`, {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password, returnSecureToken: false })
  });
  if (!res.ok) throw new Error((await res.json()).error.message);
  return (await res.json()).localId;
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  try {
    const [tSnap, sSnap, aSnap, pSnap] = await Promise.all([
      getDocs(collection(db, "teachers")),
      getDocs(collection(db, "students")),
      getDocs(collection(db, "announcements")),
      getDocs(collection(db, "permissions"))
    ]);
    $('#admin-main').innerHTML = `
      <h2 class="section-title">Dashboard</h2>
      <div class="stats-grid">
        <div class="stat-card"><i class="fa-solid fa-chalkboard-user"></i><div class="number">${tSnap.size}</div>Teachers</div>
        <div class="stat-card"><i class="fa-solid fa-graduation-cap"></i><div class="number">${sSnap.size}</div>Students</div>
        <div class="stat-card"><i class="fa-solid fa-bullhorn"></i><div class="number">${aSnap.size}</div>Announcements</div>
        <div class="stat-card"><i class="fa-solid fa-key"></i><div class="number">${pSnap.size}</div>Permissions</div>
      </div>
    `;
  } catch (err) { console.error(err); }
}

// ==================== STATISTICS ====================
async function loadStatistics() {
  try {
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue('--primary').trim() || '#38bdf8';
    const accent = styles.getPropertyValue('--accent').trim() || '#818cf8';
    const textColor = styles.getPropertyValue('--text2').trim() || '#94a3b8';
    const gold = styles.getPropertyValue('--gold').trim() || '#facc15';
    const green = styles.getPropertyValue('--green').trim() || '#10b981';
    const red = '#ef4444';
    const pink = styles.getPropertyValue('--pink').trim() || '#ec4899';

    $('#admin-main').innerHTML = `
      <h2 class="section-title">Statistics</h2>
      <div class="card"><h3>Teachers per Subject</h3><div class="chart-container"><canvas id="teacherChart" height="200"></canvas></div></div>
      <div class="card"><h3>Students per Grade</h3><div class="chart-container"><canvas id="studentChart" height="200"></canvas></div></div>
    `;
    const tSnap = await getDocs(collection(db, "teachers"));
    const subjCounts = {};
    tSnap.forEach(doc => {
      const subj = doc.data().subject || 'Unknown';
      subjCounts[subj] = (subjCounts[subj] || 0) + 1;
    });
    new Chart($('#teacherChart'), {
      type: 'doughnut',
      data: { labels: Object.keys(subjCounts), datasets: [{ data: Object.values(subjCounts), backgroundColor: [primary, accent, gold, green, red, pink] }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { color: textColor } } } }
    });
    const sSnap = await getDocs(collection(db, "students"));
    const gradeCounts = {};
    sSnap.forEach(doc => {
      const g = doc.data().grade || 'Unknown';
      gradeCounts[g] = (gradeCounts[g] || 0) + 1;
    });
    new Chart($('#studentChart'), {
      type: 'bar',
      data: { labels: Object.keys(gradeCounts), datasets: [{ label: 'Students', data: Object.values(gradeCounts), backgroundColor: accent }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: textColor } }, y: { ticks: { color: textColor }, beginAtZero: true } } }
    });
  } catch (err) { console.error(err); }
}

// ==================== TEACHERS (original functions) ====================
async function loadTeachersSection() {
  try {
    const tSnap = await getDocs(collection(db, "teachers"));
    let html = `<h2 class="section-title">Teachers</h2>`;
    html += `<div class="card"><button class="btn-primary" id="add-teacher-btn"><i class="fa-solid fa-plus"></i> Add Teacher</button></div>`;
    html += `<div class="card"><table><thead><tr><th>Code</th><th>Name</th><th>Subject</th><th>Email</th><th></th></tr></thead><tbody id="teacher-tbody"></tbody></table></div>`;
    $('#admin-main').innerHTML = html;

    const tbody = $('#teacher-tbody');
    tSnap.forEach(doc => {
      const td = doc.data();
      td.id = doc.id;
      tbody.innerHTML += `<tr>
        <td>${td.teacherCode}</td><td>${td.name}</td><td>${td.subject}</td><td>${td.email || ''}</td>
        <td><button class="btn-view-teacher" data-teacher-id="${td.id}" style="background:var(--blue); color:#fff; border:none; border-radius:6px; padding:4px 12px; cursor:pointer;">View</button></td>
      </tr>`;
    });

    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-view-teacher');
      if (!btn) return;
      showTeacherDashboard(btn.dataset.teacherId);
    });

    $('#add-teacher-btn').addEventListener('click', () => showAddTeacherForm());
  } catch (err) { console.error(err); }
}

async function showTeacherDashboard(teacherId) {
  try {
    const main = $('#admin-main');
    main.innerHTML = `<div class="section-title" style="display:flex; align-items:center; gap:16px;">
      <button id="back-to-teachers" style="background:var(--surface); border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <span>Teacher Details</span>
    </div>
    <div class="card" id="teacher-info-card"><div class="spinner-ring" style="margin:0 auto;"></div></div>
    <div class="card" id="teacher-marks-card"><div class="spinner-ring" style="margin:0 auto;"></div></div>`;

    document.getElementById('back-to-teachers').addEventListener('click', () => loadTeachersSection());

    const tdoc = await getDoc(doc(db, "teachers", teacherId));
    if (!tdoc.exists()) { $('#teacher-info-card').innerHTML = '<p>Teacher not found.</p>'; return; }
    const td = tdoc.data();
    td.id = tdoc.id;

    const mSnap = await getDocs(query(collection(db, "marks"), where("subject", "==", td.subject), orderBy("score", "desc")));

    $('#teacher-info-card').innerHTML = `
      <h3>${td.name}</h3>
      <p><strong>Code:</strong> ${td.teacherCode}</p>
      <p><strong>Email:</strong> ${td.email || 'N/A'}</p>
      <p><strong>Subject:</strong> ${td.subject}</p>
      <button id="edit-teacher-btn" style="background:var(--blue); color:#fff; border:none; border-radius:6px; padding:8px 16px; cursor:pointer; margin-top:12px;"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
    `;
    document.getElementById('edit-teacher-btn').addEventListener('click', () => showEditTeacherForm(td));

    let mhtml = `<h4>Marks for ${td.subject}</h4>`;
    if (mSnap.empty) {
      mhtml += '<p style="color:var(--text2);">No marks recorded yet.</p>';
    } else {
      mhtml += '<table><thead><tr><th>Student ID</th><th>Score</th></tr></thead><tbody>';
      mSnap.forEach(m => { mhtml += `<tr><td>${m.data().studentId}</td><td>${m.data().score}</td></tr>`; });
      mhtml += '</tbody></table>';
    }
    $('#teacher-marks-card').innerHTML = mhtml;
  } catch (err) { console.error(err); }
}

function showEditTeacherForm(teacher) {
  const card = $('#teacher-info-card');
  card.innerHTML = `
    <h3>Edit Teacher</h3>
    <div class="form-group"><label>Full Name</label><input type="text" id="edit-name" value="${teacher.name}"></div>
    <div class="form-group"><label>Email</label><input type="email" id="edit-email" value="${teacher.email || ''}"></div>
    <div class="form-group"><label>Subject</label><input type="text" id="edit-subject" value="${teacher.subject}"></div>
    <div class="form-group"><label>Teacher Code</label><input type="text" id="edit-code" value="${teacher.teacherCode}"></div>
    <div style="display:flex; gap:8px;">
      <button id="save-edit-btn" class="btn-primary" style="width:auto;"><i class="fa-solid fa-save"></i> Save</button>
      <button id="cancel-edit-btn" style="background:var(--surface); border:1px solid var(--border); color:var(--text); padding:12px; border-radius:8px; cursor:pointer;">Cancel</button>
    </div>
  `;
  document.getElementById('cancel-edit-btn').addEventListener('click', () => showTeacherDashboard(teacher.id));
  document.getElementById('save-edit-btn').addEventListener('click', () => saveTeacherEdit(teacher.id));
}

async function saveTeacherEdit(teacherId) {
  const name = $('#edit-name').value.trim();
  const email = $('#edit-email').value.trim();
  const subject = $('#edit-subject').value.trim();
  const code = $('#edit-code').value.trim();
  if (!name || !subject || !code) return alert('Name, Subject, and Code are required.');
  try {
    await updateDoc(doc(db, "teachers", teacherId), { name, email, subject, teacherCode: code });
    showTeacherDashboard(teacherId);
  } catch (err) { alert('Update failed: ' + err.message); }
}

async function showAddTeacherForm() {
  const subjectsSnap = await getDocs(collection(db, "subjects"));
  let subjectOptions = '';
  subjectsSnap.forEach(doc => {
    subjectOptions += `<option value="${doc.data().name}">${doc.data().name}</option>`;
  });

  const formHTML = `
    <div class="card">
      <h3>Add New Teacher</h3>
      <div class="form-group"><label>Email</label><input type="email" id="new-teacher-email" placeholder="teacher@school.com"></div>
      <div class="form-group"><label>Password</label><input type="password" id="new-teacher-pass" placeholder="Min 6 chars"></div>
      <div class="form-group"><label>Teacher Code</label><input type="text" id="new-teacher-code" placeholder="e.g. MATH001"></div>
      <div class="form-group"><label>Full Name</label><input type="text" id="new-teacher-name" placeholder="Ms. Emily"></div>
      <div class="form-group">
        <label>Subject</label>
        <select id="new-teacher-subject">${subjectOptions}</select>
      </div>
      <button class="btn-primary" id="save-teacher-btn"><i class="fa-solid fa-save"></i> Save Teacher</button>
      <p class="msg" id="add-teacher-msg"></p>
    </div>
  `;
  $('#admin-main').insertAdjacentHTML('afterbegin', formHTML);

  $('#save-teacher-btn').addEventListener('click', async () => {
    const email = $('#new-teacher-email').value.trim();
    const pass = $('#new-teacher-pass').value.trim();
    const code = $('#new-teacher-code').value.trim();
    const name = $('#new-teacher-name').value.trim();
    const subject = $('#new-teacher-subject').value;
    const msg = $('#add-teacher-msg');
    if (!email || pass.length < 6 || !code || !name || !subject) {
      msg.textContent = 'All fields required.'; msg.className = 'msg error';
      return;
    }
    try {
      const uid = await createAuthUser(email, pass);
      await setDoc(doc(db, "teachers", uid), {
        teacherCode: code, name, subject, uid, email
      });
      msg.textContent = 'Teacher created!'; msg.className = 'msg success';
      setTimeout(() => loadTeachersSection(), 1000);
    } catch(e) {
      msg.textContent = e.message; msg.className = 'msg error';
    }
  });
}

// ==================== STUDENTS (original) ====================
async function loadStudentsSection() {
  try {
    const sSnap = await getDocs(collection(db, "students"));
    const combos = new Set();
    sSnap.forEach(doc => {
      const g = doc.data().grade || '';
      const s = doc.data().section || '';
      if (g) combos.add(`${g}${s}`);
    });
    let options = '<option value="">All</option>';
    Array.from(combos).sort().forEach(c => { options += `<option value="${c}">Grade ${c}</option>`; });

    let html = `<h2 class="section-title">Registered Students</h2>`;
    html += `<div class="card"><h3>Filter by Grade/Section</h3><select id="filter-grade-select">${options}</select></div>`;
    html += `<div class="card"><table><thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Grade</th><th>Section</th></tr></thead><tbody id="student-tbody"></tbody></table></div>`;
    $('#admin-main').innerHTML = html;

    async function refresh() {
      const filter = $('#filter-grade-select').value;
      let q = query(collection(db, "students"), where("uid", "!=", ""));
      if (filter) {
        const grade = filter.slice(0, -1);
        const section = filter.slice(-1);
        q = query(q, where("grade", "==", grade), where("section", "==", section));
      }
      const snap = await getDocs(q);
      const tbody = $('#student-tbody');
      tbody.innerHTML = '';
      snap.forEach(doc => {
        const st = doc.data();
        tbody.innerHTML += `<tr>
          <td>${st.studentId || '-'}</td>
          <td>${st.name}</td>
          <td>${st.email || '-'}</td>
          <td>${st.grade || '-'}</td>
          <td>${st.section || '-'}</td>
        </tr>`;
      });
    }

    $('#filter-grade-select').addEventListener('change', refresh);
    await refresh();
  } catch (err) { console.error(err); }
}

// ==================== SUBJECTS (original) ====================
async function loadSubjectsSection() {
  try {
    const subjectsSnap = await getDocs(collection(db, "subjects"));
    let html = `<h2 class="section-title">Subjects</h2>`;
    html += `<div class="card"><h3>Add New Subject</h3>
      <div class="form-group"><label>Subject Name</label><input type="text" id="new-subject-name" placeholder="e.g. Mathematics"></div>
      <button class="btn-primary" id="add-subject-btn"><i class="fa-solid fa-plus"></i> Add Subject</button>
      <p class="msg" id="subject-msg"></p>
    </div>`;
    html += `<div class="card"><h3>Existing Subjects</h3><table><thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody id="subject-tbody"></tbody></table></div>`;
    $('#admin-main').innerHTML = html;

    const refresh = async () => {
      const snap = await getDocs(collection(db, "subjects"));
      const tbody = $('#subject-tbody');
      tbody.innerHTML = '';
      snap.forEach(doc => {
        const sub = doc.data();
        tbody.innerHTML += `<tr><td>${sub.name}</td>
          <td><button class="btn-delete-subject" data-id="${doc.id}" style="background:var(--red); color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">Delete</button></td></tr>`;
      });
      document.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm(`Delete subject?`)) {
            await deleteDoc(doc(db, "subjects", e.target.dataset.id));
            refresh();
          }
        });
      });
    };
    await refresh();

    $('#add-subject-btn').addEventListener('click', async () => {
      const name = $('#new-subject-name').value.trim();
      const msg = $('#subject-msg');
      if (!name) { msg.textContent = 'Name required.'; msg.className = 'msg error'; return; }
      const existing = await getDocs(query(collection(db, "subjects"), where("name", "==", name)));
      if (!existing.empty) { msg.textContent = 'Subject already exists.'; msg.className = 'msg error'; return; }
      await addDoc(collection(db, "subjects"), { name });
      msg.textContent = 'Subject added!'; msg.className = 'msg success';
      $('#new-subject-name').value = '';
      refresh();
    });
  } catch (err) { console.error(err); }
}

// ==================== GROUPS (CLASSES) (original) ====================
async function loadGroupsSection() {
  try {
    let sectionOptions = '';
    for (let i = 65; i <= 90; i++) sectionOptions += `<option value="${String.fromCharCode(i)}">${String.fromCharCode(i)}</option>`;

    let html = `<h2 class="section-title">Classes (Grade / Section)</h2>`;
    html += `<div class="card"><h3>Create New Class</h3>
      <div class="form-group"><label>Grade</label><select id="new-grade"><option value="9">9</option><option value="10">10</option><option value="11">11</option><option value="12">12</option></select></div>
      <div class="form-group"><label>Section</label><select id="new-section">${sectionOptions}</select></div>
      <button class="btn-primary" id="add-group-btn"><i class="fa-solid fa-plus"></i> Create Class</button>
      <p class="msg" id="group-msg"></p>
    </div>`;
    html += `<div class="card"><h3>Existing Classes</h3><table><thead><tr><th>Grade</th><th>Section</th><th>Students</th><th>Actions</th></tr></thead><tbody id="group-tbody"></tbody></table></div>`;
    $('#admin-main').innerHTML = html;

    async function refresh() {
      const groupSnap = await getDocs(collection(db, "groups"));
      const sSnap = await getDocs(collection(db, "students"));
      const studentCounts = {};
      sSnap.forEach(doc => {
        const g = doc.data().grade || '', s = doc.data().section || '';
        if (g && s) studentCounts[`${g}${s}`] = (studentCounts[`${g}${s}`] || 0) + 1;
      });

      const tbody = document.getElementById('group-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      groupSnap.forEach(doc => {
        const grp = doc.data();
        const key = `${grp.grade}${grp.section}`;
        const count = studentCounts[key] || 0;
        tbody.innerHTML += `<tr>
          <td>${grp.grade}</td><td>${grp.section}</td><td>${count}</td>
          <td>
            <button class="btn-view-group" data-grade="${grp.grade}" data-section="${grp.section}" style="background:var(--blue); color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">View</button>
            <button class="btn-pdf-group" data-grade="${grp.grade}" data-section="${grp.section}" style="background:var(--green); color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">Save Cards</button>
            <button class="btn-delete-group" data-id="${doc.id}" style="background:var(--red); color:#fff; border:none; border-radius:4px; padding:4px 12px; cursor:pointer;">Delete</button>
          </td></tr>`;
      });

      document.querySelectorAll('.btn-view-group').forEach(btn => btn.addEventListener('click', (e) => showGroupDetail(btn.dataset.grade, btn.dataset.section)));
      document.querySelectorAll('.btn-pdf-group').forEach(btn => btn.addEventListener('click', (e) => generateClassPDF(btn.dataset.grade, btn.dataset.section)));
      document.querySelectorAll('.btn-delete-group').forEach(btn => btn.addEventListener('click', async (e) => {
        if (confirm('Delete this class definition? (Students remain)')) {
          await deleteDoc(doc(db, "groups", e.target.dataset.id));
          refresh();
        }
      }));
    }
    await refresh();

    $('#add-group-btn').addEventListener('click', async () => {
      const grade = $('#new-grade').value, section = $('#new-section').value;
      const msg = $('#group-msg');
      const existing = await getDocs(query(collection(db, "groups"), where("grade", "==", grade), where("section", "==", section)));
      if (!existing.empty) { msg.textContent = 'Class already exists.'; msg.className = 'msg error'; return; }
      await addDoc(collection(db, "groups"), { grade, section });
      msg.textContent = `Class ${grade}${section} created!`; msg.className = 'msg success';
      refresh();
    });
  } catch (err) { console.error(err); }
}

async function generateClassPDF(grade, section) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const studentsSnap = await getDocs(query(collection(db, "students"), where("grade", "==", grade), where("section", "==", section)));
  const marksSnap = await getDocs(collection(db, "marks"));
  const marksMap = {};
  marksSnap.forEach(m => {
    const d = m.data();
    if (!marksMap[d.studentId]) marksMap[d.studentId] = {};
    marksMap[d.studentId][d.subject] = d.score;
  });

  let firstPage = true;
  for (const studentDoc of studentsSnap.docs) {
    const st = studentDoc.data();
    if (!firstPage) doc.addPage();
    firstPage = false;
    doc.setFontSize(16);
    doc.text(`Student Card – ${st.name}`, 10, 20);
    doc.setFontSize(12);
    doc.text(`ID: ${st.studentId || '-'}   Grade: ${grade}${section}`, 10, 30);
    doc.text(`Email: ${st.email || '-'}`, 10, 38);
    const subjectsSnap = await getDocs(collection(db, "subjects"));
    const tableRows = [];
    subjectsSnap.forEach(subDoc => {
      const sub = subDoc.data().name;
      const score = marksMap[st.studentId]?.[sub] ?? '-';
      tableRows.push([sub, score.toString()]);
    });
    if (tableRows.length > 0) {
      doc.autoTable({ startY: 45, head: [['Subject', 'Score']], body: tableRows });
    }
  }
  doc.save(`class_${grade}${section}_cards.pdf`);
}

async function generateStudentPDF(docId) {
  const studentDoc = await getDoc(doc(db, "students", docId));
  if (!studentDoc.exists()) return;
  const st = studentDoc.data();
  const marksSnap = await getDocs(query(collection(db, "marks"), where("studentId", "==", st.studentId)));
  const marksMap = {};
  marksSnap.forEach(m => marksMap[m.data().subject] = m.data().score);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Student Card – ${st.name}`, 10, 20);
  doc.setFontSize(12);
  doc.text(`ID: ${st.studentId || '-'}   Grade: ${st.grade || ''}${st.section || ''}`, 10, 30);
  doc.text(`Email: ${st.email || '-'}`, 10, 38);
  const subjectsSnap = await getDocs(collection(db, "subjects"));
  const tableRows = [];
  subjectsSnap.forEach(subDoc => {
    const sub = subDoc.data().name;
    const score = marksMap[sub] ?? '-';
    tableRows.push([sub, score.toString()]);
  });
  if (tableRows.length > 0) {
    doc.autoTable({ startY: 45, head: [['Subject', 'Score']], body: tableRows });
  }
  doc.save(`student_${st.name}_card.pdf`);
}

async function showGroupDetail(grade, section) {
  try {
    const allMarksSnap = await getDocs(collection(db, "marks"));
    const studentMarksMap = {};
    allMarksSnap.forEach(m => {
      const d = m.data();
      if (!studentMarksMap[d.studentId]) studentMarksMap[d.studentId] = { total:0, count:0, scores:{} };
      studentMarksMap[d.studentId].total += d.score;
      studentMarksMap[d.studentId].count++;
      studentMarksMap[d.studentId].scores[d.subject] = d.score;
    });

    const studentsSnapAll = await getDocs(collection(db, "students"));
    const studentClsMap = {};
    studentsSnapAll.forEach(doc => {
      const s = doc.data();
      studentClsMap[s.studentId || doc.id] = { grade: s.grade, section: s.section };
    });

    const classAverages = {};
    for (const [studentId, data] of Object.entries(studentMarksMap)) {
      const cls = studentClsMap[studentId];
      if (!cls || !cls.grade || !cls.section) continue;
      const key = `${cls.grade}${cls.section}`;
      if (!classAverages[key]) classAverages[key] = [];
      classAverages[key].push({ studentId, avg: data.total / data.count });
    }
    for (const key in classAverages) classAverages[key].sort((a,b) => b.avg - a.avg);
    const rankedList = classAverages[`${grade}${section}`] || [];

    const subjectsSnap = await getDocs(collection(db, "subjects"));
    const allSubjects = [];
    subjectsSnap.forEach(doc => allSubjects.push(doc.data().name));

    let html = `<div class="section-title" style="display:flex; align-items:center; gap:16px;">
      <button id="back-to-groups" style="background:var(--surface); border:1px solid var(--border); color:var(--text); padding:8px 12px; border-radius:8px; cursor:pointer;"><i class="fa-solid fa-arrow-left"></i> Back</button>
      <span>Grade ${grade}${section}</span>
    </div>`;

    html += `<div class="card">
      <h3>Import Students from Excel</h3>
      <p style="color:var(--text2); font-size:0.85rem;">Upload an Excel file (.xlsx) with columns <strong>Name</strong>, <strong>Email</strong> (optional).</p>
      <input type="file" id="excel-file" accept=".xlsx">
      <button class="btn-primary" id="import-excel-btn"><i class="fa-solid fa-upload"></i> Import Excel</button>
      <button class="btn-primary btn-sm" id="download-example-excel"><i class="fa-solid fa-download"></i> Download Example</button>
      <p class="msg" id="excel-msg"></p>
    </div>`;

    html += `<div class="card">
      <h3>Add Student Manually</h3>
      <input type="text" id="student-name" placeholder="Student Name">
      <input type="email" id="student-email" placeholder="Email (optional)">
      <button class="btn-primary" id="add-student-btn"><i class="fa-solid fa-plus"></i> Add Student</button>
      <p class="msg" id="student-msg"></p>
    </div>`;

    html += `<div class="card">
      <h3>Students in this Class</h3>
      <table id="cls-students-table">
        <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Actions</th></tr></thead>
        <tbody id="cls-students-tbody"></tbody>
      </table>
    </div>`;

    $('#admin-main').innerHTML = html;

    document.getElementById('back-to-groups').addEventListener('click', () => loadGroupsSection());

    $('#download-example-excel').addEventListener('click', () => {
      const ws_data = [['Name', 'Email'], ['John Doe', 'john@example.com']];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      XLSX.utils.book_append_sheet(wb, ws, "Students");
      XLSX.writeFile(wb, "student_import_example.xlsx");
    });

    async function refreshClassStudents() {
      const snap = await getDocs(query(collection(db, "students"), where("grade", "==", grade), where("section", "==", section)));
      const tbody = document.getElementById('cls-students-tbody');
      if (!tbody) return;
      tbody.innerHTML = '';
      for (const doc of snap.docs) {
        const s = doc.data();
        const studentId = s.studentId || doc.id;
        const rowId = `student-row-${doc.id}`;
        const detailsId = `student-details-${doc.id}`;
        tbody.innerHTML += `
          <tr id="${rowId}">
            <td>${studentId}</td>
            <td>${s.name}</td>
            <td>${s.email || '-'}</td>
            <td style="display:flex; gap:6px;">
              <button class="btn-toggle-details" data-student-id="${studentId}" data-details-id="${detailsId}" style="background:var(--blue); color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Details</button>
              <button class="btn-edit-student" data-student-doc-id="${doc.id}" style="background:var(--purple); color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Edit</button>
              <button class="btn-delete-student" data-student-doc-id="${doc.id}" data-student-name="${s.name}" style="background:var(--red); color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Delete</button>
              <button class="btn-save-single" data-student-doc-id="${doc.id}" style="background:var(--green); color:#fff; border:none; border-radius:4px; padding:4px 8px; cursor:pointer;">Save Card</button>
            </td>
          </tr>
          <tr id="${detailsId}" style="display:none;">
            <td colspan="4" style="padding:12px; background:var(--bg);">
              <div class="spinner-ring" style="margin:0 auto;"></div>
            </td>
          </tr>
        `;
      }

      document.querySelectorAll('.btn-toggle-details').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const studentId = btn.dataset.studentId;
          const detailsId = btn.dataset.detailsId;
          const row = document.getElementById(detailsId);
          const isHidden = row.style.display === 'none';
          row.style.display = isHidden ? 'table-row' : 'none';
          if (!isHidden) return;
          const cell = row.querySelector('td');
          cell.innerHTML = '<div class="spinner-ring" style="margin:0 auto;"></div>';

          const existingScores = studentMarksMap[studentId]?.scores || {};
          let total = 0, count = 0;
          let html = '<table style="width:100%;"><thead><tr>';
          allSubjects.forEach(sub => { html += `<th>${sub}</th>`; });
          html += '<th>Total</th><th>Avg</th><th>Rank</th></tr></thead><tbody><tr>';
          allSubjects.forEach(sub => {
            const val = existingScores[sub] !== undefined ? existingScores[sub] : '';
            html += `<td><input type="number" class="mark-input" data-subject="${sub}" value="${val}" min="0" max="100" step="0.1" style="width:60px;"></td>`;
            if (val !== '') { total += parseFloat(val); count++; }
          });
          const avg = count > 0 ? (total / count).toFixed(1) : '-';
          const rankIdx = rankedList.findIndex(item => item.studentId === studentId);
          const rank = rankIdx !== -1 ? rankIdx + 1 : '-';
          html += `<td><strong>${count > 0 ? total : '-'}</strong></td>`;
          html += `<td><strong>${avg}</strong></td>`;
          html += `<td><strong>${rank}</strong></td>`;
          html += '</tr></tbody></table>';
          html += `<button class="btn-save-marks" data-student-id="${studentId}" style="margin-top:8px; background:var(--blue); color:#fff; border:none; border-radius:4px; padding:8px 16px; cursor:pointer;">Save Marks</button>`;
          cell.innerHTML = html;

          cell.querySelector('.btn-save-marks').addEventListener('click', async () => {
            const inputs = cell.querySelectorAll('.mark-input');
            const batch = writeBatch(db);
            const existingDocs = await getDocs(query(collection(db, "marks"), where("studentId", "==", studentId)));
            existingDocs.forEach(doc => batch.delete(doc.ref));
            let newTotal = 0, newCount = 0;
            inputs.forEach(inp => {
              const val = parseFloat(inp.value);
              if (!isNaN(val)) {
                batch.set(doc(collection(db, "marks")), {
                  studentId, subject: inp.dataset.subject, score: val, grade, section
                });
                newTotal += val; newCount++;
              }
            });
            await batch.commit();
            showGroupDetail(grade, section);
          });
        });
      });

      document.querySelectorAll('.btn-edit-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const docId = e.target.dataset.studentDocId;
          openStudentEditModal(docId);
        });
      });

      document.querySelectorAll('.btn-delete-student').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          if (confirm(`Delete student ${e.target.dataset.studentName}? This cannot be undone.`)) {
            await deleteDoc(doc(db, "students", e.target.dataset.studentDocId));
            refreshClassStudents();
          }
        });
      });

      document.querySelectorAll('.btn-save-single').forEach(btn => {
        btn.addEventListener('click', (e) => generateStudentPDF(e.target.dataset.studentDocId));
      });
    }

    await refreshClassStudents();

    $('#import-excel-btn').addEventListener('click', async () => {
      const file = document.getElementById('excel-file').files[0];
      const msg = $('#excel-msg');
      if (!file) { msg.textContent = 'Please select an Excel file.'; msg.className = 'msg error'; return; }
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rows.length < 2) { msg.textContent = 'File must have a header row and at least one student.'; msg.className = 'msg error'; return; }
        let count = 0;
        const existingSnap = await getDocs(collection(db, "students"));
        let total = existingSnap.size;
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const name = (row[0] || '').trim();
          if (name) {
            const email = (row[1] || '').trim();
            total++;
            const studentId = `SASS-${new Date().getFullYear()}-${String(total).padStart(4,'0')}`;
            await addDoc(collection(db, "students"), { name, email, studentId, grade, section });
            count++;
          }
        }
        msg.textContent = `${count} students imported!`; msg.className = 'msg success';
        refreshClassStudents();
      };
      reader.readAsArrayBuffer(file);
    });

    $('#add-student-btn').addEventListener('click', async () => {
      const name = $('#student-name').value.trim();
      const email = $('#student-email').value.trim();
      const msg = $('#student-msg');
      if (!name) { msg.textContent = 'Student name is required.'; msg.className = 'msg error'; return; }
      const snap = await getDocs(collection(db, "students"));
      const count = snap.size + 1;
      const studentId = `SASS-${new Date().getFullYear()}-${String(count).padStart(4,'0')}`;
      await addDoc(collection(db, "students"), { name, email, studentId, grade, section });
      msg.textContent = `Student ${name} added with ID ${studentId}`; msg.className = 'msg success';
      document.getElementById('student-name').value = '';
      document.getElementById('student-email').value = '';
      refreshClassStudents();
    });
  } catch (err) { console.error(err); }
}

async function openStudentEditModal(docId) {
  let sectionOptions = '';
  for (let i = 65; i <= 90; i++) {
    const letter = String.fromCharCode(i);
    sectionOptions += `<option value="${letter}">${letter}</option>`;
  }
  $('#edit-student-section').innerHTML = sectionOptions;

  const studentDoc = await getDoc(doc(db, "students", docId));
  if (!studentDoc.exists()) return;
  const st = studentDoc.data();
  st.docId = docId;

  $('#edit-student-id').value = st.studentId || '';
  $('#edit-student-name').value = st.name || '';
  $('#edit-student-email').value = st.email || '';
  $('#edit-student-grade').value = st.grade || '9';
  $('#edit-student-section').value = st.section || 'A';
  $('#edit-student-msg').textContent = '';

  $('#student-modal').classList.add('active');

  $('#save-student-btn').onclick = async () => {
    const name = $('#edit-student-name').value.trim();
    const email = $('#edit-student-email').value.trim();
    const grade = $('#edit-student-grade').value;
    const section = $('#edit-student-section').value;
    if (!name) {
      $('#edit-student-msg').textContent = 'Name is required.';
      $('#edit-student-msg').className = 'msg error';
      return;
    }
    try {
      await updateDoc(doc(db, "students", docId), { name, email, grade, section });
      $('#edit-student-msg').textContent = 'Student updated!';
      $('#edit-student-msg').className = 'msg success';
      setTimeout(() => {
        $('#student-modal').classList.remove('active');
        showGroupDetail(grade, section);
      }, 500);
    } catch (err) {
      $('#edit-student-msg').textContent = 'Error: ' + err.message;
      $('#edit-student-msg').className = 'msg error';
    }
  };
}

// ==================== ANNOUNCEMENTS (original) ====================
async function loadAnnouncementsSection() {
  try {
    let html = `<h2 class="section-title">Announcements</h2>`;
    html += `<div class="card"><h3>Post Announcement</h3><input type="text" id="ann-title" placeholder="Title"><textarea id="ann-content" placeholder="Content" rows="3"></textarea><button class="btn-primary" id="post-ann-btn"><i class="fa-solid fa-paper-plane"></i> Post</button></div>`;
    html += `<div class="card"><h3>Recent</h3><div id="ann-list"></div></div>`;
    $('#admin-main').innerHTML = html;

    async function refreshAnnouncements() {
      const snap = await getDocs(query(collection(db, "announcements"), orderBy("timestamp", "desc")));
      const list = $('#ann-list');
      list.innerHTML = '';
      snap.forEach(doc => {
        const a = doc.data();
        list.innerHTML += `<div style="margin-bottom:12px; padding:12px; background:var(--surface); border:1px solid var(--border); border-radius:8px;"><strong>${a.title}</strong><p style="color:var(--text2);">${a.content}</p><small>${new Date(a.timestamp).toLocaleString()}</small></div>`;
      });
    }
    await refreshAnnouncements();

    $('#post-ann-btn').addEventListener('click', async () => {
      const title = $('#ann-title').value.trim();
      const content = $('#ann-content').value.trim();
      if (!title || !content) return;
      await addDoc(collection(db, "announcements"), { title, content, timestamp: Date.now() });
      $('#ann-title').value = ''; $('#ann-content').value = '';
      refreshAnnouncements();
    });
  } catch (err) { console.error(err); }
}

// ==================== PERMISSIONS (original) ====================
async function loadPermissionsSection() {
  try {
    let html = `<h2 class="section-title">Permission Requests</h2>`;
    html += `<div class="card"><table><thead><tr><th>Student</th><th>Grade</th><th>Section</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody id="perm-tbody"></tbody></table></div>`;
    $('#admin-main').innerHTML = html;

    const snap = await getDocs(collection(db, "permissions"));
    const tbody = $('#perm-tbody');
    tbody.innerHTML = '';
    snap.forEach(doc => {
      const p = doc.data();
      tbody.innerHTML += `<tr>
        <td>${p.studentName || 'Unknown'}</td>
        <td>${p.grade || '-'}</td>
        <td>${p.section || '-'}</td>
        <td>${p.reason || '-'}</td>
        <td>${p.status || 'pending'}</td>
        <td>
          ${p.status !== 'approved' ? `<button class="btn-primary" data-id="${doc.id}" data-action="approve" style="width:auto; padding:4px 12px;">Approve</button>` : ''}
          <button class="btn-primary btn-danger" data-id="${doc.id}" data-action="decline" style="width:auto; padding:4px 12px; margin-left:4px;">Decline</button>
        </td>
      </tr>`;
    });

    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const docId = btn.dataset.id;
      const action = btn.dataset.action;
      if (action === 'approve') {
        await updateDoc(doc(db, "permissions", docId), { status: 'approved' });
      } else if (action === 'decline') {
        await deleteDoc(doc(db, "permissions", docId));
      }
      loadPermissionsSection();
    });
  } catch (err) {
    console.error(err);
    $('#admin-main').innerHTML = '<h2 class="section-title">Permissions</h2><p style="color:var(--text2);">Could not load permission requests.</p>';
  }
}

// ==================== API KEYS (NEW) ====================
async function loadApiKeysSection() {
  const main = $('#admin-main');
  main.innerHTML = `
    <h2 class="section-title">API Keys</h2>
    <div class="card">
      <h3>OpenRouter AI Key</h3>
      <div class="form-group">
        <label>API Key</label>
        <input type="text" id="openrouter-key" placeholder="sk-or-...">
      </div>
      <button class="btn-primary" id="save-api-key-btn"><i class="fa-solid fa-save"></i> Save Key</button>
      <p class="msg" id="api-key-msg"></p>
    </div>
  `;

  // Load current key from Firestore
  try {
    const docSnap = await getDoc(doc(db, "settings", "api_keys"));
    if (docSnap.exists()) {
      $('#openrouter-key').value = docSnap.data().openrouter || '';
    }
  } catch (e) {
    console.error(e);
  }

  $('#save-api-key-btn').addEventListener('click', async () => {
    const key = $('#openrouter-key').value.trim();
    const msg = $('#api-key-msg');
    if (!key) {
      msg.textContent = 'Please enter a valid API key.';
      msg.className = 'msg error';
      return;
    }
    try {
      await setDoc(doc(db, "settings", "api_keys"), { openrouter: key }, { merge: true });
      msg.textContent = 'API key updated successfully!';
      msg.className = 'msg success';
    } catch (e) {
      msg.textContent = 'Error: ' + e.message;
      msg.className = 'msg error';
    }
  });
}

// ==================== SETTINGS (original) ====================
async function loadSettingsSection() {
  const adminEmail = auth.currentUser?.email || 'Unknown';
  $('#admin-main').innerHTML = `
    <h2 class="section-title">Settings</h2>
    <div class="card"><h3>Profile</h3><p><strong>Email:</strong> ${adminEmail}</p><p><strong>Role:</strong> Administrator</p></div>
    <div class="card"><h3>Theme</h3><button class="btn-primary" id="toggle-theme-btn"><i class="fa-solid fa-palette"></i> Toggle Light/Dark</button></div>
    <div class="card"><h3>Change Password</h3><input type="password" id="new-password" placeholder="New password"><button class="btn-primary" id="change-password-btn"><i class="fa-solid fa-key"></i> Update</button><p class="msg" id="password-msg"></p></div>
    <div class="card"><h3>Danger Zone</h3><button class="btn-primary btn-danger" id="reset-firestore-btn"><i class="fa-solid fa-trash"></i> Reset Data</button><p class="msg" id="reset-msg"></p></div>
  `;

  document.getElementById('toggle-theme-btn').addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sass_theme', newTheme);
    updateThemeIcon();
  });

  $('#change-password-btn').addEventListener('click', async () => {
    const newPass = $('#new-password').value.trim();
    const msg = $('#password-msg');
    if (newPass.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; msg.className = 'msg error'; return; }
    try {
      await updatePassword(auth.currentUser, newPass);
      msg.textContent = 'Password updated!'; msg.className = 'msg success';
    } catch (e) { msg.textContent = e.message; msg.className = 'msg error'; }
  });

  $('#reset-firestore-btn').addEventListener('click', async () => {
    if (!confirm('Delete all data? This cannot be undone.')) return;
    const collections = ['teachers', 'students', 'groups', 'marks', 'announcements', 'permissions'];
    const msg = $('#reset-msg');
    try {
      for (const col of collections) {
        const snap = await getDocs(collection(db, col));
        const deletions = [];
        snap.forEach(doc => deletions.push(deleteDoc(doc.ref)));
        await Promise.all(deletions);
      }
      msg.textContent = 'All data reset.'; msg.className = 'msg success';
    } catch(e) { msg.textContent = 'Error: ' + e.message; msg.className = 'msg error'; }
  });
}

// Keep modal close function accessible
window.closeModal = (id) => document.getElementById(id)?.classList.remove('active');
