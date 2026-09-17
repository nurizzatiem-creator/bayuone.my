// ============================================================
// BayuOne — Admin panel logic
// ============================================================
// Handles: admin login/logout, applications table, review modal,
// banner table, delete confirmation. Data comes from data-loader.
// ============================================================

import { db } from './supabase-client.js';
import { bayuData, loadAllData } from './data-loader.js';
import { rowFromApp } from './converters.js';
import { formatDateDisplay, countWords, calculateTarikhTamat, getTodayStr } from './utils.js';
import { getBannerStatus } from './helpers.js';

// ------------------------------------------------------------
// Admin login / logout
// ------------------------------------------------------------

export async function handleAdminLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value;
    const password = document.getElementById('admin-login-pass').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Log Masuk...'; }

    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Log Masuk'; }

    if (error) { alert('Log masuk gagal: ' + error.message); return; }

    document.getElementById('modal-admin-login')?.classList.add('hidden');
    await loadAllData();
    window.switchTab('admin');
}

export async function logoutAdmin() {
    try { await db.auth.signOut(); } catch (err) { console.warn(err); }
    window.switchTab('agenda');
}

// ------------------------------------------------------------
// Applications table
// ------------------------------------------------------------

export function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    const searchVal = (document.getElementById('admin-search')?.value || '').toLowerCase().trim();
    const filterType = document.getElementById('admin-filter-type')?.value || '';
    const filterApproval = document.getElementById('admin-filter-approval')?.value || '';

    let total = 0, pending = 0, approved = 0, cancelled = 0;

    bayuData.applications.forEach(item => {
        total++;
        if (item.approval === 'Pending') pending++;
        if (item.approval === 'Approved') approved++;
        if (item.statusPenangguhan === 'Dibatalkan') cancelled++;

        if (filterType && item.type !== filterType) return;
        if (filterApproval && item.approval !== filterApproval) return;

        const nameText = (item.name || '').toLowerCase();
        const titleText = (item.title || '').toLowerCase();
        const emailText = (item.email || '').toLowerCase();
        const orgText = (item.org || '').toLowerCase();
        if (searchVal && !nameText.includes(searchVal) && !titleText.includes(searchVal) &&
            !emailText.includes(searchVal) && !orgText.includes(searchVal)) return;

        const displayTitle = (item.type === 'Agenda') ? (item.title || item.name) : (item.name || item.title);
        const displayDate = formatDateDisplay(item.date) || '-';
        const hasLabel = item.label && item.label.trim() !== '';
        const labelDisplay = hasLabel ? item.label : '-';
        const validityDisplay = hasLabel ? (item.validity || '-') : '-';
        const dariDisplay = hasLabel ? (formatDateDisplay(item.tarikhDari) || '-') : '-';
        const hinggaDisplay = hasLabel ? (formatDateDisplay(item.tarikhSehingga) || '-') : '-';

        let labelBadgeClass = 'bg-gray-100 text-gray-600';
        if (item.label === 'Top') labelBadgeClass = 'bg-emerald-100 text-emerald-800';
        else if (item.label === 'Featured') labelBadgeClass = 'bg-amber-100 text-amber-800';
        else if (item.label === 'Promoted') labelBadgeClass = 'bg-indigo-100 text-indigo-800';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-bg/50 transition-colors';
        tr.innerHTML = `
            <td class="p-3.5"><img src="${item.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100'}" class="w-10 h-10 rounded-xl object-cover border border-brand-border"></td>
            <td class="p-3.5 font-bold text-brand-dark">
                <div>${displayTitle}</div>
                <div class="text-[10px] text-brand font-semibold uppercase tracking-wider">${item.type} • ${item.id}</div>
            </td>
            <td class="p-3.5 text-brand-muted">
                <div>${item.name || item.org || '-'}</div>
                <div class="text-[11px] text-gray-500">${item.email || '-'}</div>
            </td>
            <td class="p-3.5 font-semibold text-brand-dark">${displayDate}</td>
            <td class="p-3.5">
                <span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${item.approval === 'Approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                    ${item.approval === 'Approved' ? 'Diluluskan' : 'Menunggu Semakan'}
                </span>
            </td>
            <td class="p-3.5"><span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${labelBadgeClass}">${labelDisplay}</span></td>
            <td class="p-3.5 font-semibold ${hasLabel ? 'text-brand-dark' : 'text-gray-300'}">${validityDisplay}</td>
            <td class="p-3.5 ${hasLabel ? 'text-gray-600' : 'text-gray-300'}">${dariDisplay}</td>
            <td class="p-3.5 ${hasLabel ? 'text-gray-600' : 'text-gray-300'}">${hinggaDisplay}</td>
            <td class="p-3.5 text-right space-x-2">
                <button onclick="openAdminReviewModal('${item.id}')" class="bg-brand text-white px-3 py-1.5 rounded-lg font-bold text-[11px] hover:bg-brand-dark transition-colors">
                    <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                </button>
                <button onclick="confirmDeleteApplication('${item.id}')" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-pending').textContent = pending;
    document.getElementById('stat-approved').textContent = approved;
    document.getElementById('stat-active').textContent = approved;
    document.getElementById('stat-expiring').textContent = 0;
    document.getElementById('stat-expired').textContent = 0;
    document.getElementById('stat-cancelled').textContent = cancelled;
    document.getElementById('stat-feedback').textContent = bayuData.feedbacks.length;
}

// ------------------------------------------------------------
// Banner table
// ------------------------------------------------------------

export function renderBannerTable() {
    const tbody = document.getElementById('banner-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    bayuData.banners.forEach(banner => {
        const statusInfo = getBannerStatus(banner);
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-bg/50 transition-colors';
        tr.innerHTML = `
            <td class="p-3.5"><img src="${banner.photo}" class="w-16 h-8 rounded object-cover border border-brand-border" onerror="this.style.display='none'"></td>
            <td class="p-3.5 font-bold text-brand-dark">${banner.name}</td>
            <td class="p-3.5 text-brand-muted">${banner.company}</td>
            <td class="p-3.5">${banner.validity}</td>
            <td class="p-3.5 font-semibold text-brand-dark">${formatDateDisplay(banner.startDate)}</td>
            <td class="p-3.5 font-semibold text-brand-dark">${formatDateDisplay(banner.endDate)}</td>
            <td class="p-3.5"><span class="px-2.5 py-1 rounded-full font-bold text-[10px] ${statusInfo.class}">${statusInfo.label}</span></td>
            <td class="p-3.5 text-right space-x-2">
                <button onclick="openBannerModal('${banner.id}')" class="bg-brand text-white px-3 py-1.5 rounded-lg font-bold text-[11px] hover:bg-brand-dark transition-colors">
                    <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                </button>
                <button onclick="confirmDeleteBanner('${banner.id}')" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}

// ------------------------------------------------------------
// Banner modal
// ------------------------------------------------------------

export function openBannerModal(id) {
    const modal = document.getElementById('modal-banner');
    const title = document.getElementById('banner-modal-title');
    const form = document.getElementById('form-banner');

    if (id) {
        const banner = bayuData.banners.find(b => b.id === id);
        if (!banner) return;
        title.textContent = 'Edit Banner';
        document.getElementById('banner-edit-id').value = banner.id;
        document.getElementById('banner-photo').value = banner.photo;
        document.getElementById('banner-name').value = banner.name;
        document.getElementById('banner-company').value = banner.company;
        document.getElementById('banner-validity').value = banner.validity;
        document.getElementById('banner-start-date').value = banner.startDate;
        document.getElementById('banner-end-date').value = banner.endDate;
        document.getElementById('banner-photo-preview').classList.remove('hidden');
        document.getElementById('banner-photo-preview').querySelector('img').src = banner.photo;
    } else {
        title.textContent = 'Tambah Banner';
        document.getElementById('banner-edit-id').value = '';
        form.reset();
        document.getElementById('banner-end-date').value = '';
        document.getElementById('banner-photo-preview').classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

export function calculateBannerEndDate() {
    const startDate = document.getElementById('banner-start-date').value;
    const validity = document.getElementById('banner-validity').value;
    const endDateInput = document.getElementById('banner-end-date');
    if (startDate && validity) endDateInput.value = calculateTarikhTamat(startDate, validity);
    else endDateInput.value = '';
}

export async function handleSaveBanner(e) {
    e.preventDefault();
    const editId = document.getElementById('banner-edit-id').value;
    const photo = document.getElementById('banner-photo').value.trim();
    const name = document.getElementById('banner-name').value.trim();
    const company = document.getElementById('banner-company').value.trim();
    const validity = document.getElementById('banner-validity').value;
    const startDate = document.getElementById('banner-start-date').value;
    const endDate = document.getElementById('banner-end-date').value;

    if (!photo || !name || !company || !validity || !startDate || !endDate) {
        alert('Sila isi semua maklumat banner.');
        return;
    }

    const payload = { photo, name, company, validity, start_date: startDate, end_date: endDate };
    if (editId) {
        const { error } = await db.from('banners').update(payload).eq('id', editId);
        if (error) { alert('Ralat: ' + error.message); return; }
    } else {
        const { error } = await db.from('banners').insert([{ id: 'BAN-' + Date.now(), ...payload }]);
        if (error) { alert('Ralat: ' + error.message); return; }
    }

    document.getElementById('modal-banner').classList.add('hidden');
    await loadAllData();
    renderBannerTable();
    if (window.renderBanner) window.renderBanner();
}

export async function confirmDeleteBanner(id) {
    if (!confirm('Adakah anda pasti mahu memadam banner ini?')) return;
    const { error } = await db.from('banners').delete().eq('id', id);
    if (error) { alert('Ralat: ' + error.message); return; }
    await loadAllData();
    renderBannerTable();
    if (window.renderBanner) window.renderBanner();
}

// ------------------------------------------------------------
// Review modal
// ------------------------------------------------------------

const AGENDA_CATEGORY_OPTIONS = [
    'Kursus & Latihan', 'Seminar & Forum', 'Bengkel', 'Persidangan & Konvensyen',
    'Networking & Professional', 'Komuniti & Sosial', 'Sukan & Rekreasi',
    'Festival & Hiburan', 'Keusahawanan & Perniagaan', 'Pendidikan',
    'Pelancongan', 'Sukan & Kesihatan', 'Rekreasi & Hobi',
    'Agama & Kerohanian', 'Lain-lain'
];
const AGENDA_MODE_OPTIONS = ['Fizikal', 'Online', 'Hybrid'];
const PROMO_LABEL_OPTIONS = ['', 'Top', 'Featured', 'Promoted'];
const VALIDITY_OPTIONS = ['', '1 Bulan', '3 Bulan', '6 Bulan', '1 Tahun'];
const TRAINER_EXPERTISE_OPTIONS = [
    'Pengurusan & Kepimpinan', 'Sumber Manusia & Organisasi', 'Pentadbiran & Profesional',
    'Perniagaan & Keusahawanan', 'Pemasaran & Jualan', 'Teknologi, AI & Digital',
    'Kreatif, Media & Komunikasi', 'Kewangan, Akaun & Percukaian', 'Pendidikan & Akademik',
    'Kesihatan, Keselamatan & Kesejahteraan', 'Industri & Teknikal', 'Kerajaan & Perkhidmatan Awam',
    'Bahasa & Kemahiran Komunikasi', 'Pelancongan, Hospitaliti & F&B', 'Kualiti, Risiko & Pematuhan',
    'Kemahiran Insaniah & Pembangunan Diri', 'Alam Sekitar & Kelestarian',
    'Kecantikan & Gaya', 'Makanan & Masakan', 'Pelancongan & Hospitaliti',
    'Kesihatan', 'Kemahiran Teknikal & Vokasional', 'Pertanian & Agro', 'Bahasa',
    'Kemahiran Khusus / Lain-lain'
];
const TRAINER_CERT_OPTIONS = [
    'HRD Corp TTT', 'HRD Corp Accredited Trainer', 'Sijil NCS-TTT',
    'SKM3, DKM, atau DLKM', 'Lain-Lain'
];
const TALENT_NICHE_OPTIONS = [
    'Makanan, Minuman & Gaya Hidup', 'Pelancongan, Percutian & Hospitaliti',
    'Kecantikan, Fesyen & Penjagaan Diri Kesihatan', 'Kecergasan & Kesejahteraan',
    'Perniagaan, Kewangan & Keusahawanan', 'Pendidikan, Kerjaya & Pembangunan Diri',
    'Teknologi, Digital & Media Sosial', 'Automotif, Hartanah & Pelaburan',
    'Keluarga, Komuniti, Budaya & Gaya Hidup', 'Pengacaraan & Emcee', 'Hiburan & Seni',
    'Fotografi & Videografi', 'Content Creator'
];

function buildMultiCheckboxGroup(name, options, selectedValues) {
    const selected = selectedValues || [];
    return options.map(opt => `
        <label class="flex items-center gap-2 text-xs">
            <input type="checkbox" name="${name}" value="${opt}" ${selected.includes(opt) ? 'checked' : ''}>
            <span>${opt}</span>
        </label>`).join('');
}

function buildSelectOptions(options, selectedValue) {
    return options.map(opt => {
        const val = opt === '' ? '' : opt;
        const label = opt === '' ? 'Tiada' : opt;
        return `<option value="${val}" ${selectedValue === val ? 'selected' : ''}>${label}</option>`;
    }).join('');
}

export function openAdminReviewModal(id) {
    const item = bayuData.applications.find(a => a.id === id);
    if (!item) return;
    const modalBody = document.getElementById('admin-review-body');
    if (!modalBody) return;

    let typeSpecificFields = '';

    if (item.type === 'Agenda') {
        const feeType = item.feeType || 'Percuma';
        const feeMin = item.hargaMin || '';
        const feeMax = item.hargaMax || '';
        typeSpecificFields = `
            <div class="bg-brand-bg p-3 rounded-xl border border-brand-border">
                <div class="text-[11px] font-bold text-brand uppercase tracking-wider mb-3">Maklumat Agenda</div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tajuk Program</label>
                        <input type="text" id="admin-edit-title" value="${item.title || ''}" required class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Penganjur</label>
                            <input type="text" id="admin-edit-org" value="${item.org || item.penganjur || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama PIC</label>
                            <input type="text" id="admin-edit-name" value="${item.name || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Emel</label>
                            <input type="email" id="admin-edit-email" value="${item.email || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">No. Telefon</label>
                            <input type="tel" id="admin-edit-phone" value="${item.phone || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tarikh Mula</label>
                            <input type="date" id="admin-edit-date" value="${item.date || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tarikh Akhir</label>
                            <input type="date" id="admin-edit-date-end" value="${item.dateEnd || item.date || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Mod</label>
                            <select id="admin-edit-mode" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                                ${buildSelectOptions(AGENDA_MODE_OPTIONS, item.mode || 'Fizikal')}
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Kategori</label>
                            <select id="admin-edit-category" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                                ${buildSelectOptions(AGENDA_CATEGORY_OPTIONS, item.category || '')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Lokasi</label>
                            <input type="text" id="admin-edit-location" value="${item.location || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Jenis Yuran</label>
                            <select id="admin-edit-feetype" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                                <option value="Percuma" ${feeType === 'Percuma' ? 'selected' : ''}>Percuma</option>
                                <option value="Berbayar" ${feeType === 'Berbayar' ? 'selected' : ''}>Berbayar</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Harga Min (RM)</label>
                            <input type="number" id="admin-edit-feemin" value="${feeMin}" min="0" step="0.01" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Harga Maks (RM)</label>
                            <input type="number" id="admin-edit-feemax" value="${feeMax}" min="0" step="0.01" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL / Link Pendaftaran</label>
                        <input type="url" id="admin-edit-url" value="${item.url || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Gambar / Poster</label>
                        <input type="url" id="admin-edit-photo" value="${item.photo || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                </div>
            </div>`;
    } else if (item.type === 'Trainer') {
        typeSpecificFields = `
            <div class="bg-brand-bg p-3 rounded-xl border border-brand-border">
                <div class="text-[11px] font-bold text-brand uppercase tracking-wider mb-3">Maklumat Trainer</div>
                <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama Trainer</label>
                            <input type="text" id="admin-edit-name" value="${item.name || ''}" required class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Emel</label>
                            <input type="email" id="admin-edit-email" value="${item.email || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">No. Telefon</label>
                            <input type="tel" id="admin-edit-phone" value="${item.phone || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Lokasi</label>
                            <input type="text" id="admin-edit-location" value="${item.location || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1.5">Bidang Kepakaran</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto p-2 border border-brand-border rounded-xl bg-white">
                            ${buildMultiCheckboxGroup('admin_trainer_exp', TRAINER_EXPERTISE_OPTIONS, item.expertise || [])}
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1.5">Pentauliahan / Sijil</label>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-2 border border-brand-border rounded-xl bg-white">
                            ${buildMultiCheckboxGroup('admin_trainer_cert', TRAINER_CERT_OPTIONS, item.certs || [])}
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Pentauliahan Lain-lain (Custom)</label>
                        <input type="text" id="admin-edit-cert-custom" maxlength="150" value="${item.certCustom || ''}" placeholder="Asingkan dengan koma (,)" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Ringkasan Profil</label>
                        <textarea id="admin-edit-summary" rows="3" class="w-full bg-white border border-brand-border rounded-xl p-3 text-xs focus:border-brand focus:outline-none">${item.summary || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Social Media / Website</label>
                        <input type="url" id="admin-edit-url" value="${item.url || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Gambar Profil</label>
                        <input type="url" id="admin-edit-photo" value="${item.photo || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                </div>
            </div>`;
    } else if (item.type === 'Talent') {
        typeSpecificFields = `
            <div class="bg-brand-bg p-3 rounded-xl border border-brand-border">
                <div class="text-[11px] font-bold text-brand uppercase tracking-wider mb-3">Maklumat Talent</div>
                <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama Talent</label>
                            <input type="text" id="admin-edit-name" value="${item.name || ''}" required class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Emel</label>
                            <input type="email" id="admin-edit-email" value="${item.email || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">No. Telefon</label>
                            <input type="tel" id="admin-edit-phone" value="${item.phone || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Lokasi</label>
                            <input type="text" id="admin-edit-location" value="${item.location || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Bidang / Niche</label>
                        <select id="admin-edit-niche" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                            ${buildSelectOptions(TALENT_NICHE_OPTIONS, item.niche || '')}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Ringkasan Profil</label>
                        <textarea id="admin-edit-summary" rows="3" class="w-full bg-white border border-brand-border rounded-xl p-3 text-xs focus:border-brand focus:outline-none">${item.summary || ''}</textarea>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Social Media / Website</label>
                        <input type="url" id="admin-edit-url" value="${item.url || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Gambar Profil</label>
                        <input type="url" id="admin-edit-photo" value="${item.photo || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                </div>
            </div>`;
    }

    const hasLabel = item.label && item.label.trim() !== '';
    const labelOptionsHtml = PROMO_LABEL_OPTIONS.map(opt => {
        const val = opt;
        const label = opt === '' ? 'Tiada Label' : opt;
        return `<option value="${val}" ${item.label === val ? 'selected' : ''}>${label}</option>`;
    }).join('');

    modalBody.innerHTML = `
        <form onsubmit="handleSaveAdminEdit(event, '${item.id}')" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Jenis</label>
                    <input type="text" value="${item.type}" disabled class="w-full bg-gray-100 border border-brand-border rounded-xl px-3.5 py-2 text-xs font-bold text-brand">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">ID</label>
                    <input type="text" value="${item.id}" disabled class="w-full bg-gray-100 border border-brand-border rounded-xl px-3.5 py-2 text-xs font-bold text-brand-muted">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Status Kelulusan</label>
                    <select id="admin-edit-approval" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand focus:outline-none">
                        <option value="Pending" ${item.approval === 'Pending' ? 'selected' : ''}>Menunggu Semakan</option>
                        <option value="Approved" ${item.approval === 'Approved' ? 'selected' : ''}>Diluluskan</option>
                    </select>
                </div>
            </div>

            ${typeSpecificFields}

            <div class="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div class="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-3">
                    <i class="fa-solid fa-star mr-1"></i> Label Promosi & Tempoh Sah
                </div>
                <div class="space-y-3">
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Label Promosi</label>
                        <select id="admin-edit-label" onchange="toggleAdminLabelFields()" class="w-full bg-white border border-brand-border rounded-xl px-3.5 py-2 text-sm focus:border-brand focus:outline-none">
                            ${labelOptionsHtml}
                        </select>
                    </div>

                    <div id="admin-label-fields-wrapper" class="${hasLabel ? '' : 'hidden'} space-y-3">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tempoh Sah</label>
                                <select id="admin-edit-validity" onchange="onAdminValidityChange()" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand focus:outline-none">
                                    ${buildSelectOptions(VALIDITY_OPTIONS, item.validity || '')}
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tarikh Dari</label>
                                <input type="date" id="admin-edit-dari" value="${item.tarikhDari || ''}" onchange="onAdminDariChange()" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand focus:outline-none">
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Hingga</label>
                                <input type="date" id="admin-edit-hingga" value="${item.tarikhSehingga || ''}" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-xs focus:border-brand focus:outline-none">
                            </div>
                        </div>
                        <button type="button" onclick="resetAdminLabelDates()" class="bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors">
                            <i class="fa-solid fa-rotate-left mr-1"></i> Reset Tarikh
                        </button>
                    </div>
                </div>
            </div>

            <div class="pt-4 border-t border-brand-border flex gap-3">
                <button type="button" onclick="closeAdminReviewModal()" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl text-xs transition-colors">Batal</button>
                <button type="submit" class="w-1/2 bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-xl text-xs transition-colors">Simpan Perubahan</button>
            </div>
        </form>`;

    document.getElementById('modal-admin-review').classList.remove('hidden');
}

export function toggleAdminLabelFields() {
    const labelVal = document.getElementById('admin-edit-label').value;
    const wrapper = document.getElementById('admin-label-fields-wrapper');
    if (!wrapper) return;
    if (labelVal && labelVal.trim() !== '') wrapper.classList.remove('hidden');
    else wrapper.classList.add('hidden');
}

export function onAdminValidityChange() {
    const dari = document.getElementById('admin-edit-dari').value;
    const validity = document.getElementById('admin-edit-validity').value;
    const hinggaEl = document.getElementById('admin-edit-hingga');
    if (!hinggaEl) return;
    if (dari && validity) {
        const calc = calculateTarikhTamat(dari, validity);
        if (calc) hinggaEl.value = calc;
    }
}

export function onAdminDariChange() {
    onAdminValidityChange();
}

export function resetAdminLabelDates() {
    const dariEl = document.getElementById('admin-edit-dari');
    const hinggaEl = document.getElementById('admin-edit-hingga');
    const validityEl = document.getElementById('admin-edit-validity');
    if (dariEl) dariEl.value = '';
    if (hinggaEl) hinggaEl.value = '';
    if (validityEl) validityEl.value = '';
}

export async function handleSaveAdminEdit(e, id) {
    e.preventDefault();
    const item = bayuData.applications.find(a => a.id === id);
    if (!item) return;

    const approvalVal = document.getElementById('admin-edit-approval').value;
    const labelVal = document.getElementById('admin-edit-label').value;
    const validityVal = document.getElementById('admin-edit-validity')?.value || '';
    let dariVal = document.getElementById('admin-edit-dari')?.value || '';
    let hinggaVal = document.getElementById('admin-edit-hingga')?.value || '';

    const updated = { ...item };
    updated.approval = approvalVal;
    updated.label = labelVal;

    if (labelVal && labelVal.trim() !== '') {
        updated.validity = validityVal;
        updated.tarikhDari = dariVal;
        if (dariVal && validityVal && !hinggaVal) hinggaVal = calculateTarikhTamat(dariVal, validityVal);
        updated.tarikhSehingga = hinggaVal;
    } else {
        updated.validity = '';
        updated.tarikhDari = '';
        updated.tarikhSehingga = '';
    }

    if (item.type === 'Agenda') {
        updated.title = document.getElementById('admin-edit-title').value.trim();
        updated.org = document.getElementById('admin-edit-org').value.trim();
        updated.penganjur = updated.org;
        updated.name = document.getElementById('admin-edit-name').value.trim() || updated.org;
        updated.email = document.getElementById('admin-edit-email').value.trim();
        updated.phone = document.getElementById('admin-edit-phone').value.trim();
        updated.date = document.getElementById('admin-edit-date').value;
        updated.dateEnd = document.getElementById('admin-edit-date-end').value;
        updated.mode = document.getElementById('admin-edit-mode').value;
        updated.category = document.getElementById('admin-edit-category').value;
        updated.location = document.getElementById('admin-edit-location').value.trim();
        updated.url = document.getElementById('admin-edit-url').value.trim();
        updated.photo = document.getElementById('admin-edit-photo').value.trim();
        updated.feeType = document.getElementById('admin-edit-feetype').value;
        const feeMin = document.getElementById('admin-edit-feemin')?.value;
        const feeMax = document.getElementById('admin-edit-feemax')?.value;
        updated.hargaMin = feeMin ? parseFloat(feeMin) : null;
        updated.hargaMax = feeMax ? parseFloat(feeMax) : null;
        if (updated.feeType === 'Berbayar' && updated.hargaMin) {
            updated.hargaYuran = (updated.hargaMax && updated.hargaMax > updated.hargaMin)
                ? `RM${updated.hargaMin} - RM${updated.hargaMax}`
                : `RM${updated.hargaMin}`;
        } else {
            updated.hargaYuran = 'Percuma';
        }
    } else if (item.type === 'Trainer') {
        updated.name = document.getElementById('admin-edit-name').value.trim();
        updated.email = document.getElementById('admin-edit-email').value.trim();
        updated.phone = document.getElementById('admin-edit-phone').value.trim();
        updated.location = document.getElementById('admin-edit-location').value.trim();
        updated.summary = document.getElementById('admin-edit-summary').value.trim();
        if (countWords(updated.summary) > 120) {
            alert('Ringkasan Profil Trainer tidak boleh melebihi 120 patah perkataan.');
            return;
        }
        updated.url = document.getElementById('admin-edit-url').value.trim();
        updated.photo = document.getElementById('admin-edit-photo').value.trim();
        const expBoxes = document.querySelectorAll('input[name="admin_trainer_exp"]:checked');
        updated.expertise = Array.from(expBoxes).map(cb => cb.value);
        if (updated.expertise.length === 0) updated.expertise = ['Pengurusan & Kepimpinan'];
        const certBoxes = document.querySelectorAll('input[name="admin_trainer_cert"]:checked');
        updated.certs = Array.from(certBoxes).map(cb => cb.value);
        const customCertInput = document.getElementById('admin-edit-cert-custom');
        updated.certCustom = (customCertInput && customCertInput.value) ? customCertInput.value.trim().slice(0, 150) : '';
    } else if (item.type === 'Talent') {
        updated.name = document.getElementById('admin-edit-name').value.trim();
        updated.email = document.getElementById('admin-edit-email').value.trim();
        updated.phone = document.getElementById('admin-edit-phone').value.trim();
        updated.location = document.getElementById('admin-edit-location').value.trim();
        updated.niche = document.getElementById('admin-edit-niche').value;
        updated.summary = document.getElementById('admin-edit-summary').value.trim();
        if (countWords(updated.summary) > 120) {
            alert('Ringkasan Profil Talent tidak boleh melebihi 120 patah perkataan.');
            return;
        }
        updated.url = document.getElementById('admin-edit-url').value.trim();
        updated.photo = document.getElementById('admin-edit-photo').value.trim();
    }

    const { error } = await db.from('applications').update(rowFromApp(updated)).eq('id', id);
    if (error) { alert('Ralat menyimpan: ' + error.message); return; }
    document.getElementById('modal-admin-review')?.classList.add('hidden');
    await loadAllData();
    window.refreshAllViews?.();
}

// ------------------------------------------------------------
// Delete application
// ------------------------------------------------------------

let pendingDeleteId = null;

export function confirmDeleteApplication(id) {
    pendingDeleteId = id;
    document.getElementById('modal-confirm-delete').classList.remove('hidden');
    const btn = document.getElementById('btn-confirm-delete');
    if (btn) btn.onclick = executeDeleteApplication;
}

export async function executeDeleteApplication() {
    const id = pendingDeleteId;
    if (!id) return;
    const { error } = await db.from('applications').delete().eq('id', id);
    if (error) { alert('Ralat memadam: ' + error.message); return; }
    pendingDeleteId = null;
    document.getElementById('modal-confirm-delete')?.classList.add('hidden');
    await loadAllData();
    window.refreshAllViews?.();
}
