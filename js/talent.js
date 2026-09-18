// ============================================================
// BayuOne — Talent rendering + filtering
// ============================================================
// Amendment 4: all imports bumped to ?v=6b3.
// ============================================================

import { bayuData } from './data-loader.js?v=6b3';
import { sortByPromotion } from './helpers.js?v=6b3';
import { renderTalentCard } from './components/talent-card.js?v=6b3';

function getTalentFiltered() {
    const name = (document.getElementById('filter-talent-name')?.value || '').toLowerCase().trim();
    const niche = (document.getElementById('filter-talent-niche')?.value || '').trim();
    const loc = (document.getElementById('filter-talent-location')?.value || '').trim();
    const q = (document.getElementById('global-search')?.value || '').toLowerCase().trim();

    return bayuData.applications.filter(item => {
        if (item.type !== 'Talent') return false;
        if (item.approval !== 'Approved') return false;
        if (name && !(item.name || '').toLowerCase().includes(name)) return false;
        if (niche && (item.niche || '') !== niche) return false;
        if (loc && (item.location || '') !== loc) return false;
        if (q) {
            const hay = ((item.name || '') + ' ' + (item.title || '') + ' ' + (item.niche || '') + ' ' +
                (item.location || '') + ' ' + (item.summary || '')).toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });
}

export function renderTalent() {
    const container = document.getElementById('grid-talent');
    if (!container) return;
    container.innerHTML = '';
    const sorted = sortByPromotion(getTalentFiltered());
    sorted.forEach(item => {
        container.innerHTML += renderTalentCard(item);
    });
}

export function filterTalent() {
    renderTalent();
}

export function resetTalentFilters() {
    document.getElementById('filter-talent-name').value = '';
    document.getElementById('filter-talent-niche').value = '';
    document.getElementById('filter-talent-location').value = '';
    const gs = document.getElementById('global-search');
    if (gs) gs.value = '';
    renderTalent();
}
