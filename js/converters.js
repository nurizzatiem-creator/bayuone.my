// ============================================================
// BayuOne — Database row ↔ application object converters
// ============================================================
// The Supabase tables use snake_case column names.
// The rest of the app uses camelCase field names.
// These two functions convert cleanly between them.
//
//  appFromRow(row) : converts a Supabase row → app object
//  rowFromApp(app) : converts an app object → Supabase row
// ============================================================

export function appFromRow(r) {
    return {
        id: r.id,
        slug: r.slug,
        type: r.type,
        description: r.description,
        title: r.title,
        name: r.name,
        org: r.org,
        email: r.email,
        phone: r.phone,
        location: r.location,
        mode: r.mode,
        category: r.category,
        date: r.date,
        url: r.url,
        urlButton: r.url_button,
        approval: r.approval,
        validity: r.validity,
        tarikhDari: r.tarikh_dari,
        tarikhSehingga: r.tarikh_sehingga,
        label: r.label,
        remark: r.remark,
        statusPenangguhan: r.status_penangguhan,
        statusPenangguhanSub: r.status_penangguhan_sub,
        photo: r.photo,
        hargaYuran: r.harga_yuran,
        feeType: r.fee_type,
        expertise: r.expertise || [],
        certs: r.certs || [],
        certCustom: r.cert_custom,
        niche: r.niche,
        summary: r.summary,
        dateEnd: r.date_end,
        isOneDay: r.is_one_day || false,
        hargaMin: r.harga_min,
        hargaMax: r.harga_max,
        penganjur: r.penganjur
    };
}

export function rowFromApp(a) {
    return {
        id: a.id,
        slug: a.slug,
        type: a.type,
        description: a.description,
        title: a.title,
        name: a.name,
        org: a.org,
        email: a.email,
        phone: a.phone,
        location: a.location,
        mode: a.mode,
        category: a.category,
        date: a.date,
        url: a.url,
        url_button: a.urlButton,
        approval: a.approval,
        validity: a.validity,
        tarikh_dari: a.tarikhDari,
        tarikh_sehingga: a.tarikhSehingga,
        label: a.label,
        remark: a.remark,
        status_penangguhan: a.statusPenangguhan,
        status_penangguhan_sub: a.statusPenangguhanSub,
        photo: a.photo,
        harga_yuran: a.hargaYuran,
        fee_type: a.feeType,
        expertise: a.expertise || [],
        certs: a.certs || [],
        cert_custom: a.certCustom,
        niche: a.niche,
        summary: a.summary,
        date_end: a.dateEnd,
        is_one_day: a.isOneDay || false,
        harga_min: a.hargaMin,
        harga_max: a.hargaMax,
        penganjur: a.penganjur
    };
}
