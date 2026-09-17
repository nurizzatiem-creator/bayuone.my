// ============================================================
// BayuOne — Admin page entry point
// ============================================================
// Loaded only by /admin/index.html. Handles:
//   - Checking the admin's Supabase Auth session
//   - Showing the login gate if not authenticated
//   - Rendering the admin dashboard if authenticated
//   - Logout
// ============================================================

import { db } from './supabase-client.js';
import { loadAllData } from './data-loader.js';

// Admin dashboard renderers
import {
    renderAdminTable,
    renderBannerTable,
    openAdminReviewModal,
    openBannerModal,
    calculateBannerEndDate,
    handleSaveBanner,
    confirmDeleteBanner,
    confirmDeleteApplication,
    toggleAdminLabelFields,
    onAdminValidityChange,
    onAdminDariChange,
    resetAdminLabelDates,
    handleSaveAdminEdit
} from './admin.js';

import {
    renderFeedbackTable,
    openFeedbackPreview,
    toggleFeedbackStatus
} from './feedback.js';

import {
    renderSubscriberTable,
    openEditSubscriberModal,
    handleSaveSubscriber
} from './subscriber.js';

import {
    openPartnerModal,
    handleSavePartner,
    confirmDeletePartner,
    renderPartnerTable
} from './partner.js';

// ------------------------------------------------------------
// The full admin dashboard HTML
// ------------------------------------------------------------

const ADMIN_DASHBOARD_HTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-brand-border shadow-sm">
        <div>
            <span class="text-xs font-bold text-brand uppercase tracking-wider">PANEL PENGURUSAN <span class="brand-text-b">Bayu</span><span class="brand-text-o">One</span></span>
            <h2 class="text-2xl font-extrabold text-brand-dark">Admin Dashboard & Kelulusan Permohonan</h2>
            <p class="text-xs text-brand-muted mt-1">Semak, luluskan, muat naik gambar dan urus tempoh sah penganjur, trainer & talent.</p>
        </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div class="bg-white p-4 rounded-xl border border-brand-border shadow-2xs">
            <span class="text-[11px] font-bold text-brand-muted uppercase">Jumlah</span>
            <div id="stat-total" class="text-2xl font-extrabold text-brand-dark mt-1">0</div>
        </div>
        <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 shadow-2xs">
            <span class="text-[11px] font-bold text-amber-700 uppercase">Menunggu</span>
            <div id="stat-pending" class="text-2xl font-extrabold text-amber-800 mt-1">0</div>
        </div>
        <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-2xs">
            <span class="text-[11px] font-bold text-blue-700 uppercase">Diluluskan</span>
            <div id="stat-approved" class="text-2xl font-extrabold text-blue-800 mt-1">0</div>
        </div>
        <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <span class="text-[11px] font-bold text-emerald-700 uppercase">Aktif</span>
            <div id="stat-active" class="text-2xl font-extrabold text-emerald-800 mt-1">0</div>
        </div>
        <div class="bg-orange-50 p-4 rounded-xl border border-orange-200 shadow-2xs">
            <span class="text-[11px] font-bold text-orange-700 uppercase">Akan Tamat</span>
            <div id="stat-expiring" class="text-2xl font-extrabold text-orange-800 mt-1">0</div>
        </div>
        <div class="bg-red-50 p-4 rounded-xl border border-red-200 shadow-2xs">
            <span class="text-[11px] font-bold text-red-700 uppercase">Luput</span>
            <div id="stat-expired" class="text-2xl font-extrabold text-red-800 mt-1">0</div>
        </div>
        <div class="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-2xs">
            <span class="text-[11px] font-bold text-gray-600 uppercase">Batal/Padam</span>
            <div id="stat-cancelled" class="text-2xl font-extrabold text-gray-700 mt-1">0</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-2xs">
            <span class="text-[11px] font-bold text-purple-700 uppercase">Maklum Balas</span>
            <div id="stat-feedback" class="text-2xl font-extrabold text-purple-800 mt-1">0</div>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-brand-border shadow-xs overflow-hidden">
        <div class="p-4 bg-brand-bg border-b border-brand-border flex flex-wrap items-center justify-between gap-3">
            <div class="flex items-center gap-2 flex-grow max-w-md">
                <i class="fa-solid fa-search text-brand-muted ml-2"></i>
                <input type="text" id="admin-search" placeholder="Cari pemohon / organisasi / emel..." class="w-full bg-white border border-brand-border rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-brand">
            </div>
            <div class="flex flex-wrap items-center gap-2">
                <select id="admin-filter-type" class="bg-white border border-brand-border rounded-xl px-2.5 py-1.5 text-xs font-medium">
                    <option value="">Semua Jenis</option>
                    <option value="Agenda">Agenda</option>
                    <option value="Trainer">Trainer</option>
                    <option value="Talent">Talent</option>
                </select>
                <select id="admin-filter-approval" class="bg-white border border-brand-border rounded-xl px-2.5 py-1.5 text-xs font-medium">
                    <option value="">Semua Kelulusan</option>
                    <option value="Pending">Menunggu Semakan</option>
                    <option value="Approved">Diluluskan</option>
                </select>
                <select id="admin-filter-status" class="bg-white border border-brand-border rounded-xl px-2.5 py-1.5 text-xs font-medium">
                    <option value="">Semua Status Sah</option>
                    <option value="ACTIVE">Aktif</option>
                    <option value="EXPIRING">Akan Tamat</option>
                    <option value="EXPIRED">Luput</option>
                    <option value="CANCELLED">Dibatalkan</option>
                </select>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                        <th class="p-3.5">Gambar</th>
                        <th class="p-3.5">Permohonan</th>
                        <th class="p-3.5">Pemohon / Organisasi / Email</th>
                        <th class="p-3.5">Tarikh</th>
                        <th class="p-3.5">Kelulusan</th>
                        <th class="p-3.5">Label</th>
                        <th class="p-3.5">Tempoh Sah</th>
                        <th class="p-3.5">Tarikh Dari</th>
                        <th class="p-3.5">Hingga</th>
                        <th class="p-3.5 text-right">Tindakan</th>
                    </tr>
                </thead>
                <tbody id="admin-table-body" class="divide-y divide-brand-border"></tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
            <div>
                <h3 class="text-xl font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                    <i class="fa-solid fa-image text-brand"></i>
                    BANNER
                </h3>
                <p class="text-xs text-brand-muted">Urus banner iklan yang dipaparkan di halaman Agenda awam (1600 × 150 px).</p>
            </div>
            <button id="btn-add-banner" class="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Tambah Banner
            </button>
        </div>
        <div class="overflow-x-auto border border-brand-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                        <th class="p-3.5">Gambar</th>
                        <th class="p-3.5">Nama Iklan</th>
                        <th class="p-3.5">Syarikat / Individu</th>
                        <th class="p-3.5">Tempoh</th>
                        <th class="p-3.5">Tarikh Mula</th>
                        <th class="p-3.5">Tarikh Tamat</th>
                        <th class="p-3.5">Status</th>
                        <th class="p-3.5 text-right">Tindakan</th>
                    </tr>
                </thead>
                <tbody id="banner-table-body" class="divide-y divide-brand-border"></tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-6">
        <div class="border-b border-brand-border pb-4">
            <h3 class="text-xl font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                <i class="fa-solid fa-comments text-brand"></i>
                MAKLUM BALAS DASHBOARD
            </h3>
            <p class="text-xs text-brand-muted">Semak dan urus maklum balas yang dihantar oleh pengguna.</p>
        </div>
        <div class="overflow-x-auto border border-brand-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                        <th class="p-3.5">Tarikh</th>
                        <th class="p-3.5">Nama</th>
                        <th class="p-3.5">Emel</th>
                        <th class="p-3.5">Maklum Balas</th>
                        <th class="p-3.5">Status</th>
                        <th class="p-3.5 text-right">Tindakan</th>
                    </tr>
                </thead>
                <tbody id="feedback-table-body" class="divide-y divide-brand-border"></tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-6">
        <div class="border-b border-brand-border pb-4">
            <h3 class="text-xl font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                <i class="fa-solid fa-users text-brand"></i>
                SUBSCRIBER DASHBOARD
            </h3>
            <p class="text-xs text-brand-muted">Pantau dan urus maklumat serta status pelanggan.</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="bg-brand-bg p-4 rounded-xl border border-brand-border shadow-2xs">
                <span class="text-[11px] font-bold text-brand-muted uppercase tracking-wider">Total Subscribers</span>
                <div id="stat-sub-total" class="text-2xl font-extrabold text-brand-dark mt-1">0</div>
            </div>
            <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-200 shadow-2xs">
                <span class="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">New Subscribers</span>
                <div id="stat-sub-new" class="text-2xl font-extrabold text-emerald-800 mt-1">0</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-2xs">
                <span class="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Existing Subscribers</span>
                <div id="stat-sub-existing" class="text-2xl font-extrabold text-blue-800 mt-1">0</div>
            </div>
        </div>
        <div class="overflow-x-auto border border-brand-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                        <th class="p-3.5">Name</th>
                        <th class="p-3.5">Email</th>
                        <th class="p-3.5">Minat</th>
                        <th class="p-3.5 text-right">Action</th>
                    </tr>
                </thead>
                <tbody id="subscriber-table-body" class="divide-y divide-brand-border"></tbody>
            </table>
        </div>
    </div>

    <div class="bg-white rounded-2xl border border-brand-border shadow-xs p-6 space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-4">
            <div>
                <h3 class="text-xl font-extrabold text-brand-dark uppercase tracking-wide flex items-center gap-2">
                    <i class="fa-solid fa-handshake text-brand"></i>
                    Partnerships/Collaborations
                </h3>
                <p class="text-xs text-brand-muted">Urus sehingga 10 rakan kongsi/brand yang dipaparkan di laman awam.</p>
            </div>
            <button id="btn-add-partner" class="bg-brand hover:bg-brand-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
                <i class="fa-solid fa-plus"></i> Tambah Partner
            </button>
        </div>
        <div class="overflow-x-auto border border-brand-border rounded-xl">
            <table class="w-full text-left border-collapse text-xs">
                <thead>
                    <tr class="bg-gray-50 border-b border-brand-border text-brand-muted uppercase font-bold tracking-wider">
                        <th class="p-3.5">Posisi</th>
                        <th class="p-3.5">Gambar</th>
                        <th class="p-3.5">Nama</th>
                        <th class="p-3.5">Image URL</th>
                        <th class="p-3.5">Status</th>
                        <th class="p-3.5 text-right">Tindakan</th>
                    </tr>
                </thead>
                <tbody id="partner-table-body" class="divide-y divide-brand-border"></tbody>
            </table>
        </div>
    </div>

    <!-- ADMIN MODALS (hidden) -->
    <div id="modal-banner" class="fixed inset-0 z-50 hidden overflow-y-auto modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 border border-brand-border">
            <button id="close-banner-modal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h3 id="banner-modal-title" class="text-lg font-bold text-brand-dark mb-1">Tambah Banner</h3>
            <p class="text-xs text-brand-muted mb-4">Isi maklumat iklan banner.</p>
            <form id="form-banner" class="space-y-4">
                <input type="hidden" id="banner-edit-id" value="">
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">URL Foto Banner <span class="text-red-500">*</span></label>
                    <input type="url" id="banner-photo" required placeholder="https://..." class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                    <p class="text-[10px] text-brand-muted mt-1">Saiz disyorkan: 1600 × 150 px</p>
                    <div id="banner-photo-preview" class="mt-2 hidden"><img src="" alt="Preview" class="max-h-24 rounded border border-brand-border"></div>
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama Iklan <span class="text-red-500">*</span></label>
                    <input type="text" id="banner-name" required placeholder="Contoh: Promosi Kursus AI" class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama Syarikat / Individu <span class="text-red-500">*</span></label>
                    <input type="text" id="banner-company" required placeholder="Contoh: ABC Training Sdn. Bhd." class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tempoh Iklan <span class="text-red-500">*</span></label>
                        <select id="banner-validity" required class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                            <option value="">Pilih Tempoh</option>
                            <option value="1 Bulan">1 Bulan</option>
                            <option value="3 Bulan">3 Bulan</option>
                            <option value="6 Bulan">6 Bulan</option>
                            <option value="1 Tahun">1 Tahun</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tarikh Mula <span class="text-red-500">*</span></label>
                        <input type="date" id="banner-start-date" required class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Tarikh Tamat (Auto)</label>
                    <input type="date" id="banner-end-date" readonly disabled class="w-full bg-gray-100 border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-muted">
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="button" id="cancel-banner-btn" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors">Batal</button>
                    <button type="submit" class="w-1/2 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl text-xs transition-colors">Simpan Banner</button>
                </div>
            </form>
        </div>
    </div>

    <div id="modal-partner" class="fixed inset-0 z-50 hidden overflow-y-auto modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 border border-brand-border">
            <button id="close-partner-modal" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h3 id="partner-modal-title" class="text-lg font-bold text-brand-dark mb-1">Tambah Partner</h3>
            <p class="text-xs text-brand-muted mb-4">Isi maklumat rakan kongsi / brand.</p>
            <form id="form-partner" class="space-y-4">
                <input type="hidden" id="partner-edit-id" value="">
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Nama Syarikat / Individu <span class="text-red-500">*</span></label>
                    <input type="text" id="partner-name" required placeholder="Contoh: TechMaju Sdn. Bhd." class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Image URL <span class="text-red-500">*</span></label>
                    <input type="url" id="partner-image" required placeholder="https://..." class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                    <p class="text-[10px] text-brand-muted mt-1">Saiz disyorkan: 500 × 500 px</p>
                    <div id="partner-image-preview" class="mt-2 hidden"><img src="" alt="Preview" class="max-h-20 rounded border border-brand-border"></div>
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Posisi Paparan (1 - 10) <span class="text-red-500">*</span></label>
                    <input type="number" id="partner-position" min="1" max="10" required class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                    <p class="text-[10px] text-brand-muted mt-1">Posisi 1 dipaparkan dahulu.</p>
                </div>
                <div class="flex gap-3 pt-2">
                    <button type="button" id="cancel-partner-btn" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors">Batal</button>
                    <button type="submit" class="w-1/2 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl text-xs transition-colors">Simpan Partner</button>
                </div>
            </form>
        </div>
    </div>

    <div id="modal-feedback-preview" class="fixed inset-0 z-50 hidden overflow-y-auto modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8 border border-brand-border">
            <button id="close-feedback-preview" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h3 class="text-lg font-bold text-brand-dark mb-1">Maklum Balas Penuh</h3>
            <p class="text-xs text-brand-muted mb-4">Maklumat lengkap yang dihantar oleh pengguna.</p>
            <div id="feedback-preview-body" class="space-y-3 text-sm max-h-[60vh] overflow-y-auto pr-2"></div>
            <div class="pt-4 mt-4 border-t border-brand-border">
                <button id="close-feedback-preview-2" class="w-full bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl text-sm transition-colors">Tutup</button>
            </div>
        </div>
    </div>

    <div id="modal-admin-review" class="fixed inset-0 z-50 hidden overflow-y-auto modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative my-8 border border-brand-border">
            <button id="close-admin-review" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h3 class="text-lg font-bold text-brand-dark mb-1">Semakan & Edit Permohonan</h3>
            <p class="text-xs text-brand-muted mb-4">Kemaskini semua maklumat permohonan, kelulusan, tempoh sah dan label promosi.</p>
            <div id="admin-review-body" class="space-y-4"></div>
        </div>
    </div>

    <div id="modal-edit-subscriber" class="fixed inset-0 z-50 hidden modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-brand-border">
            <button id="close-edit-subscriber" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><i class="fa-solid fa-xmark text-lg"></i></button>
            <h3 class="text-lg font-bold text-brand-dark mb-1">Edit Subscriber</h3>
            <p class="text-xs text-brand-muted mb-4">Kemaskini maklumat pelanggan hebahan.</p>
            <form id="form-edit-subscriber" class="space-y-4">
                <input type="hidden" id="edit-sub-id">
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Name <span class="text-red-500">*</span></label>
                    <input type="text" id="edit-sub-name" required class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Email <span class="text-red-500">*</span></label>
                    <input type="email" id="edit-sub-email" required class="w-full bg-white border border-brand-border rounded-xl px-3 py-2 text-sm focus:border-brand focus:outline-none">
                </div>
                <div>
                    <label class="block text-xs font-bold uppercase text-brand-dark mb-1">Minat <span class="text-red-500">*</span></label>
                    <textarea id="edit-sub-minat" rows="3" required class="w-full bg-white border border-brand-border rounded-xl p-3 text-sm focus:border-brand focus:outline-none"></textarea>
                </div>
                <div class="flex gap-2 pt-2">
                    <button type="button" id="cancel-edit-subscriber" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-colors">Batal</button>
                    <button type="submit" class="w-1/2 bg-brand hover:bg-brand-dark text-white font-bold py-2.5 rounded-xl text-xs transition-colors">Simpan Perubahan</button>
                </div>
            </form>
        </div>
    </div>

    <div id="modal-confirm-delete" class="fixed inset-0 z-50 hidden modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center border border-brand-border space-y-4">
            <div class="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl">
                <i class="fa-solid fa-trash-can"></i>
            </div>
            <h3 class="text-base font-bold text-brand-dark" id="delete-modal-title">Pengesahan Padam</h3>
            <p class="text-xs text-brand-muted" id="delete-modal-msg">Adakah anda pasti mahu memadam permohonan ini?</p>
            <div class="flex gap-3 pt-2">
                <button type="button" id="cancel-delete" class="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs font-semibold transition-colors">Batal</button>
                <button type="button" id="btn-confirm-delete" class="w-1/2 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors">Padam</button>
            </div>
        </div>
    </div>
`;

// ------------------------------------------------------------
// Render the dashboard once authenticated
// ------------------------------------------------------------

function renderAdminDashboard() {
    const container = document.getElementById('admin-page-content');
    if (!container) return;

    container.innerHTML = ADMIN_DASHBOARD_HTML;

    // Wire up all handlers
    document.getElementById('btn-logout')?.addEventListener('click', handleLogout);
    document.getElementById('btn-add-banner')?.addEventListener('click', () => openBannerModal());
    document.getElementById('btn-add-partner')?.addEventListener('click', () => openPartnerModal());
    document.getElementById('close-banner-modal')?.addEventListener('click', closeBanner);
    document.getElementById('cancel-banner-btn')?.addEventListener('click', closeBanner);
    document.getElementById('close-partner-modal')?.addEventListener('click', closePartner);
    document.getElementById('cancel-partner-btn')?.addEventListener('click', closePartner);
    document.getElementById('close-feedback-preview')?.addEventListener('click', () => closeModalById('modal-feedback-preview'));
    document.getElementById('close-feedback-preview-2')?.addEventListener('click', () => closeModalById('modal-feedback-preview'));
    document.getElementById('close-admin-review')?.addEventListener('click', () => closeModalById('modal-admin-review'));
    document.getElementById('close-edit-subscriber')?.addEventListener('click', () => closeModalById('modal-edit-subscriber'));
    document.getElementById('cancel-edit-subscriber')?.addEventListener('click', () => closeModalById('modal-edit-subscriber'));
    document.getElementById('cancel-delete')?.addEventListener('click', () => closeModalById('modal-confirm-delete'));
    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
        if (window.__applicationToDelete) {
            // Handled by admin.js logic via confirmDeleteApplication
        }
    });

    // Search & filter listeners
    document.getElementById('admin-search')?.addEventListener('keyup', renderAdminTable);
    document.getElementById('admin-filter-type')?.addEventListener('change', renderAdminTable);
    document.getElementById('admin-filter-approval')?.addEventListener('change', renderAdminTable);
    document.getElementById('admin-filter-status')?.addEventListener('change', renderAdminTable);

    // Form submissions
    document.getElementById('form-banner')?.addEventListener('submit', handleSaveBanner);
    document.getElementById('form-partner')?.addEventListener('submit', handleSavePartner);
    document.getElementById('form-edit-subscriber')?.addEventListener('submit', handleSaveSubscriber);

    // Auto-calc banner end date
    document.getElementById('banner-validity')?.addEventListener('change', calculateBannerEndDate);
    document.getElementById('banner-start-date')?.addEventListener('change', calculateBannerEndDate);

    // Image previews
    document.getElementById('banner-photo')?.addEventListener('input', function () {
        const url = this.value.trim();
        const preview = document.getElementById('banner-photo-preview');
        if (!preview) return;
        if (url) { preview.classList.remove('hidden'); preview.querySelector('img').src = url; }
        else preview.classList.add('hidden');
    });
    document.getElementById('partner-image')?.addEventListener('input', function () {
        const url = this.value.trim();
        const preview = document.getElementById('partner-image-preview');
        if (!preview) return;
        if (url) { preview.classList.remove('hidden'); preview.querySelector('img').src = url; }
        else preview.classList.add('hidden');
    });

    // Expose functions that admin.js expects on window
    Object.assign(window, {
        openAdminReviewModal,
        openBannerModal,
        openPartnerModal,
        openEditSubscriberModal,
        openFeedbackPreview,
        toggleFeedbackStatus,
        confirmDeleteApplication,
        confirmDeleteBanner,
        confirmDeletePartner,
        handleSaveAdminEdit,
        toggleAdminLabelFields,
        onAdminValidityChange,
        onAdminDariChange,
        resetAdminLabelDates
    });

    // Render all tables
    renderAdminTable();
    renderBannerTable();
    renderFeedbackTable();
    renderSubscriberTable();
    renderPartnerTable();
}

function closeBanner() { closeModalById('modal-banner'); }
function closePartner() { closeModalById('modal-partner'); }
function closeModalById(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
}

// ------------------------------------------------------------
// Auth: login, logout, session check
// ------------------------------------------------------------

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('admin-login-email').value;
    const password = document.getElementById('admin-login-pass').value;
    const errorEl = document.getElementById('admin-login-error');
    const submitBtn = document.querySelector('#admin-login-form button[type="submit"]');

    errorEl.classList.add('hidden');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Log Masuk...'; }

    const { error } = await db.auth.signInWithPassword({ email, password });

    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Log Masuk'; }

    if (error) {
        errorEl.textContent = error.message;
        errorEl.classList.remove('hidden');
        return;
    }

    await showAdminUI();
}

async function handleLogout() {
    try { await db.auth.signOut(); } catch (err) { console.warn(err); }
    showLoginGate();
}

async function checkSession() {
    try {
        const { data: { session } } = await db.auth.getSession();
        return session?.user || null;
    } catch (err) {
        console.warn('Session check failed:', err);
        return null;
    }
}

function showLoginGate() {
    document.getElementById('admin-login-gate')?.classList.remove('hidden');
    document.getElementById('admin-content')?.classList.add('hidden');
    document.getElementById('admin-loading')?.classList.add('hidden');
}

function showAdminGate() {
    document.getElementById('admin-login-gate')?.classList.add('hidden');
    document.getElementById('admin-content')?.classList.remove('hidden');
    document.getElementById('admin-loading')?.classList.add('hidden');
}

async function showAdminUI() {
    await loadAllData();
    renderAdminDashboard();
    showAdminGate();
}

// ------------------------------------------------------------
// Boot
// ------------------------------------------------------------

(async function init() {
    // Wire up login form
    document.getElementById('admin-login-form')?.addEventListener('submit', handleLogin);

    // Check existing session
    const user = await checkSession();

    if (user) {
        // Already logged in — show dashboard
        await showAdminUI();
    } else {
        // Not logged in — show login gate
        showLoginGate();
    }
})();
