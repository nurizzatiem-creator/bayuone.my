// ============================================================
// BayuOne — Banner + Partner (public rendering)
// ============================================================
// Amendment 4: all imports bumped to ?v=6b3.
// ============================================================

import { bayuData } from './data-loader.js?v=6b3';
import { getTodayStr } from './utils.js?v=6b3';
import { getBannerStatus } from './helpers.js?v=6b3';

export function getActiveBanner() {
    const todayStr = getTodayStr();
    return bayuData.banners.find(b => todayStr >= b.startDate && todayStr < b.endDate);
}

export function renderBanner() {
    const container = document.getElementById('banner-ad-container');
    if (!container) return;
    const active = getActiveBanner();
    if (!active || !active.photo) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }
    container.style.display = 'flex';
    container.innerHTML = `<img src="${active.photo}" alt="${active.name}" onerror="this.style.display='none'">`;
}

export function renderBrandsSupport() {
    const section = document.getElementById('brands-support-section');
    const grid = document.getElementById('brands-support-grid');
    if (!section || !grid) return;

    const valid = bayuData.partnerships
        .filter(p => p && p.image && p.image.trim() !== '')
        .sort((a, b) => a.position - b.position);

    if (valid.length === 0) {
        section.classList.add('hidden');
        grid.innerHTML = '';
        return;
    }

    section.classList.remove('hidden');
    grid.innerHTML = '';
    valid.forEach(p => {
        const tile = document.createElement('div');
        tile.className = 'flex flex-col items-center';
        tile.innerHTML = `
            <div class="brand-logo-tile w-full">
                <img src="${p.image}" alt="${p.name || 'Partner'}" onerror="this.closest('.brand-logo-tile').style.display='none'">
            </div>
            ${p.name ? `<p class="mt-2 text-[11px] sm:text-xs font-semibold text-brand-dark text-center truncate w-full">${p.name}</p>` : ''}
        `;
        grid.appendChild(tile);
    });
}

export { getBannerStatus };
