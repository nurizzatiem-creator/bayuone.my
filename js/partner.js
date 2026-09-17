// ============================================================
// BayuOne — Partner (admin table + public brands support section)
// ============================================================

import { db } from './supabase-client.js';
import { bayuData, loadAllData } from './data-loader.js';
import { renderBrandsSupport } from './banner.js';

export function openPartnerModal(id) {
    const modal = document.getElementById('modal-partner');
    const title = document.getElementById('partner-modal-title');
    const form = document.getElementById('form-partner');

    if (id) {
        const p = bayuData.partnerships.find(x => x.id === id);
        if (!p) return;
        title.textContent = 'Edit Partner';
        document.getElementById('partner-edit-id').value = p.id;
        document.getElementById('partner-name').value = p.name;
        document.getElementById('partner-image').value = p.image;
        document.getElementById('partner-position').value = p.position;
        document.getElementById('partner-image-preview').classList.remove('hidden');
        document.getElementById('partner-image-preview').querySelector('img').src = p.image;
    } else {
        title.textContent = 'Tambah Partner';
        document.getElementById('partner-edit-id').value = '';
        form.reset();
        const used = bayuData.partnerships.map(p => p.position);
        let next = 1;
        while (used.includes(next) && next <= 10) next++;
        document.getElementById('partner-position').value = next <= 10 ? next : 10;
        document.getElementById('partner-image-preview').classList.add('hidden');
    }
    modal.classList.remove('hidden');
}

export async function handleSavePartner(e) {
    e.preventDefault();
    const editId = document.getElementById('partner-edit-id').value;
    const name = document.getElementById('partner-name').value.trim();
    const image = document.getElementById('partner-image').value.trim();
    const position = parseInt(document.getElementById('partner-position').value, 10);

    if (!name || !image || !position || position < 1 || position > 10) {
        alert('Sila isi semua maklumat dengan posisi 1 - 10.');
        return;
    }

    const conflicting = bayuData.partnerships.find(p => p.position === position && p.id !== editId);
    if (conflicting) await db.from('partnerships').delete().eq('id', conflicting.id);

    const payload = { name, image, position };
    if (editId) {
        const { error } = await db.from('partnerships').update(payload).eq('id', editId);
        if (error) { alert('Ralat: ' + error.message); return; }
    } else {
        const { error } = await db.from('partnerships').insert([{ id: 'PTN-' + Date.now(), ...payload }]);
        if (error) { alert('Ralat: ' + error.message); return; }
    }

    document.getElementById('modal-partner').classList.add('hidden');
    await loadAllData();
    renderPartnerTable();
    renderBrandsSupport();
}

export async function confirmDeletePartner(id) {
    if (!confirm('Adakah anda pasti mahu memadam partner ini?')) return;
    const { error } = await db.from('partnerships').delete().eq('id', id);
    if (error) { alert('Ralat: ' + error.message); return; }
    await loadAllData();
    renderPartnerTable();
    renderBrandsSupport();
}

export function renderPartnerTable() {
    const tbody = document.getElementById('partner-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    const sorted = [...bayuData.partnerships].sort((a, b) => a.position - b.position);
    sorted.forEach(p => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-bg/50 transition-colors';
        tr.innerHTML = `
            <td class="p-3.5 font-bold text-brand-dark">${p.position}</td>
            <td class="p-3.5"><img src="${p.image}" class="w-10 h-10 rounded-lg object-contain border border-brand-border bg-white p-1" onerror="this.style.display='none'"></td>
            <td class="p-3.5 font-bold text-brand-dark">${p.name}</td>
            <td class="p-3.5 text-brand-muted text-[11px] break-all max-w-xs">${p.image}</td>
            <td class="p-3.5"><span class="px-2.5 py-1 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">Aktif</span></td>
            <td class="p-3.5 text-right space-x-2">
                <button onclick="openPartnerModal('${p.id}')" class="bg-brand text-white px-3 py-1.5 rounded-lg font-bold text-[11px] hover:bg-brand-dark transition-colors">
                    <i class="fa-solid fa-pen-to-square mr-1"></i> Edit
                </button>
                <button onclick="confirmDeletePartner('${p.id}')" class="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition-colors">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>`;
        tbody.appendChild(tr);
    });
}
