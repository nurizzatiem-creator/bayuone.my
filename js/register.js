// ============================================================
// BayuOne — Registration form submission
// ============================================================
// Handles the "Sertai BayuOne" modal submit for all three
// application types: Penganjur (Agenda), Trainer and Talent.
// Phase 6B: slug is auto-generated for every new record.
// ============================================================

import { db, TIKTOK_BAYUONE_URL } from './supabase-client.js';
import { rowFromApp } from './converters.js';
import { getTodayStr, countWords, slugify } from './utils.js';
import { bayuData, loadAllData } from './data-loader.js';

// ------------------------------------------------------------
// Location helpers
// ------------------------------------------------------------

export const MALAYSIAN_STATES = [
    'Johor', 'Kedah', 'Kelantan', 'Melaka', 'Negeri Sembilan', 'Pahang', 'Perak', 'Perlis',
    'Pulau Pinang', 'Sabah', 'Sarawak', 'Selangor', 'Terengganu', 'Wilayah Persekutuan Kuala Lumpur',
    'Wilayah Persekutuan Labuan', 'Wilayah Persekutuan Putrajaya', 'Atas Talian/Webinar'
];

export const SABAH_DIVISIONS = {
    'Bahagian Pantai Barat': ['Kota Kinabalu', 'Penampang', 'Putatan', 'Papar', 'Tuaran', 'Kota Belud', 'Ranau'],
    'Bahagian Pedalaman': ['Keningau', 'Beaufort', 'Sipitang', 'Tambunan', 'Nabawan', 'Tenom', 'Kuala Penyu', 'Sook', 'Membakut'],
    'Bahagian Kudat': ['Kudat', 'Kota Marudu', 'Pitas'],
    'Bahagian Sandakan': ['Sandakan', 'Kinabatangan', 'Beluran', 'Telupid', 'Tongod'],
    'Bahagian Tawau': ['Tawau', 'Lahad Datu', 'Semporna', 'Kunak', 'Kalabakan']
};

export function initLocationDropdowns() {
    ['penganjur', 'trainer', 'talent'].forEach(prefix => {
        const stateSelect = document.getElementById(`reg-${prefix}-state`);
        if (!stateSelect) return;
        stateSelect.innerHTML = `<option value="">Sila Pilih Negeri / Wilayah</option>`;
        MALAYSIAN_STATES.forEach(st => {
            stateSelect.innerHTML += `<option value="${st}">${st}</option>`;
        });
    });
}

export function handleStateChange(prefix) {
    const stateSelect = document.getElementById(`reg-${prefix}-state`);
    const sabahWrapper = document.getElementById(`reg-${prefix}-sabah-wrapper`);
    const sabahSelect = document.getElementById(`reg-${prefix}-sabah-loc`);
    if (!stateSelect || !sabahWrapper || !sabahSelect) return;

    const currentRegType = document.getElementById('reg-type').value;

    if (stateSelect.value === 'Sabah') {
        sabahWrapper.classList.remove('hidden');
        if (currentRegType === prefix) sabahSelect.required = true;
        sabahSelect.innerHTML = `<option value="">Sila Pilih Daerah Sabah</option>`;
        for (const [division, districts] of Object.entries(SABAH_DIVISIONS)) {
            let groupOpt = `<optgroup label="${division}">`;
            districts.forEach(dist => {
                groupOpt += `<option value="${dist}, Sabah">${dist}</option>`;
            });
            groupOpt += `</optgroup>`;
            sabahSelect.innerHTML += groupOpt;
        }
    } else {
        sabahWrapper.classList.add('hidden');
        sabahSelect.required = false;
        sabahSelect.value = '';
    }
}

// ------------------------------------------------------------
// Field requirements per application type
// ------------------------------------------------------------

export function setRegisterType(type) {
    const regTypeInput = document.getElementById('reg-type');
    if (regTypeInput) regTypeInput.value = type;

    ['penganjur', 'trainer', 'talent'].forEach(t => {
        const btn = document.getElementById(`btn-reg-${t}`);
        const fieldGroup = document.getElementById(`fields-${t}`);
        if (!btn || !fieldGroup) return;
        if (t === type) {
            btn.className = 'py-2 text-xs font-bold rounded-lg transition-all bg-white text-brand shadow-xs';
            fieldGroup.classList.remove('hidden');
        } else {
            btn.className = 'py-2 text-xs font-bold rounded-lg transition-all text-brand-muted hover:text-brand';
            fieldGroup.classList.add('hidden');
        }
    });

    const allIds = [
        'reg-penganjur-title', 'reg-penganjur-org', 'reg-penganjur-date', 'reg-penganjur-date-end', 'reg-penganjur-state',
        'reg-penganjur-sabah-loc', 'reg-penganjur-category', 'reg-penganjur-privacy', 'reg-penganjur-mode',
        'reg-trainer-name', 'reg-trainer-email', 'reg-trainer-phone', 'reg-trainer-state',
        'reg-trainer-sabah-loc', 'reg-trainer-summary', 'reg-trainer-privacy',
        'reg-talent-name', 'reg-talent-email', 'reg-talent-phone', 'reg-talent-state',
        'reg-talent-sabah-loc', 'reg-talent-niche', 'reg-talent-summary', 'reg-talent-privacy'
    ];
    allIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.required = false;
    });

    const pState = document.getElementById('reg-penganjur-state');
    const trState = document.getElementById('reg-trainer-state');
    const tlState = document.getElementById('reg-talent-state');

    if (type === 'penganjur') {
        const pTitle = document.getElementById('reg-penganjur-title');
        const pOrg = document.getElementById('reg-penganjur-org');
        const pDate = document.getElementById('reg-penganjur-date');
        const pSabah = document.getElementById('reg-penganjur-sabah-loc');
        const pCat = document.getElementById('reg-penganjur-category');
        const pPrivacy = document.getElementById('reg-penganjur-privacy');
        const pMode = document.getElementById('reg-penganjur-mode');
        if (pTitle) pTitle.required = true;
        if (pOrg) pOrg.required = true;
        if (pDate) pDate.required = true;
        if (pState) pState.required = true;
        if (pSabah && pState && pState.value === 'Sabah') pSabah.required = true;
        if (pCat) pCat.required = true;
        if (pPrivacy) pPrivacy.required = true;
        if (pMode) pMode.required = true;
    } else if (type === 'trainer') {
        const trName = document.getElementById('reg-trainer-name');
        const trEmail = document.getElementById('reg-trainer-email');
        const trPhone = document.getElementById('reg-trainer-phone');
        const trSabah = document.getElementById('reg-trainer-sabah-loc');
        const trSum = document.getElementById('reg-trainer-summary');
        const trPrivacy = document.getElementById('reg-trainer-privacy');
        if (trName) trName.required = true;
        if (trEmail) trEmail.required = true;
        if (trPhone) trPhone.required = true;
        if (trState) trState.required = true;
        if (trSabah && trState && trState.value === 'Sabah') trSabah.required = true;
        if (trSum) trSum.required = true;
        if (trPrivacy) trPrivacy.required = true;
    } else if (type === 'talent') {
        const tlName = document.getElementById('reg-talent-name');
        const tlEmail = document.getElementById('reg-talent-email');
        const tlPhone = document.getElementById('reg-talent-phone');
        const tlSabah = document.getElementById('reg-talent-sabah-loc');
        const tlNiche = document.getElementById('reg-talent-niche');
        const tlSum = document.getElementById('reg-talent-summary');
        const tlPrivacy = document.getElementById('reg-talent-privacy');
        if (tlName) tlName.required = true;
        if (tlEmail) tlEmail.required = true;
        if (tlPhone) tlPhone.required = true;
        if (tlState) tlState.required = true;
        if (tlSabah && tlState && tlState.value === 'Sabah') tlSabah.required = true;
        if (tlNiche) tlNiche.required = true;
        if (tlSum) tlSum.required = true;
        if (tlPrivacy) tlPrivacy.required = true;
    }
}

// ------------------------------------------------------------
// Small form helpers
// ------------------------------------------------------------

export function togglePenganjurOneDay() {
    const cb = document.getElementById('reg-penganjur-oneday');
    const wrapper = document.getElementById('reg-penganjur-enddate-wrapper');
    const endInput = document.getElementById('reg-penganjur-date-end');
    const startInput = document.getElementById('reg-penganjur-date');
    if (!cb || !wrapper || !endInput) return;
    if (cb.checked) {
        wrapper.classList.add('hidden');
        endInput.required = false;
        endInput.value = startInput?.value || '';
    } else {
        wrapper.classList.remove('hidden');
        endInput.required = true;
    }
}

export function syncPenganjurEndDate() {
    const cb = document.getElementById('reg-penganjur-oneday');
    const startInput = document.getElementById('reg-penganjur-date');
    const endInput = document.getElementById('reg-penganjur-date-end');
    if (cb?.checked && endInput) endInput.value = startInput?.value || '';
}

export function togglePenganjurFee() {
    const feeType = document.getElementById('reg-penganjur-fee-type')?.value;
    const amountWrapper = document.getElementById('reg-penganjur-fee-amount-wrapper');
    if (!amountWrapper) return;
    if (feeType === 'Berbayar') {
        amountWrapper.classList.remove('hidden');
    } else {
        amountWrapper.classList.add('hidden');
        const min = document.getElementById('reg-penganjur-fee-min');
        const max = document.getElementById('reg-penganjur-fee-max');
        if (min) min.value = '';
        if (max) max.value = '';
    }
}

export function toggleTrainerCertCustom() {
    const cb = document.getElementById('trainer_cert_lain');
    const wrapper = document.getElementById('reg-trainer-cert-custom-wrapper');
    const input = document.getElementById('reg-trainer-cert-custom');
    if (!cb || !wrapper || !input) return;
    if (cb.checked) {
        wrapper.classList.remove('hidden');
        input.required = true;
        updateTrainerCertCustomCounter();
    } else {
        wrapper.classList.add('hidden');
        input.required = false;
        input.value = '';
        updateTrainerCertCustomCounter();
    }
}

export function updateTrainerCertCustomCounter() {
    const input = document.getElementById('reg-trainer-cert-custom');
    const counter = document.getElementById('reg-trainer-cert-custom-counter');
    if (!input || !counter) return;
    counter.textContent = `${input.value.length} / 150 aksara`;
}

// ------------------------------------------------------------
// Submit handler
// ------------------------------------------------------------

export async function handleRegisterSubmit(event) {
    if (event) event.preventDefault();

    const regType = document.getElementById('reg-type').value;

    // Clear hidden required Sabah selects
    ['penganjur', 'trainer', 'talent'].forEach(prefix => {
        const sabahSel = document.getElementById(`reg-${prefix}-sabah-loc`);
        const sabahWrapper = document.getElementById(`reg-${prefix}-sabah-wrapper`);
        if (sabahSel && sabahWrapper && sabahWrapper.classList.contains('hidden')) {
            sabahSel.required = false;
        }
    });

    if (!['penganjur', 'trainer', 'talent'].includes(regType)) {
        alert('Ralat: Jenis permohonan tidak dikenali.');
        return;
    }

    const val = (id) => {
        const el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
    };

    // Word limit checks
    if (regType === 'trainer') {
        const summary = val('reg-trainer-summary');
        if (countWords(summary) > 120) {
            alert('Ringkasan Profil Trainer tidak boleh melebihi 120 patah perkataan.');
            return;
        }
    }
    if (regType === 'talent') {
        const summary = val('reg-talent-summary');
        if (countWords(summary) > 120) {
            alert('Ringkasan Profil Talent tidak boleh melebihi 120 patah perkataan.');
            return;
        }
    }

    const newId = 'APP-' + Date.now();
    let newApp = null;

    if (regType === 'penganjur') {
        const title = val('reg-penganjur-title');
        const org = val('reg-penganjur-org');
        const email = val('reg-penganjur-email');
        const date = val('reg-penganjur-date');
        const dateEnd = val('reg-penganjur-date-end');
        const oneDay = document.getElementById('reg-penganjur-oneday')?.checked || false;
        const state = val('reg-penganjur-state');
        const sabahLoc = val('reg-penganjur-sabah-loc');
        const category = val('reg-penganjur-category');
        const picName = val('reg-penganjur-pic-name');
        const picTel = val('reg-penganjur-pic-tel');
        const mode = val('reg-penganjur-mode') || 'Fizikal';
        const url = val('reg-penganjur-url');
        const feeType = val('reg-penganjur-fee-type') || 'Percuma';
        const feeMin = val('reg-penganjur-fee-min');
        const feeMax = val('reg-penganjur-fee-max');

        if (!org) { alert('Sila masukkan nama Penganjur.'); return; }
        if (!mode) { alert('Sila pilih Mod.'); return; }

        let hargaMin = null, hargaMax = null, hargaYuran = 'Percuma';
        if (feeType === 'Berbayar') {
            if (!feeMin) { alert('Sila masukkan Harga Minimum.'); return; }
            hargaMin = parseFloat(feeMin);
            if (feeMax) {
                hargaMax = parseFloat(feeMax);
                if (hargaMax < hargaMin) {
                    alert('Harga Maksimum tidak boleh lebih rendah daripada Harga Minimum.');
                    return;
                }
            }
            if (hargaMax && hargaMax > hargaMin) hargaYuran = `RM${hargaMin} - RM${hargaMax}`;
            else hargaYuran = `RM${hargaMin}`;
        }

        const location = (state === 'Sabah' && sabahLoc) ? sabahLoc : state;

        newApp = {
            id: newId, type: 'Agenda', slug: slugify(title),
            title, name: picName || org, org,
            penganjur: org,
            email, phone: picTel,
            location, mode, category,
            date, dateEnd: oneDay ? date : dateEnd, isOneDay: oneDay,
            url: url || TIKTOK_BAYUONE_URL, urlButton: '',
            approval: 'Pending', validity: '', tarikhDari: '', tarikhSehingga: '',
            label: '', remark: '', statusPenangguhan: '', statusPenangguhanSub: '',
            photo: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
            hargaYuran, feeType,
            hargaMin, hargaMax,
            expertise: [], certs: [], certCustom: '', niche: '', summary: ''
        };
    } else if (regType === 'trainer') {
        const name = val('reg-trainer-name');
        const email = val('reg-trainer-email');
        const phone = val('reg-trainer-phone');
        const state = val('reg-trainer-state');
        const sabahLoc = val('reg-trainer-sabah-loc');
        const summary = val('reg-trainer-summary');
        const url = val('reg-trainer-url');
        const location = (state === 'Sabah' && sabahLoc) ? sabahLoc : state;

        if (!phone) { alert('Sila masukkan No. Telefon.'); return; }

        const expBoxes = document.querySelectorAll('input[name="trainer_exp"]:checked');
        const expertise = Array.from(expBoxes).map(cb => cb.value);
        const certBoxes = document.querySelectorAll('input[name="trainer_cert"]:checked');
        const certs = Array.from(certBoxes).map(cb => cb.value);
        const certCustom = val('reg-trainer-cert-custom');

        newApp = {
            id: newId, type: 'Trainer', slug: slugify(name),
            title: 'Trainer Profesional',
            name, org: '', email, phone,
            location, mode: '', category: '',
            date: getTodayStr(), dateEnd: null, isOneDay: false,
            url: url || TIKTOK_BAYUONE_URL, urlButton: '',
            approval: 'Pending', validity: '', tarikhDari: '', tarikhSehingga: '',
            label: '', remark: '', statusPenangguhan: '', statusPenangguhanSub: '',
            photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
            hargaYuran: '', feeType: '', hargaMin: null, hargaMax: null,
            expertise: expertise.length > 0 ? expertise : ['Pengurusan & Kepimpinan'],
            certs, certCustom, niche: '', summary
        };
    } else if (regType === 'talent') {
        const name = val('reg-talent-name');
        const email = val('reg-talent-email');
        const phone = val('reg-talent-phone');
        const state = val('reg-talent-state');
        const sabahLoc = val('reg-talent-sabah-loc');
        const niche = val('reg-talent-niche');
        const summary = val('reg-talent-summary');
        const url = val('reg-talent-url');
        const location = (state === 'Sabah' && sabahLoc) ? sabahLoc : state;

        if (!phone) { alert('Sila masukkan No. Telefon.'); return; }

        newApp = {
            id: newId, type: 'Talent', slug: slugify(name),
            title: 'Talent Tempatan',
            name, org: '', email, phone,
            location, mode: '', category: '',
            date: getTodayStr(), dateEnd: null, isOneDay: false,
            url: url || TIKTOK_BAYUONE_URL, urlButton: '',
            approval: 'Pending', validity: '', tarikhDari: '', tarikhSehingga: '',
            label: '', remark: '', statusPenangguhan: '', statusPenangguhanSub: '',
            photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            hargaYuran: '', feeType: '', hargaMin: null, hargaMax: null,
            expertise: [], certs: [], certCustom: '', niche, summary
        };
    }

    if (!newApp) return;

    const { error } = await db.from('applications').insert([rowFromApp(newApp)]);
    if (error) {
        console.error('Insert failed:', error);
        alert('Ralat semasa menghantar permohonan: ' + error.message);
        return;
    }

    document.getElementById('form-register').reset();
    setRegisterType('penganjur');
    document.getElementById('reg-penganjur-fee-amount-wrapper')?.classList.add('hidden');
    document.getElementById('reg-trainer-cert-custom-wrapper')?.classList.add('hidden');
    updateTrainerCertCustomCounter();
    document.getElementById('reg-penganjur-enddate-wrapper')?.classList.remove('hidden');

    document.getElementById('modal-register')?.classList.add('hidden');
    document.getElementById('modal-submission-success')?.classList.remove('hidden');

    await loadAllData();
}
