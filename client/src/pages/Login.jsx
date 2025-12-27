import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || '').trim());

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const redirectTo = useMemo(() => location.state?.from || '/dashboard', [location.state]);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const cleanEmail = String(email || '').trim();
        if (!isValidEmail(cleanEmail)) return setError('Please enter a valid email address.');
        if (!String(password || '')) return setError('Password is required.');

        try {
            setSubmitting(true);
            await login({ email: cleanEmail, password });
            navigate(redirectTo, { replace: true });
        } catch (err) {
            setError(err?.response?.data?.error || 'Login failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex h-screen font-outfit">
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-maint-blue border-r-4 border-gray-900 p-12">
                <div className="max-w-md space-y-6">
                    <div className="sketch-card bg-white -rotate-1">
                        <h1 className="text-6xl font-black italic tracking-tighter mb-4 leading-none">Welcome back.</h1>
                        <p className="text-xl font-bold uppercase tracking-wide border-t-4 border-gray-900 pt-4">Track equipment and requests in one place</p>
                    </div>
                    <div className="sketch-card bg-maint-green rotate-1 text-right">
                        <p className="font-bold text-lg uppercase">Clean. Transparent. Fast.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 bg-white p-8">
                <div className="w-full max-w-sm space-y-8">
                    <div className="sketch-card bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                        <h2 className="text-2xl font-black uppercase tracking-tighter underline underline-offset-8 decoration-4 mb-8">User Login</h2>

                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {error && (
                                <div className="p-3 bg-red-100 border-2 border-red-900 text-red-900 font-bold text-xs flex items-center gap-2">
                                    <ShieldCheck size={16} /> {error}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email Address</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <Mail size={18} />
                                    <input
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        type="email"
                                        placeholder="you@company.com"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        autoComplete="email"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Password</label>
                                <div className="flex items-center gap-3 border-2 border-gray-900 p-2">
                                    <KeyRound size={18} />
                                    <input
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        type="password"
                                        placeholder="••••••••"
                                        className="flex-1 outline-none font-bold placeholder:opacity-30 text-sm"
                                        autoComplete="current-password"
                                    />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Use the password you registered with</p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sketch-button bg-maint-green justify-center py-3 mt-4 font-black disabled:opacity-60"
                            >
                                SIGN IN <LogIn size={20} className="ml-2" />
                            </button>
                        </form>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <p className="font-bold text-gray-500 uppercase text-[10px] tracking-widest text-center italic">
                            New here? Create a portal account
                        </p>
                        <Link to="/signup" className="font-black text-sm underline decoration-2 underline-offset-4 hover:text-maint-blue transition-colors">
                            CREATE NEW ACCOUNT
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
