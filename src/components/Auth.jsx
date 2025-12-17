import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';

export default function Auth() {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState(''); // Added password state
    const [isSignUp, setIsSignUp] = useState(false); // Toggle between Login and Signup
    const [message, setMessage] = useState('');

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            let result;
            if (isSignUp) {
                result = await supabase.auth.signUp({
                    email,
                    password,
                });
            } else {
                result = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
            }

            const { error, data } = result;

            if (error) {
                throw error;
            }

            if (isSignUp && data.user && !data.session) {
                setMessage('Check your email for the login link!');
            }

        } catch (error) {
            setMessage(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f3f4f6'
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                width: '100%',
                maxWidth: '400px'
            }}>
                <h1 style={{ textAlign: 'center', color: '#1f2937', marginBottom: '1.5rem' }}>
                    {isSignUp ? 'Create an Account' : 'Welcome Back'}
                </h1>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            placeholder="Your email address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.25rem' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            backgroundColor: '#4f46e5',
                            color: 'white',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isSignUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </form>

                {message && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {message}
                    </div>
                )}

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#6b7280' }}>
                    {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#4f46e5',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginLeft: '0.25rem'
                        }}
                    >
                        {isSignUp ? 'Sign In' : 'Sign Up'}
                    </button>
                </div>
            </div>
        </div>
    );
}
