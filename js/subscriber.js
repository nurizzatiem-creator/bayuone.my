// ============================================================
// BayuOne — Subscribers (public subscribe form + admin table)
// ============================================================

import { db } from './supabase-client.js?v=6b';
import { bayuData, loadAllData } from './data-loader.js?v=6b';
import { getTodayStr } from './utils.js?v=6b';

export async function handleSubscribeSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('sub-name').value.trim();
    const email = document.getElementById('sub-email').value.trim();
    const checkedBoxes = document.querySelectorAll('input[name="sub_interest"]:checked');
    const errorEl = document.getElementById('sub-error');

    if (checkedBoxes.length === 0) {
        errorEl.classList.remove('hidden');
        return;
    }
    errorEl.classList.add('hidden');

    const minatList = Array.from(checkedBoxes).map(cb => cb.value).join(', ');

    const { error } = await db.from('subscribers').insert([{
        id: 'SUB-' + Date.now(),
        name, email,
        minat: minatList,
        date: getTodayStr(),
        status: 'NEW'
    }]);
    if (error) { alert('Ralat: ' + error.message); return; }

    document.getElementById('subscribe-form').reset();
    document.getElementById('sub-success-message').classList.remove('hidden');
    setTimeout(() => document.getElementById('sub-success-message').classList.add('hidden'), 5000);

    await loadAllData();
    renderSubscriberTable();
}

export function renderSubscriberTable() {
    const tbody = document.getElementById('subscriber-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    let total = 0, newSub = 0, existingSub = 0;
    bayuData.subscribers.forEach(sub => {
        total++;
        if (sub.status === 'NEW') newSub++; else existingSub++;
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-brand-bg/50 transition-colors';
        tr.innerHTML = `
            <td class="p-3.5 font-bold text-brand-dark">${sub.name}</td>
            <td class="p-3.5 text-brand-muted">${sub.email}</td>
            <td class="p-3.5 text-xs text-gray-600">${sub.minat}</td>
            <td class="p-3.5 text-right space-x-1">
                <button onclick="openEditSubscriberModal('${sub.id}')" class="text-brand hover:underline text-[11px] font-bold">Edit</button>
            </td>`;
        tbody.appendChild(tr);
    });
    document.getElementById('stat-sub-total').textContent = total;
    document.getElementById('stat-sub-new').textContent = newSub;
    document.getElementById('stat-sub-existing').textContent = existingSub;
}

export function openEditSubscriberModal(id) {
    const sub = bayuData.subscribers.find(s => s.id === id);
    if (!sub) return;
    document.getElementById('edit-sub-id').value = sub.id;
    document.getElementById('edit-sub-name').value = sub.name;
    document.getElementById('edit-sub-email').value = sub.email;
    document.getElementById('edit-sub-minat').value = sub.minat;
    document.getElementById('modal-edit-subscriber').classList.remove('hidden');
}

export async function handleSaveSubscriber(e) {
    e.preventDefault();
    const id = document.getElementById('edit-sub-id').value;
    const payload = {
        name: document.getElementById('edit-sub-name').value.trim(),
        email: document.getElementById('edit-sub-email').value.trim(),
        minat: document.getElementById('edit-sub-minat').value.trim()
    };
    const { error } = await db.from('subscribers').update(payload).eq('id', id);
    if (error) { alert('Ralat: ' + error.message); return; }
    document.getElementById('modal-edit-subscriber').classList.add('hidden');
    await loadAllData();
    renderSubscriberTable();
}
