
import React, { useState } from 'react';
import { fetchShopifyData } from '../services/shopifyService';
import { X, ShoppingBag, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function ShopifyConnect({ isOpen, onClose, onSyncComplete }) {
    const [domain, setDomain] = useState('');
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSync = async () => {
        setLoading(true);
        setError(null);
        try {
            // Basic validation
            if (!domain || !token) throw new Error("Please provide both Domain and Token.");

            const products = await fetchShopifyData(domain, token);

            if (products && products.length > 0) {
                onSyncComplete(products);
                onClose(); // Close on success
            } else {
                throw new Error("No products found or sync failed.");
            }
        } catch (err) {
            console.error(err);
            // Hints for CORS
            if (err.message.includes('Failed to fetch')) {
                setError("Network Error: This is likely a CORS issue. For this Demo, please install a 'Allow CORS' browser extension or use a local proxy.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '24px', borderRadius: '12px',
                width: '450px', maxWidth: '90%', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <ShoppingBag color="#95BF47" />
                        Connect Shopify
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{
                        backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px',
                        marginBottom: '16px', fontSize: '0.9rem', display: 'flex', gap: '8px'
                    }}>
                        <AlertCircle size={18} />
                        <div>{error}</div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Store URL</label>
                        <input
                            type="text"
                            placeholder="my-store.myshopify.com"
                            value={domain}
                            onChange={(e) => setDomain(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '6px' }}>Admin Access Token</label>
                        <input
                            type="password"
                            placeholder="shpat_xxxxxxxxxxxxxxxx"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                        />
                        <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
                            Found in Shopify Admin > Settings > Apps > Develop Apps
                        </p>
                    </div>

                    <button
                        onClick={handleSync}
                        disabled={loading}
                        style={{
                            backgroundColor: '#95BF47', color: 'white', fontWeight: 'bold',
                            padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'wait' : 'pointer',
                            marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : 'Sync Products & Inventory'}
                    </button>
                </div>
            </div>
        </div>
    );
}
