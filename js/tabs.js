// ============================================================
// BayuOne — Tab switching + mobile menu + global search
// ============================================================
// Phase 7C: Removed openPrivacyPage and the 'privacy' tab case
// because the privacy page is now a standalone HTML file at
// /dasar-privasi.html
// ============================================================

export function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) targetView.classList.remove('hidden');
    const targetNav = document.getElementById(`nav-${tabName}`);
    if (targetNav) targetNav.classList.add('active');

    const heroTitle = document.getElementById('hero-title');
    const heroSubtitle = document.getElementById('hero-subtitle');

    if (tabName === 'agenda') {
        heroTitle.textContent = 'Program & Aktiviti Terkini';
        heroSubtitle.textContent = 'Terokai pelbagai program, acara dan aktiviti menarik yang berlangsung di sekitar anda.';
        window.renderAgenda?.();
        window.renderBanner?.();
    } else if (tabName === 'trainer') {
        heroTitle.textContent = 'Trainer & Jurulatih Profesional';
        heroSubtitle.textContent = 'Cari penceramah, jurulatih dan pakar bidang untuk menjayakan program latihan anda.';
        window.renderTrainer?.();
    } else if (tabName === 'talent') {
        heroTitle.textContent = 'Bakat & Influencer Tempatan';
        heroSubtitle.textContent = 'Hubungi pengacara, content creator dan pelbagai bakat tempatan untuk kolaborasi.';
        window.renderTalent?.();
    } else if (tabName === 'admin') {
        window.renderAdminTable?.();
        window.renderFeedbackTable?.();
        window.renderSubscriberTable?.();
        window.renderBannerTable?.();
        window.renderPartnerTable?.();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function toggleMobileMenu() {
    document.getElementById('mobile-menu')?.classList.toggle('hidden');
}

export function handleGlobalSearch() {
    window.resetCurrentAgendaPage?.();
    window.renderAgenda?.();
    window.renderTrainer?.();
    window.renderTalent?.();
}

export function triggerSearch() {
    handleGlobalSearch();
}
