// ============================================================
// BayuOne — Tab switching + mobile menu + global search
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
    } else if (tabName === 'privacy') {
        heroTitle.textContent = 'Dasar Privasi & Polisi';
        heroSubtitle.textContent = 'Sila baca dan fahami polisi penggunaan platform BayuOne.';
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

export function openPrivacyPage(e) {
    if (e) e.preventDefault();
    switchTab('privacy');
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
