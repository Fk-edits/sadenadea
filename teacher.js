import { auth, db } from './firebase-config.js';
import { onAuthStateChanged, signOut, updatePassword } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { collection, getDocs, query, where, doc, getDoc, writeBatch } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// ==================== THEME ====================
function updateThemeIcon() {
  const icon = document.querySelector('#theme-toggle i');
  if (!icon) return;
  const current = document.documentElement.getAttribute('data-theme');
  icon.className = current === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}
updateThemeIcon();

document.getElementById('theme-toggle').addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sass_theme', newTheme);
  updateThemeIcon();
});

let teacherData = null;

// Hide loader after a timeout (fallback)
setTimeout(() => {
  const loader = $('#loader');
  if (loader && !loader.classList.contains('hidden')) loader.classList.add('hidden');
}, 4000);

// Wait for DOM readiness before starting auth
function initWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
}

function checkAuth() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = 'login.html';
      return;
    }

    try {
      const teacherDoc = await getDoc(doc(db, "teachers", user.uid));
      if (!teacherDoc.exists()) {
        await signOut(auth);
        window.location.href = 'login.html';
        return;
      }

      teacherData = teacherDoc.data();
      teacherData.id = teacherDoc.id;

      const headerName = $('#header-teacher-name');
      if (headerName) headerName.textContent = teacherData.name || 'Teacher';

      $('#loader').classList.add('hidden');
      showSection('dashboard');
    } catch (e) {
      console.error('Teacher auth error:', e);
      $('#loader').classList.add('hidden');
      const main = $('#teacher-main');
      if (main) main.innerHTML = `<div class="card"><p class="msg error">Failed to load teacher data: ${e.message}. Please try logging in again.</p></div>`;
    }
  });
}

initWhenReady();

$('#logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.href = 'login.html';
});

// Sidebar navigation
document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    showSection(link.dataset.section);
  });
});

function showSection(section) {
  const main = $('#teacher-main');
  if (!main) return;
  main.innerHTML = '';
  switch(section) {
    case 'dashboard': loadDashboard(); break;
    case 'marks': loadMarksSection(); break;
    case 'settings': loadSettingsSection(); break;
  }
}

// ==================== DASHBOARD ====================
async function loadDashboard() {
  if (!teacherData) {
    $('#teacher-main').innerHTML = '<div class="card"><p style="color:var(--text2);">Teacher data not loaded. Please refresh.</p></div>';
    return;
  }

  try {
    const groupSnap = await getDocs(collection(db, "groups"));
    const classCount = groupSnap.size;

    const studentSnap = await getDocs(collection(db, "students"));
    const studentCount = studentSnap.size;

    const marksSnap = await getDocs(
      query(collection(db, "marks"), where("subject", "==", teacherData.subject))
    );
    const marksCount = marksSnap.size;

    $('#teacher-main').innerHTML = `
      <h2 class="section-title">Welcome, ${teacherData.name}</h2>
      <p style="color:var(--text2);">Subject: <strong>${teacherData.subject}</strong></p>
      <div class="stats-grid">
        <div class="stat-card"><i class="fa-solid fa-door-open"></i><div class="number">${classCount}</div>Classes</div>
        <div class="stat-card"><i class="fa-solid fa-graduation-cap"></i><div class="number">${studentCount}</div>Students</div>
        <div class="stat-card"><i class="fa-solid fa-edit"></i><div class="number">${marksCount}</div>Marks Entered</div>
      </div>
      <div class="card">
        <h3>Quick Actions</h3>
        <button class="btn-primary" id="go-to-marks"><i class="fa-solid fa-edit"></i> Enter Marks</button>
      </div>
    `;

    $('#go-to-marks').addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      const marksLink = document.querySelector('.sidebar-link[data-section="marks"]');
      if (marksLink) marksLink.classList.add('active');
      showSection('marks');
    });
  } catch (err) {
    console.error(err);
    $('#teacher-main').innerHTML = `<div class="card"><p class="msg error">Error loading dashboard: ${err.message}</p></div>`;
  }
}

// ==================== MARKS SECTION ====================
async function loadMarksSection() {
  if (!teacherData || !teacherData.subject) {
    $('#teacher-main').innerHTML = '<div class="card"><p style="color:var(--text2);">Your subject is not set. Please contact an administrator.</p></div>';
    return;
  }

  try {
    const groupSnap = await getDocs(collection(db, "groups"));
    if (groupSnap.empty) {
      $('#teacher-main').innerHTML = `
        <h2 class="section-title">Enter Marks</h2>
        <div class="card"><p style="color:var(--text2);">No classes available. Please ask an admin to create classes.</p></div>
      `;
      return;
    }

    let options = '';
    groupSnap.forEach(doc => {
      const g = doc.data();
      options += `<option value="${g.grade}|${g.section}">Grade ${g.grade}${g.section}</option>`;
    });

    $('#teacher-main').innerHTML = `
      <h2 class="section-title">Enter Marks – ${teacherData.subject}</h2>
      <div class="card">
        <h3>Select a Class</h3>
        <div class="form-group">
          <select id="class-select">${options}</select>
        </div>
        <button class="btn-primary" id="load-students-btn"><i class="fa-solid fa-users"></i> Load Students</button>
      </div>
      <div id="marks-table-container"></div>
    `;

    $('#load-students-btn').addEventListener('click', async () => {
      const [grade, section] = $('#class-select').value.split('|');
      if (!grade || !section) return;

      $('#marks-table-container').innerHTML = '<div class="spinner-ring" style="margin:20px auto;"></div>';

      try {
        const studentSnap = await getDocs(
          query(collection(db, "students"), where("grade", "==", grade), where("section", "==", section))
        );

        const marksSnap = await getDocs(
          query(collection(db, "marks"),
            where("subject", "==", teacherData.subject),
            where("grade", "==", grade),
            where("section", "==", section))
        );

        const scoreMap = {};
        marksSnap.forEach(doc => {
          const d = doc.data();
          scoreMap[d.studentId] = d.score;
        });

        if (studentSnap.empty) {
          $('#marks-table-container').innerHTML = `<div class="card"><p style="color:var(--text2);">No students in this class.</p></div>`;
          return;
        }

        let tableHtml = `
          <div class="card">
            <h3>Students in Grade ${grade}${section}</h3>
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Score (${teacherData.subject})</th></tr></thead>
              <tbody>
        `;

        studentSnap.forEach(doc => {
          const st = doc.data();
          const studentId = st.studentId || doc.id;
          const currentScore = scoreMap[studentId] !== undefined ? scoreMap[studentId] : '';
          tableHtml += `
            <tr>
              <td>${studentId}</td>
              <td>${st.name}</td>
              <td><input type="number" class="mark-input" data-student-id="${studentId}" value="${currentScore}" min="0" max="100" step="0.1"></td>
            </tr>
          `;
        });

        tableHtml += `</tbody></table>
          <button class="btn-primary" id="save-all-marks" style="margin-top:16px;"><i class="fa-solid fa-save"></i> Save All Marks</button>
          <p class="msg" id="marks-msg"></p>
          </div>
        `;

        $('#marks-table-container').innerHTML = tableHtml;

        $('#save-all-marks').addEventListener('click', async () => {
          const inputs = document.querySelectorAll('.mark-input');
          const batch = writeBatch(db);
          let count = 0;

          // Delete old marks for this subject/grade/section
          const oldMarks = await getDocs(
            query(collection(db, "marks"),
              where("subject", "==", teacherData.subject),
              where("grade", "==", grade),
              where("section", "==", section))
          );
          oldMarks.forEach(doc => batch.delete(doc.ref));

          inputs.forEach(inp => {
            const studentId = inp.dataset.studentId;
            const val = parseFloat(inp.value);
            if (!isNaN(val)) {
              const ref = doc(collection(db, "marks"));
              batch.set(ref, {
                studentId,
                subject: teacherData.subject,
                score: val,
                grade,
                section,
                teacherId: teacherData.id
              });
              count++;
            }
          });

          try {
            await batch.commit();
            $('#marks-msg').textContent = `${count} marks saved successfully!`;
            $('#marks-msg').className = 'msg success';
          } catch (e) {
            $('#marks-msg').textContent = 'Error: ' + e.message;
            $('#marks-msg').className = 'msg error';
          }
        });

      } catch (err) {
        console.error(err);
        $('#marks-table-container').innerHTML = `<div class="card"><p class="msg error">Failed to load students: ${err.message}</p></div>`;
      }
    });

  } catch (err) {
    console.error(err);
    $('#teacher-main').innerHTML = `<h2 class="section-title">Enter Marks</h2><div class="card"><p class="msg error">Failed to load data: ${err.message}</p></div>`;
  }
}

// ==================== SETTINGS ====================
async function loadSettingsSection() {
  $('#teacher-main').innerHTML = `
    <h2 class="section-title">Settings</h2>
    <div class="card">
      <h3>Profile</h3>
      <p><strong>Name:</strong> ${teacherData.name}</p>
      <p><strong>Email:</strong> ${auth.currentUser?.email || 'N/A'}</p>
      <p><strong>Subject:</strong> ${teacherData.subject}</p>
      <p><strong>Teacher Code:</strong> ${teacherData.teacherCode}</p>
    </div>
    <div class="card">
      <h3>Change Password</h3>
      <input type="password" id="new-password" placeholder="New password (min 6 chars)">
      <button class="btn-primary" id="change-password-btn"><i class="fa-solid fa-key"></i> Update Password</button>
      <p class="msg" id="password-msg"></p>
    </div>
    <div class="card">
      <h3>Theme</h3>
      <button class="btn-primary" id="toggle-theme-btn2"><i class="fa-solid fa-palette"></i> Toggle Light/Dark</button>
    </div>
    <div class="card">
      <button class="btn-primary" id="logout-btn2" style="background:var(--red);"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
    </div>
  `;

  $('#change-password-btn').addEventListener('click', async () => {
    const newPass = $('#new-password').value.trim();
    const msg = $('#password-msg');
    if (newPass.length < 6) { msg.textContent = 'Password must be at least 6 characters.'; msg.className = 'msg error'; return; }
    try {
      await updatePassword(auth.currentUser, newPass);
      msg.textContent = 'Password updated!'; msg.className = 'msg success';
    } catch (e) { msg.textContent = e.message; msg.className = 'msg error'; }
  });

  $('#toggle-theme-btn2').addEventListener('click', () => {
    const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('sass_theme', newTheme);
    updateThemeIcon(); // update both theme icons
  });

  $('#logout-btn2').addEventListener('click', async () => {
    await signOut(auth);
    window.location.href = 'login.html';
  });
}