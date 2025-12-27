import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../lib/api';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showNew, setShowNew] = useState(false);

    const [form, setForm] = useState({
        name: '',
        company: '',
        member_user_id: '',
    });

    const [addMember, setAddMember] = useState({ team_id: '', user_id: '' });

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const [teamsRes, techRes] = await Promise.all([
                api.get('/api/teams'),
                api.get('/api/users', { params: { role: 'technician' } }),
            ]);
            setTeams(teamsRes.data || []);
            setTechnicians(techRes.data || []);
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to load teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onCreate = async (e) => {
        e.preventDefault();
        setError('');

        const name = String(form.name || '').trim();
        const company = String(form.company || '').trim();
        const memberId = form.member_user_id ? Number(form.member_user_id) : 0;
        if (!name) return setError('Team name is required');
        if (!memberId) return setError('Team member is required');

        try {
            await api.post('/api/teams', { name, company: company || null, member_user_id: memberId });
            setShowNew(false);
            setForm({ name: '', company: '', member_user_id: '' });
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to create team');
        }
    };

    const onAddMember = async (e) => {
        e.preventDefault();
        setError('');
        const teamId = addMember.team_id ? Number(addMember.team_id) : 0;
        const userId = addMember.user_id ? Number(addMember.user_id) : 0;
        if (!teamId) return setError('Select a team');
        if (!userId) return setError('Select a technician');

        try {
            await api.post(`/api/teams/${teamId}/members`, { user_id: userId });
            setAddMember({ team_id: '', user_id: '' });
            await load();
        } catch (err) {
            setError(err?.response?.data?.error || 'Failed to add member');
        }
    };

    const rows = useMemo(() => teams, [teams]);

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black italic font-sketch">Teams</h2>
                    <p className="text-xs font-bold uppercase tracking-widest opacity-50">Team name and 1 member</p>
                </div>

                <button
                    type="button"
                    className="sketch-button bg-maint-green font-black"
                    onClick={() => setShowNew((v) => !v)}
                >
                    <Plus size={18} /> NEW
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs">
                    {error}
                </div>
            )}

            {showNew && (
                <div className="sketch-card bg-white">
                    <h3 className="font-black uppercase tracking-wider mb-4">New Team</h3>
                    <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onCreate}>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Team Name</label>
                            <input
                                className="w-full border-2 border-gray-900 p-2 font-bold outline-none"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Company</label>
                            <input
                                className="w-full border-2 border-gray-900 p-2 font-bold outline-none"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Team Member</label>
                            <select
                                className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white"
                                value={form.member_user_id}
                                onChange={(e) => setForm({ ...form, member_user_id: e.target.value })}
                            >
                                <option value="">Select technician…</option>
                                {technicians.map((t) => (
                                    <option key={t.id} value={t.id}>{t.full_name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 flex items-center justify-end gap-3">
                            <button type="button" className="sketch-button font-black" onClick={() => setShowNew(false)}>
                                CANCEL
                            </button>
                            <button type="submit" className="sketch-button bg-maint-green font-black">
                                SAVE
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="sketch-card bg-white">
                <h3 className="font-black uppercase tracking-wider mb-4">Add Member</h3>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={onAddMember}>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Team</label>
                        <select
                            className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white"
                            value={addMember.team_id}
                            onChange={(e) => setAddMember({ ...addMember, team_id: e.target.value })}
                        >
                            <option value="">Select team…</option>
                            {rows.map((t) => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest opacity-60">Technician</label>
                        <select
                            className="w-full border-2 border-gray-900 p-2 font-bold outline-none bg-white"
                            value={addMember.user_id}
                            onChange={(e) => setAddMember({ ...addMember, user_id: e.target.value })}
                        >
                            <option value="">Select technician…</option>
                            {technicians.map((t) => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-end justify-end">
                        <button type="submit" className="sketch-button bg-maint-green font-black w-full md:w-auto">
                            ADD
                        </button>
                    </div>
                </form>
            </div>

            <div className="sketch-card bg-white overflow-x-auto">
                <table className="w-full text-left min-w-[720px]">
                    <thead>
                        <tr className="border-b-2 border-gray-900">
                            <th className="pb-4 px-2 font-black uppercase text-xs">Team Name</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Company</th>
                            <th className="pb-4 px-2 font-black uppercase text-xs">Technicians</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={3} className="py-8 text-center font-bold opacity-50">Loading…</td></tr>
                        ) : rows.length === 0 ? (
                            <tr><td colSpan={3} className="py-8 text-center font-bold opacity-50">No teams yet.</td></tr>
                        ) : (
                            rows.map((t) => (
                                <tr key={t.id} className="border-b border-gray-200 last:border-b-0">
                                    <td className="py-4 px-2 font-black">{t.name}</td>
                                    <td className="py-4 px-2 font-bold">{t.company || '—'}</td>
                                    <td className="py-4 px-2 font-bold">
                                        {(t.members || []).length === 0 ? '—' : (t.members || []).map((m) => m.full_name).join(', ')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Teams;
