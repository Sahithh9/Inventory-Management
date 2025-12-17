import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';

function RevenueAnalysisModal({ isOpen, onClose, data = [], totalRevenue = 0 }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('A'); // A, B, C

    // Process data for the modal
    const analysis = useMemo(() => {
        // Filter by rank
        const filtered = data.filter(d => d.abcRank === activeTab);

        // Sort by revenue descending
        const sorted = [...filtered].sort((a, b) => (b.revenueSold || 0) - (a.revenueSold || 0));

        // Calculate tab total
        const tabTotal = sorted.reduce((sum, item) => sum + (item.revenueSold || 0), 0);

        return { items: sorted, total: tabTotal };
    }, [data, activeTab]);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                            Revenue Drill-down Analysis
                        </h2>
                        <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9em' }}>
                            Detailed breakdown of revenue contribution by product ranking
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '20px 20px 0 20px', display: 'flex', gap: '10px' }}>
                    {['A', 'B', 'C'].map(rank => (
                        <button
                            key={rank}
                            onClick={() => setActiveTab(rank)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px 8px 0 0',
                                border: 'none',
                                background: activeTab === rank ? 'white' : '#f3f4f6',
                                color: activeTab === rank ? '#4f46e5' : '#6b7280',
                                fontWeight: 'bold',
                                borderBottom: activeTab === rank ? '2px solid #4f46e5' : '2px solid transparent',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            Rank {rank} Products
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1, backgroundColor: '#f9fafb' }}>

                    {/* Summary Card */}
                    <div style={{
                        marginBottom: '20px',
                        padding: '15px',
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <span style={{ color: '#6b7280', fontSize: '0.9em' }}>Category Count</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>
                                {analysis.items.length} SKUs
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9em' }}>Category Revenue</span>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
                                ${analysis.total.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85em', color: '#6b7280' }}>
                                {totalRevenue > 0
                                    ? `${((analysis.total / totalRevenue) * 100).toFixed(1)}% of Total Revenue`
                                    : '0.0% of Total Revenue'}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        border: '1px solid #e5e7eb',
                        overflow: 'hidden'
                    }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>SKU</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280', fontWeight: '600' }}>Product Name</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Revenue ($)</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280', fontWeight: '600' }}>Contribution %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.items.map((item, idx) => (
                                    <tr key={item.sku} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px', fontWeight: '500', color: '#111827' }}>{item.sku}</td>
                                        <td style={{ padding: '12px', color: '#4b5563' }}>{item.name}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                            ${item.revenueSold.toLocaleString()}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#4b5563' }}>
                                            {totalRevenue > 0
                                                ? `${(((item.revenueSold || 0) / totalRevenue) * 100).toFixed(2)}%`
                                                : '0.00%'}
                                        </td>
                                    </tr>
                                ))}
                                {analysis.items.length === 0 && (
                                    <tr>
                                        <td colSpan="4" style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
                                            No products found in this category.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default RevenueAnalysisModal;
