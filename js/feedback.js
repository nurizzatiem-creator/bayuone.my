// ============================================================
// BayuOne — Feedback (public submit + admin table)
// ============================================================

import { db } from './supabase-client.js';
import { bayuData, loadAllData } from './data-loader.js';

export async function handleFeedbackSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('fb-name').value.trim();
    const email = document.getElementById('fb-email').value.trim();
    const message = document.getElementById('fb-message').value.trim();
    if (!name || !email || !message) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0] + ' ' + now.toTimeString().split(' ')[0].substring(0, 5);

    const { error } = await db.from('feedbacks').insert([{
        id: 'FB-' + Date.now(),
        name, email, message,
        date: dateStr,
        status: 'In Review'
    }]);
    if (error) { alert('Ralat menghantar maklum balas: ' + error.message); return; }

    document.getElementById('modal-feedback')?.classList.add('hidden');
    document.getElementById('form-feedback').reset();
    document.getElementById('modal-feedback-success')?.classList.remove('hidden');

    await loadAllData();
    renderFeedbackTable();
}

export function renderFeedbackTable() {
    const tbody = document.getElementById('feedback-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    bayuData.feedbacks.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-bg/50 transition-colors';
        tr.innerHTML = `
            <td class="p-3.5 text-gray-500">${item.date}</td>
            <td class="p-3.5 font-bold text-brand-dark">${item.name}</td>
            <td class="p-3.5 text-brand-muted">${item.email}</td>
            <td class="p-3.5 text-brand-text max-w-xs truncate">${item.message}</td>
            <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${item.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${item.status}</span></td>
            <td class="p-3.5 text-right space-x-1">
                <button onclick="openFeedbackPreview('${item.id}')" class="text-brand hover:underline text-[11px] font-bold mr-2">Lihat Penuh</button>
                <button onclick="toggleFeedbackStatus('${item.id}')" class="text-brand hover:underline text-[11px] font-bold">Tukar Status</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

export function openFeedbackPreview(id) {
    const fb = bayuData.feedbacks.find(f => f.id === id);
    if (!fb) return;
    const container = document.getElementById('feedback-preview-body');
    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div class="bg-brand-bg p-3 rounded-lg"><span class="font-bold text-brand-dark block mb-0.5">Tarikh</span><span class="text-brand-muted">${fb.date}</span></div>
            <div class="bg-brand-bg p-3 rounded-lg"><span class="font-bold text-brand-dark block mb-0.5">Status</span><span class="px-2 py-0.5 rounded text-[10px] font-bold ${fb.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${fb.status}</span></div>
        </div>
        <div class="bg-brand-bg p-3 rounded-lg"><span class="font-bold text-brand-dark block mb-0.5">Nama</span><span class="text-brand-text">${fb.name}</span></div>
        <div class="bg-brand-bg p-3 rounded-lg"><span class="font-bold text-brand-dark block mb-0.5">Emel</span><span class="text-brand-text">${fb.email}</span></div>
        <div class="bg-brand-bg p-3 rounded-lg"><span class="font-bold text-brand-dark block mb-1">Maklum Balas Penuh</span><div class="feedback-preview-text text-brand-text text-xs leading-relaxed">${fb.message}</div></div>`;
    document.getElementById('modal-feedback-preview').classList.remove('hidden');
}

export async function toggleFeedbackStatus(id) {
    const fb = bayuData.feedbacks.find(f => f.id === id);
    if (!fb) return;
    const newStatus = (fb.status === 'Resolved') ? 'In Review' : 'Resolved';
    const { error } = await db.from('feedbacks').update({ status: newStatus }).eq('id', id);
    if (error) { alert('Ralat: ' + error.message); return; }
    await loadAllData();
    renderFeedbackTable();
}
