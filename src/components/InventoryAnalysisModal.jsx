import React, { useState, useMemo } from 'react';
import { X, TrendingUp, Package, Truck } from 'lucide-react';

function InventoryAnalysisModal({ isOpen, onClose, data = [] }) {
    if (!isOpen) return null;

    const [activeTab, setActiveTab] = useState('A'); // A, B, C

    // Process data for the modal
    const analysis = useMemo(() => {
        // Filter by rank
        const filtered = data.filter(d => d.abcRank === activeTab);

        // Sort by Stock Value descending (Retail Value to match KPI)
        const sorted = [...filtered].sort((a, b) => {
            const valA = (a.stock || 0) * (a.price || 0);
            const valB = (b.stock || 0) * (b.price || 0);
            return valB - valA;
        });

        // Aggregates
        let totalStockValue = 0; // Retail Value
        let totalStockCost = 0;  // Cost Value
        let totalInTransitCost = 0; // Inbound * Cost
        let weightedSellThrough = 0;

        // Monthly COG Breakdown
        const monthlyCOG = [0, 0, 0, 0, 0, 0];

        sorted.forEach(item => {
            const stock = item.stock || 0;
            const price = item.price || 0;
            const cost = item.cost || (price * 0.6); // Default 60% if missing

            // Stock Values
            totalStockValue += stock * price;
            totalStockCost += stock * cost;

            // In-Transit (Sum of all inbounds)
            const totalInboundUnits = (item.inbounds || []).reduce((a, b) => a + b, 0);
            totalInTransitCost += totalInboundUnits * cost;

            // Weighted Sell Through (simplified avg for now, or weighted by stock?)
            // Let's do simple average of the calculated item sell-throughs
            weightedSellThrough += (item.sellThroughRate || 0);

            // Monthly COG
            if (item.soldUnits && Array.isArray(item.soldUnits)) {
                item.soldUnits.forEach((units, idx) => {
                    if (idx < 6) {
                        monthlyCOG[idx] += units * cost;
                    }
                });
            }
        });

        const avgSellThrough = sorted.length > 0 ? (weightedSellThrough / sorted.length) : 0;

        return {
            items: sorted,
            totalStockValue,
            totalStockCost,
            totalInTransitCost,
            avgSellThrough,
            monthlyCOG
        };
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
                width: '95%',
                maxWidth: '900px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
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
                            Inventory Value Analysis
                        </h2>
                        <p style={{ margin: '5px 0 0 0', color: '#6b7280', fontSize: '0.9em' }}>
                            Stock valuation, in-transit costs, and sell-through efficiency
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ padding: '20px 20px 0 20px', display: 'flex', gap: '10px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    {['A', 'B', 'C'].map(rank => (
                        <button
                            key={rank}
                            onClick={() => setActiveTab(rank)}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '8px 8px 0 0',
                                border: 'none',
                                background: activeTab === rank ? 'white' : 'transparent',
                                color: activeTab === rank ? '#4f46e5' : '#6b7280',
                                fontWeight: 'bold',
                                borderBottom: activeTab === rank ? '2px solid #4f46e5' : '2px solid transparent',
                                cursor: 'pointer',
                                marginBottom: '-1px'
                            }}
                        >
                            Rank {rank} Products
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>

                    {/* KPI Cards Row */}
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {/* Stock Value */}
                        <div style={{ flex: 1, minWidth: '200px', background: '#f0f9ff', padding: '15px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#0369a1' }}>
                                <Package size={18} />
                                <span style={{ fontWeight: '600', fontSize: '0.9em' }}>On-Hand Value (Retail)</span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#0c4a6e' }}>
                                ${analysis.totalStockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div style={{ fontSize: '0.8em', color: '#64748b' }}>
                                Cost Basis: ${analysis.totalStockCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>

                        {/* In-Transit Value */}
                        <div style={{ flex: 1, minWidth: '200px', background: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #fed7aa' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#c2410c' }}>
                                <Truck size={18} />
                                <span style={{ fontWeight: '600', fontSize: '0.9em' }}>In-Transit Value (Cost)</span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#7c2d12' }}>
                                ${analysis.totalInTransitCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                        </div>

                        {/* Sell Through */}
                        <div style={{ flex: 1, minWidth: '200px', background: '#f5f3ff', padding: '15px', borderRadius: '8px', border: '1px solid #ddd6fe' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#6d28d9' }}>
                                <TrendingUp size={18} />
                                <span style={{ fontWeight: '600', fontSize: '0.9em' }}>Avg Sell-Through</span>
                            </div>
                            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#4c1d95' }}>
                                {analysis.avgSellThrough.toFixed(1)}%
                            </div>
                        </div>
                    </div>

                    {/* Monthly COG Breakdown */}
                    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95em', color: '#374151' }}>Projected Cost of Goods Sold (COGS) - Next 6 Months</h4>
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                            {analysis.monthlyCOG.map((val, idx) => (
                                <div key={idx} style={{ flex: 1, textAlign: 'center', background: '#f9fafb', padding: '10px', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '0.8em', color: '#6b7280', marginBottom: '4px' }}>Month {idx + 1}</div>
                                    <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                                        ${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                            <thead style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <tr>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>SKU</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#6b7280' }}>Product</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>Stock (Units)</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>Value (Retail)</th>
                                    <th style={{ padding: '12px', textAlign: 'right', color: '#6b7280' }}>Sell-Through</th>
                                </tr>
                            </thead>
                            <tbody>
                                {analysis.items.map((item) => (
                                    <tr key={item.sku} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '12px', fontWeight: '500' }}>{item.sku}</td>
                                        <td style={{ padding: '12px', color: '#4b5563' }}>{item.name}</td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>{(item.stock || 0).toLocaleString()}</td>
                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#0369a1' }}>
                                            ${((item.stock || 0) * (item.price || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right', color: '#6d28d9', fontWeight: '500' }}>
                                            {(item.sellThroughRate || 0).toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default InventoryAnalysisModal;
