const API = 'https://portfolio-production-a8ef.up.railway.app/api';
const token = () => localStorage.getItem('cms_token');

// Auth guard
if (!token()) location.href = 'index.html';

// ── Toast ──
function toast(msg, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<i class="uil uil-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${msg}`;
    document.getElementById('toasts').appendChild(el);
    setTimeout(() => { el.style.animation = 'toastOut .3s forwards'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── API helpers ──
async function apiFetch(path, opts = {}) {
    const res = await fetch(API + path, {
        ...opts,
        headers: { 'Authorization': `Bearer ${token()}`, ...opts.headers }
    });
    if (res.status === 401) { localStorage.removeItem('cms_token'); location.href = 'index.html'; }
    return res;
}

// ── State ──
let projects = [];
let editingId = null;
let existingScreenshots = [];
let existingScreenshotIds = [];

// ── Load projects ──
async function loadProjects() {
    const res = await fetch(API + '/projects');
    projects = await res.json();
    renderTable(projects);
    renderStats(projects);
}

function renderStats(data) {
    document.getElementById('stat-total').textContent  = data.length;
    document.getElementById('stat-web').textContent    = data.filter(p => p.category === 'web').length;
    document.getElementById('stat-app').textContent    = data.filter(p => p.category === 'app').length;
    document.getElementById('stat-design').textContent = data.filter(p => ['design','engineering'].includes(p.category)).length;
}

function categoryBadge(cat) {
    return `<span class="badge badge-${cat}">${cat}</span>`;
}

function renderTable(data) {
    const tbody = document.getElementById('projects-tbody');
    if (!data.length) {
        tbody.innerHTML = `<tr><td colspan="7"><div class="empty_state"><i class="uil uil-folder-open"></i>No projects yet. Add your first one!</div></td></tr>`;
        return;
    }
    tbody.innerHTML = data.map((p, i) => `
        <tr>
            <td style="color:var(--text);font-size:.75rem">${i + 1}</td>
            <td style="font-weight:500;color:var(--title)">${p.title}</td>
            <td>${categoryBadge(p.category)}</td>
            <td style="font-size:.75rem">${p.technologies || '—'}</td>
            <td>
                <div class="thumb_row">
                    ${(p.screenshots || []).slice(0, 3).map(s =>
                        `<img src="${s}" onclick="viewImage('${s}')" title="View">`
                    ).join('')}
                    ${(p.screenshots || []).length > 3 ? `<span style="font-size:.7rem;color:var(--text);align-self:center">+${p.screenshots.length - 3} more</span>` : ''}
                </div>
            </td>
            <td style="font-size:.75rem">${p.created_date ? new Date(p.created_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : '—'}</td>
            <td>
                <div class="actions">
                    <button class="btn btn-ghost btn-sm" onclick="openEdit(${p.id})"><i class="uil uil-edit"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProject(${p.id})"><i class="uil uil-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

// ── Search ──
document.getElementById('search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    renderTable(projects.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.technologies || '').toLowerCase().includes(q) ||
        p.category.includes(q)
    ));
});

// ── Modal ──
const modal = document.getElementById('modal');

function openModal(title) {
    document.getElementById('modal-title').textContent = title;
    modal.classList.add('open');
}
function closeModal() {
    modal.classList.remove('open');
    document.getElementById('project-form').reset();
    document.getElementById('project-id').value = '';
    document.getElementById('preview-grid').innerHTML = '';
    existingScreenshots = [];
    existingScreenshotIds = [];
    editingId = null;
}

document.getElementById('add-btn').onclick = () => { editingId = null; openModal('Add Project'); };
document.getElementById('modal-close').onclick = closeModal;
document.getElementById('modal-cancel').onclick = closeModal;
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

// ── Edit ──
function openEdit(id) {
    const p = projects.find(x => x.id === id);
    if (!p) return;
    editingId = id;
    existingScreenshots = p.screenshots || [];
    existingScreenshotIds = p.screenshot_ids || [];

    document.getElementById('project-id').value   = p.id;
    document.getElementById('f-title').value       = p.title;
    document.getElementById('f-category').value    = p.category;
    document.getElementById('f-description').value = p.description || '';
    document.getElementById('f-technologies').value= p.technologies || '';
    document.getElementById('f-role').value        = p.role || '';
    document.getElementById('f-url').value         = p.live_url || '';
    document.getElementById('f-date').value        = p.created_date ? p.created_date.split('T')[0] : '';

    // Show existing screenshots in preview
    const grid = document.getElementById('preview-grid');
    grid.innerHTML = existingScreenshots.map((s, i) => `
        <div class="preview_item" id="existing-${i}">
            <img src="${s}">
            <button type="button" class="preview_remove" onclick="removeExisting(${i})"><i class="uil uil-times"></i></button>
        </div>
    `).join('');

    openModal('Edit Project');
}

function removeExisting(i) {
    existingScreenshots.splice(i, 1);
    existingScreenshotIds.splice(i, 1);
    document.getElementById(`existing-${i}`)?.remove();
}

// ── File upload preview ──
const fileInput = document.getElementById('f-screenshots');
const uploadZone = document.getElementById('upload-zone');

uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag'));
uploadZone.addEventListener('drop', e => {
    e.preventDefault();
    uploadZone.classList.remove('drag');
    fileInput.files = e.dataTransfer.files;
    renderPreviews(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => renderPreviews(fileInput.files));

function renderPreviews(files) {
    const grid = document.getElementById('preview-grid');
    // Keep existing, append new
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = e => {
            const div = document.createElement('div');
            div.className = 'preview_item';
            div.innerHTML = `<img src="${e.target.result}">`;
            grid.appendChild(div);
        };
        reader.readAsDataURL(file);
    });
}

// ── Cloudinary upload utility ──
async function uploadImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portfolio_upload');
    formData.append('folder', 'portfolio/projects');
    const response = await fetch('https://api.cloudinary.com/v1_1/dobhdywqa/image/upload', {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Image upload failed');
    const data = await response.json();
    return { url: data.secure_url, publicId: data.public_id };
}

// ── Save ──
document.getElementById('modal-save').onclick = async () => {
    const saveText = document.getElementById('save-text');
    const title = document.getElementById('f-title').value.trim();
    const category = document.getElementById('f-category').value;
    if (!title || !category) { toast('Title and category are required', 'error'); return; }

    saveText.textContent = 'Uploading...';

    try {
        // Upload new files to Cloudinary
        const newUploads = await Promise.all(
            Array.from(fileInput.files).map(f => uploadImage(f))
        );

        const screenshots = [
            ...existingScreenshots,
            ...newUploads.map(u => u.url)
        ];
        const screenshot_ids = [
            ...existingScreenshotIds,
            ...newUploads.map(u => u.publicId)
        ];

        saveText.textContent = 'Saving...';

        const payload = {
            title,
            category,
            description: document.getElementById('f-description').value,
            technologies: document.getElementById('f-technologies').value,
            role: document.getElementById('f-role').value,
            live_url: document.getElementById('f-url').value,
            created_date: document.getElementById('f-date').value,
            screenshots,
            screenshot_ids
        };

        const res = await apiFetch(editingId ? `/projects/${editingId}` : '/projects', {
            method: editingId ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error((await res.json()).error);
        toast(editingId ? 'Project updated!' : 'Project added!');
        closeModal();
        loadProjects();
    } catch (err) {
        toast(err.message, 'error');
    } finally {
        saveText.textContent = 'Save Project';
    }
};

// ── Delete ──
async function deleteProject(id) {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    try {
        const res = await apiFetch(`/projects/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        toast('Project deleted');
        loadProjects();
    } catch (err) {
        toast(err.message, 'error');
    }
}

// ── Image viewer ──
function viewImage(src) {
    document.getElementById('img-viewer-img').src = src;
    document.getElementById('img-viewer').classList.add('open');
}
document.getElementById('img-viewer-close').onclick = () => document.getElementById('img-viewer').classList.remove('open');
document.getElementById('img-viewer').addEventListener('click', e => {
    if (e.target === document.getElementById('img-viewer')) document.getElementById('img-viewer').classList.remove('open');
});

// ── Logout ──
document.getElementById('logout-btn').onclick = () => {
    localStorage.removeItem('cms_token');
    location.href = 'index.html';
};

// ── Init ──
loadProjects();
