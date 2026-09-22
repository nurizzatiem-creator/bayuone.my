// ============================================================
// BayuOne — Trainer rendering + filtering
// ============================================================
// Amendment 4: all imports bumped to ?v=6b5.
// ============================================================

import { bayuData } from './data-loader.js?v=6b5';
import {
    sortByPromotion,
    getTrainerCertDisplayList
} from './helpers.js?v=6b5';
import { renderTrainerCard } from './components/trainer-card.js?v=6b5';

function getTrainerFiltered() {
    const name = (document.getElementById('filter-trainer-name')?.value || '').toLowerCase().trim();
    const exp = (document.getElementById('filter-trainer-expertise')?.value || '').trim();
    const loc = (document.getElementById('filter-trainer-location')?.value || '').trim();
    const cert = (document.getElementById('filter-trainer-cert')?.value || '').trim();
    const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    return bayuData.applications.filter(item => {
        if (item.type !== 'Trainer') return false;
        if (item.approval !== 'Approved') return false;
        if (name && !(item.name || '').toLowerCase().includes(name)) return false;
        if (exp && !(item.expertise || []).includes(exp)) return false;
        if (loc && (item.location || '') !== loc) return false;
        if (cert) {
            const rawCerts = item.certs || [];
            const custom = (item.certCustom || '').trim();
            if (cert === 'Lain-Lain') {
                if (!(rawCerts.includes('Lain-Lain') && custom !== '')) return false;
            } else {
                if (!rawCerts.includes(cert)) return false;
            }
        }
        if (q) {
            const certList = getTrainerCertDisplayList(item);
            const hay = ((item.name || '') + ' ' + (item.title || '') + ' ' +
                (item.location || '') + ' ' + (item.summary || '') + ' ' +
                (item.expertise || []).join(' ') + ' ' + certList.join(' ')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

export function renderTrainer() {
    const container = document.getElementById('grid-trainer');
    if (!container) return;
    container.innerHTML = '';
    const sorted = sortByPromotion(getTrainerFiltered());
    sorted.forEach(item => {
        container.innerHTML += renderTrainerCard(item);
    });
}

export function filterTrainer() {
    renderTrainer();
}

export function resetTrainerFilters() {
    document.getElementById('filter-trainer-name').value = '';
    document.getElementById('filter-trainer-expertise').value = '';
    document.getElementById('filter-trainer-location').value = '';
    document.getElementById('filter-trainer-cert').value = '';
    const gs = document.getElementById('global-search');
    if (gs) gs.value = '';
    renderTrainer();
}
