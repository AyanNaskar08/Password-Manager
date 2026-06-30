/**
 * Password Manager — Client-Side Logic
 */

// ── State ──────────────────────────────────────────────────────
let passwords = [];
let categories = [];
let editingId = null;

// ── Init ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadPasswords();
    loadCategories();
    setupEventListeners();
});

// ── Event Listeners ────────────────────────────────────────────
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(loadPasswords, 300);
        });
    }

    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', loadPasswords);
    }

    // Password generator range
    const lengthRange = document.getElementById('genLength');
    const lengthValue = document.getElementById('genLengthValue');
    if (lengthRange && lengthValue) {
        lengthRange.addEventListener('input', () => {
            lengthValue.textContent = lengthRange.value;
        });
    }

    // Import drag-and-drop
    const importZone = document.getElementById('importZone');
    if (importZone) {
        importZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            importZone.classList.add('drag-over');
        });
        importZone.addEventListener('dragleave', () => {
            importZone.classList.remove('drag-over');
        });
        importZone.addEventListener('drop', (e) => {
            e.preventDefault();
            importZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file) handleImport(file);
        });
    }

    // Import file input
    const importFile = document.getElementById('importFile');
    if (importFile) {
        importFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImport(file);
            e.target.value = '';
        });
    }

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeAllModals();
        });
    });

    // Close modals on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAllModals();
    });

    // Password strength in add/edit modal
    const pwdInput = document.getElementById('entryPassword');
    if (pwdInput) {
        pwdInput.addEventListener('input', () => updateStrengthMeter(pwdInput.value));
    }
}

// ── API Calls ──────────────────────────────────────────────────

async function loadPasswords() {
    const search = document.getElementById('searchInput')?.value || '';
    const category = document.getElementById('categoryFilter')?.value || '';

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    try {
        const res = await fetch(`/api/passwords?${params}`);
        passwords = await res.json();
        renderPasswords();
        updateStats();
    } catch (err) {
        showToast('Failed to load passwords', 'error');
    }
}

async function loadCategories() {
    try {
        const res = await fetch('/api/categories');
        categories = await res.json();
        renderCategoryFilter();
    } catch (err) {
        console.error('Failed to load categories');
    }
}

async function savePassword() {
    const website = document.getElementById('entryWebsite').value.trim();
    const username = document.getElementById('entryUsername').value.trim();
    const password = document.getElementById('entryPassword').value.trim();
    const category = document.getElementById('entryCategory').value.trim() || 'General';
    const notes = document.getElementById('entryNotes').value.trim();

    if (!website || !password) {
        showToast('Website and password are required.', 'error');
        return;
    }

    const data = { website, username, password, category, notes };

    try {
        let res;
        if (editingId) {
            res = await fetch(`/api/passwords/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        } else {
            res = await fetch('/api/passwords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
        }

        if (res.ok) {
            showToast(editingId ? 'Password updated!' : 'Password saved!', 'success');
            closeAllModals();
            loadPasswords();
            loadCategories();
        } else {
            const err = await res.json();
            showToast(err.error || 'Failed to save.', 'error');
        }
    } catch (err) {
        showToast('Network error. Please try again.', 'error');
    }
}

async function deletePassword(id) {
    if (!confirm('Are you sure you want to delete this password?')) return;

    try {
        const res = await fetch(`/api/passwords/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Password deleted.', 'success');
            loadPasswords();
            loadCategories();
        }
    } catch (err) {
        showToast('Failed to delete.', 'error');
    }
}

async function generatePassword() {
    const length = document.getElementById('genLength')?.value || 16;
    const uppercase = document.getElementById('genUppercase')?.checked ?? true;
    const lowercase = document.getElementById('genLowercase')?.checked ?? true;
    const digits = document.getElementById('genDigits')?.checked ?? true;
    const symbols = document.getElementById('genSymbols')?.checked ?? true;

    try {
        const res = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ length: parseInt(length), uppercase, lowercase, digits, symbols }),
        });
        const data = await res.json();
        document.getElementById('generatedPassword').textContent = data.password;
    } catch (err) {
        showToast('Failed to generate password.', 'error');
    }
}

async function handleImport(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const res = await fetch('/api/import', {
            method: 'POST',
            body: formData,
        });
        const data = await res.json();

        if (res.ok) {
            showToast(data.message, 'success');
            closeAllModals();
            loadPasswords();
            loadCategories();
        } else {
            showToast(data.error || 'Import failed.', 'error');
        }
    } catch (err) {
        showToast('Import failed. Please try again.', 'error');
    }
}

// ── Rendering ──────────────────────────────────────────────────

function renderPasswords() {
    const tbody = document.getElementById('passwordsBody');
    const cardsContainer = document.getElementById('passwordCards');
    const emptyState = document.getElementById('emptyState');

    if (!tbody || !cardsContainer) return;

    if (passwords.length === 0) {
        tbody.innerHTML = '';
        cardsContainer.innerHTML = '';
        emptyState?.classList.remove('hidden');
        return;
    }

    emptyState?.classList.add('hidden');

    // Table rows
    tbody.innerHTML = passwords.map(p => `
        <tr>
            <td>
                <div class="password-website">
                    <div class="website-favicon">${getInitial(p.website)}</div>
                    <div class="website-info">
                        <div class="website-name">${escapeHtml(p.website)}</div>
                        <div class="website-user">${escapeHtml(p.username || '—')}</div>
                    </div>
                </div>
            </td>
            <td>
                <div class="password-field">
                    <span class="pwd-display" id="pwd-${p.id}">••••••••</span>
                    <button class="btn-icon btn-ghost" onclick="togglePassword(${p.id}, '${escapeAttr(p.password)}')" title="Toggle visibility"><i class="fa-regular fa-eye"></i></button>
                    <button class="btn-icon btn-ghost" onclick="copyToClipboard('${escapeAttr(p.password)}')" title="Copy password"><i class="fa-regular fa-clipboard"></i></button>
                </div>
            </td>
            <td><span class="category-badge">${escapeHtml(p.category)}</span></td>
            <td>
                <div class="row-actions">
                    <button class="btn-icon btn-ghost" onclick="openEditModal(${p.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="btn-icon btn-ghost" onclick="deletePassword(${p.id})" title="Delete"><i class="fa-regular fa-trash-can"></i></button>
                </div>
            </td>
        </tr>
    `).join('');

    // Mobile cards
    cardsContainer.innerHTML = passwords.map(p => `
        <div class="password-card">
            <div class="card-top">
                <div class="password-website">
                    <div class="website-favicon">${getInitial(p.website)}</div>
                    <div class="website-info">
                        <div class="website-name">${escapeHtml(p.website)}</div>
                        <div class="website-user">${escapeHtml(p.username || '—')}</div>
                    </div>
                </div>
                <span class="category-badge">${escapeHtml(p.category)}</span>
            </div>
            <div class="card-details">
                <div class="card-detail">
                    <span class="detail-label">Password</span>
                    <span class="detail-value">
                        <span class="pwd-display" id="pwd-card-${p.id}">••••••••</span>
                        <button class="btn-icon btn-ghost" onclick="togglePassword(${p.id}, '${escapeAttr(p.password)}', true)" title="Toggle"><i class="fa-regular fa-eye"></i></button>
                        <button class="btn-icon btn-ghost" onclick="copyToClipboard('${escapeAttr(p.password)}')" title="Copy"><i class="fa-regular fa-clipboard"></i></button>
                    </span>
                </div>
                ${p.notes ? `<div class="card-detail"><span class="detail-label">Notes</span><span class="detail-value">${escapeHtml(p.notes)}</span></div>` : ''}
            </div>
            <div class="card-actions">
                <button class="btn btn-secondary btn-sm" onclick="openEditModal(${p.id})" style="flex:1"><i class="fa-solid fa-pen-to-square"></i> Edit</button>
                <button class="btn btn-danger btn-sm" onclick="deletePassword(${p.id})" style="flex:1"><i class="fa-regular fa-trash-can"></i> Delete</button>
            </div>
        </div>
    `).join('');
}

function renderCategoryFilter() {
    const filter = document.getElementById('categoryFilter');
    if (!filter) return;

    const current = filter.value;
    filter.innerHTML = '<option value="">All Categories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === current) opt.selected = true;
        filter.appendChild(opt);
    });
}

function updateStats() {
    const totalEl = document.getElementById('statTotal');
    const catEl = document.getElementById('statCategories');
    const weakEl = document.getElementById('statWeak');
    const recentEl = document.getElementById('statRecent');

    if (totalEl) totalEl.textContent = passwords.length;

    const uniqueCats = new Set(passwords.map(p => p.category));
    if (catEl) catEl.textContent = uniqueCats.size;

    const weak = passwords.filter(p => p.password && getStrength(p.password) === 'weak').length;
    if (weakEl) weakEl.textContent = weak;

    // Entries added today
    const today = new Date().toISOString().split('T')[0];
    const recent = passwords.filter(p => p.created_at && p.created_at.startsWith(today)).length;
    if (recentEl) recentEl.textContent = recent;
}

// ── Modals ─────────────────────────────────────────────────────

function openAddModal() {
    editingId = null;
    document.getElementById('modalTitle').textContent = 'Add Password';
    document.getElementById('entryWebsite').value = '';
    document.getElementById('entryUsername').value = '';
    document.getElementById('entryPassword').value = '';
    document.getElementById('entryCategory').value = 'General';
    document.getElementById('entryNotes').value = '';
    updateStrengthMeter('');
    document.getElementById('passwordModal').classList.add('active');
}

function openEditModal(id) {
    const entry = passwords.find(p => p.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('modalTitle').textContent = 'Edit Password';
    document.getElementById('entryWebsite').value = entry.website;
    document.getElementById('entryUsername').value = entry.username || '';
    document.getElementById('entryPassword').value = entry.password || '';
    document.getElementById('entryCategory').value = entry.category || 'General';
    document.getElementById('entryNotes').value = entry.notes || '';
    updateStrengthMeter(entry.password || '');
    document.getElementById('passwordModal').classList.add('active');
}

function openGeneratorModal() {
    document.getElementById('generatorModal').classList.add('active');
    generatePassword();
}

function openImportModal() {
    document.getElementById('importModal').classList.add('active');
}

function closeAllModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// ── Helpers ────────────────────────────────────────────────────

function togglePassword(id, password, isCard = false) {
    const prefix = isCard ? 'pwd-card-' : 'pwd-';
    const el = document.getElementById(prefix + id);
    if (!el) return;

    if (el.textContent === '••••••••') {
        el.textContent = password;
        el.style.color = 'var(--accent-primary)';
    } else {
        el.textContent = '••••••••';
        el.style.color = '';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Copied to clipboard!', 'success');
    });
}

function useGeneratedPassword() {
    const pwd = document.getElementById('generatedPassword').textContent;
    if (pwd) {
        document.getElementById('entryPassword').value = pwd;
        updateStrengthMeter(pwd);
        closeAllModals();
        document.getElementById('passwordModal').classList.add('active');
    }
}

function copyGeneratedPassword() {
    const pwd = document.getElementById('generatedPassword').textContent;
    if (pwd) copyToClipboard(pwd);
}

function exportPasswords() {
    window.location.href = '/api/export';
}

function getInitial(name) {
    return name ? name.charAt(0).toUpperCase() : '?';
}

function getStrength(password) {
    if (!password) return '';
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 1) return 'weak';
    if (score <= 2) return 'fair';
    if (score <= 3) return 'good';
    return 'strong';
}

function updateStrengthMeter(password) {
    const meter = document.getElementById('strengthMeter');
    const label = document.getElementById('strengthLabel');
    if (!meter || !label) return;

    const strength = getStrength(password);
    meter.className = 'strength-meter ' + strength;
    label.className = 'strength-label ' + strength;

    const labels = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong', '': '' };
    label.textContent = labels[strength] || '';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function escapeAttr(text) {
    return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// ── Toast System ───────────────────────────────────────────────

function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const icons = { success: '<i class="fa-solid fa-circle-check"></i>', error: '<i class="fa-solid fa-circle-xmark"></i>', info: '<i class="fa-solid fa-circle-info"></i>' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || ''}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ── Toggle password visibility in forms ────────────────────────

function toggleFormPassword(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
}
