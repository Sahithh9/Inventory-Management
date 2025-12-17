import React from 'react';
import { Box, AlertTriangle, Activity, TrendingUp } from 'lucide-react';

/**
 * MetricsPanel: Displays KPI cards
 * Responsibilities: Show key metrics at a glance
 */
/**
 * MetricsPanel: Displays KPI cards
 * Responsibilities: Show key metrics at a glance
 */
function MetricsPanel({ totalProducts, lowStockCount, totalOrderQty, totalValue, totalRevenue, onRiskClick, onRevenueClick, onInventoryClick, showRiskList }) {
    return (
        <div className="dashboard-grid">
            <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Box size={20} />
                    <h3>Total Products</h3>
                </div>
                <div className="value">{totalProducts}</div>
            </div>

            <div className="stat-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <AlertTriangle size={20} />
                    <h3>Suggested Order Vol</h3>
                </div>
                <div className="value">{totalOrderQty.toLocaleString()}</div>
            </div>

            {/* Clickable Revenue Card */}
            <div
                className="stat-card"
                onClick={onRevenueClick}
                style={{
                    cursor: 'pointer',
                    border: '1px solid #10b981',
                    backgroundColor: '#ecfdf5',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={20} color="#059669" />
                    <h3>Projected Revenue (6M)</h3>
                </div>
                <div className="value" style={{ color: '#059669' }}>
                    ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <div style={{ fontSize: '0.7em', marginTop: 5, color: '#059669', fontWeight: 'bold' }}>
                    Click for ABC Analysis
                </div>
            </div>

            <div
                className="stat-card"
                onClick={onRiskClick}
                style={{
                    cursor: 'pointer',
                    border: showRiskList ? '2px solid #dc2626' : '1px solid #e5e7eb',
                    backgroundColor: showRiskList ? '#fef2f2' : 'white',
                    transition: 'all 0.2s'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Activity size={20} color={lowStockCount > 0 ? '#dc2626' : undefined} />
                    <h3>Stock Health</h3>
                </div>
                <div className="value" style={{
                    color: lowStockCount > 0 ? '#dc2626' : '#16a34a'
                }}>
                    {lowStockCount > 0 ? `${lowStockCount} Alerts` : 'Healthy'}
                </div>
                <div style={{ fontSize: '0.7em', marginTop: 5, color: '#6b7280', fontWeight: 'normal' }}>
                    {showRiskList ? 'Click to Hide Details' : 'Click to View Risks'}
                </div>
            </div>

            <div
                className="stat-card"
                onClick={onInventoryClick}
                style={{
                    cursor: 'pointer',
                    border: '1px solid #6366f1',
                    backgroundColor: '#eef2ff',
                    transition: 'transform 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <TrendingUp size={20} color="#4f46e5" />
                    <h3>Total Inventory Value</h3>
                </div>
                <div className="value" style={{ color: '#4338ca' }}>
                    ${totalValue.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.7em', marginTop: 5, color: '#4338ca', fontWeight: 'bold' }}>
                    Click for Value Breakdown
                </div>
            </div>
        </div>
    );
}

export default MetricsPanel;