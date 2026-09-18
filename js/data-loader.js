// ============================================================
// BayuOne — Data loader
// ============================================================
// Loads all rows from Supabase into one shared in-memory cache.
// Amendment 4: all imports bumped to ?v=6b3.
// ============================================================

import { db } from './supabase-client.js?v=6b3';
import { appFromRow } from './converters.js?v=6b3';

export const bayuData = {
    applications: [],
    subscribers: [],
    feedbacks: [],
    banners: [],
    partnerships: []
};

export async function loadAllData() {
    try {
        const [appsRes, subsRes, fbRes, banRes, partRes] = await Promise.all([
            db.from('applications').select('*').order('created_at', { ascending: false }),
            db.from('subscribers').select('*').order('created_at', { ascending: false }),
            db.from('feedbacks').select('*').order('created_at', { ascending: false }),
            db.from('banners').select('*').order('created_at', { ascending: false }),
            db.from('partnerships').select('*').order('position', { ascending: true })
        ]);

        if (appsRes.error) console.warn('applications load:', appsRes.error.message);
        if (subsRes.error) console.warn('subscribers load:', subsRes.error.message);
        if (fbRes.error) console.warn('feedbacks load:', fbRes.error.message);
        if (banRes.error) console.warn('banners load:', banRes.error.message);
        if (partRes.error) console.warn('partnerships load:', partRes.error.message);

        bayuData.applications = (appsRes.data || []).map(appFromRow);

        bayuData.subscribers = (subsRes.data || []).map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            minat: r.minat,
            date: r.date,
            status: r.status
        }));

        bayuData.feedbacks = (fbRes.data || []).map(r => ({
            id: r.id,
            name: r.name,
            email: r.email,
            message: r.message,
            date: r.date,
            status: r.status
        }));

        bayuData.banners = (banRes.data || []).map(r => ({
            id: r.id,
            photo: r.photo,
            name: r.name,
            company: r.company,
            validity: r.validity,
            startDate: r.start_date,
            endDate: r.end_date
        }));

        bayuData.partnerships = (partRes.data || []).map(r => ({
            id: r.id,
            name: r.name,
            image: r.image,
            position: r.position
        }));
    } catch (err) {
        console.error('Load failed:', err);
    }
}
