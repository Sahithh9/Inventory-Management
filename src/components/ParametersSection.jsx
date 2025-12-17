import React, { useState } from 'react';
import { Upload, Download, FileDown } from 'lucide-react';
import { downloadTemplateCSV } from '../utils/csvUtils';
import { validateModelParams, validateOrderingParams, clampNumber, sanitizeUplifts } from '../utils/validation';

/**
 * ParametersSection: Model selection, parameter tuning, and file operations
 * Responsibilities: Handle forecasting config, file import/export, parameter validation
 */
function ParametersSection({
    modelType,
    setModelType,
    alpha,
    setAlpha,
    beta,
    setBeta,
    poOrderCycle,
    setPoOrderCycle,
    monthsToHold,
    setMonthsToHold,
    uplifts,
    setUplifts,
    revenueProjections, // New Prop
    onFileUpload,
    onExport,
    onSave,
    isSaving,
    onConnectShopify, // New Prop
    errors = []
}) {
    const [validationErrors, setValidationErrors] = useState([]);


    const handleAlphaChange = (value) => {
        const clamped = clampNumber(value, 0, 1);
        setAlpha(clamped);
    };

    const handleBetaChange = (value) => {
        const clamped = clampNumber(value, 0, 1);
        setBeta(clamped);
    };

    const handlePOCycleChange = (value) => {
        const num = Math.max(0.1, Number(value) || 0);
        setPoOrderCycle(num);
    };

    const handleMonthsChange = (value) => {
        const num = Math.max(0.1, Number(value) || 0);
        setMonthsToHold(num);
    };

    const handleUpliftChange = (month, value) => {
        const num = Number(value);
        setUplifts(prev => ({
            ...prev,
            [month]: isNaN(num) ? 0 : Math.max(-100, Math.min(1000, num))
        }));
    };

    return (
        <div className="section">
            <h2>🛠️ Planning Parameters</h2>

            {/* Error Display */}
            {(validationErrors.length > 0 || errors.length > 0) && (
                <div style={{
                    marginBottom: 20,
                    padding: 15,
                    background: '#fee2e2',
                    border: '1px solid #fca5a5',
                    borderRadius: 8,
                    color: '#991b1b'
                }}>
                    <strong>⚠️ Issues detected:</strong>
                    <ul style={{ marginTop: 10, paddingLeft: 20 }}>
                        {[...validationErrors, ...errors].map((err, idx) => (
                            <li key={idx}>{err}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Model Selection & Parameters */}
            <div style={{
                marginBottom: 20,
                padding: 15,
                background: '#eef2ff',
                borderRadius: 8,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong>Forecasting Model:</strong>
                    <select
                        value={modelType}
                        onChange={e => setModelType(e.target.value)}
                        style={{
                            padding: 8,
                            borderRadius: 4,
                            border: '1px solid #c7d2fe',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="AUTO">✨ Auto-Detect (Best Fit)</option>
                        <option value="HOLT">Holt's Linear Trend</option>
                        <option value="SMA">Simple Moving Avg (3M)</option>
                        <option value="WMA">Weighted Moving Avg (3M)</option>
                        <option value="REGRESSION">Linear Regression</option>
                    </select>
                </label>

                {modelType === 'HOLT' && (
                    <>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>α (Alpha):</strong>
                            <input
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={alpha}
                                onChange={e => handleAlphaChange(e.target.value)}
                                title="Level smoothing: 0=ignore current, 1=only current"
                                style={{ width: 60, padding: 6, borderRadius: 4, border: '1px solid #c7d2fe' }}
                            />
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong>β (Beta):</strong>
                            <input
                                type="number"
                                step="0.05"
                                min="0"
                                max="1"
                                value={beta}
                                onChange={e => handleBetaChange(e.target.value)}
                                title="Trend smoothing: 0=ignore trend, 1=only trend"
                                style={{ width: 60, padding: 6, borderRadius: 4, border: '1px solid #c7d2fe' }}
                            />
                        </label>
                    </>
                )}
            </div>

            {/* Ordering Parameters */}
            <div style={{
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: 20
            }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong title="Number of P.O. cycles to consider for stock pipeline">PO Order Cycle:</strong>
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={poOrderCycle}
                        onChange={e => handlePOCycleChange(e.target.value)}
                        style={{ width: 80, padding: 6, borderRadius: 4, border: '1px solid #d1d5db' }}
                    />
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong title="Safety buffer in months">Months to Hold:</strong>
                    <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={monthsToHold}
                        onChange={e => handleMonthsChange(e.target.value)}
                        style={{ width: 80, padding: 6, borderRadius: 4, border: '1px solid #d1d5db' }}
                    />
                </label>

                {/* File Operations */}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                        onClick={onConnectShopify}
                        style={{
                            background: '#95BF47',
                            color: 'white',
                            padding: '10px 15px',
                            borderRadius: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                        }}
                    >
                        Store Connect
                    </button>

                    <a
                        href="/inventory_template.csv"
                        download="inventory_template.csv"

                        style={{
                            textDecoration: 'none',
                            background: '#6b7280',
                            fontSize: '0.9em',
                            display: 'flex',
                            gap: 8,
                            padding: '10px 15px',
                            borderRadius: 8,
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            alignItems: 'center',
                            fontWeight: 500,
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#4b5563'}
                        onMouseLeave={(e) => e.target.style.background = '#6b7280'}
                        title="Download CSV template with sample data"
                    >
                        <FileDown size={14} /> Template
                    </a>

                    <label
                        style={{
                            cursor: 'pointer',
                            background: '#667eea',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontWeight: 500,
                            transition: 'background 0.2s',
                            border: 'none'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#5568d3'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#667eea'}
                    >
                        <Upload size={16} /> Import CSV
                        <input
                            type="file"
                            accept=".csv"
                            onChange={onFileUpload}
                            style={{ display: 'none' }}
                        />
                    </label>

                    <button
                        onClick={onExport}
                        style={{
                            background: '#10b981',
                            color: 'white',
                            padding: '10px 20px',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 500,
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#059669'}
                        onMouseLeave={(e) => e.target.style.background = '#10b981'}
                        title="Export current inventory plan to CSV"
                    >
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Uplift Drivers */}
            <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', marginBottom: 10, fontWeight: 'bold', fontSize: '0.9em' }}>
                    📈 Demand Uplifts (% adjustment per month)
                </label>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 10 }}>
                    {Object.keys(uplifts).map((m, i) => (
                        <div
                            key={m}
                            style={{
                                background: '#e0e7ff',
                                padding: 12,
                                borderRadius: 8,
                                minWidth: 120,
                                border: '1px solid #c7d2fe'
                            }}
                        >
                            <div style={{
                                fontSize: 12,
                                fontWeight: 'bold',
                                color: '#4338ca',
                                marginBottom: 6,
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <span>Month {i + 1}</span>
                            </div>

                            <input
                                type="number"
                                value={uplifts[m]}
                                onChange={(e) => handleUpliftChange(m, e.target.value)}
                                title={`Enter uplift percentage for month ${i + 1}`}
                                style={{
                                    width: '100%',
                                    borderColor: '#c7d2fe',
                                    padding: 6,
                                    borderRadius: 4,
                                    border: '1px solid #c7d2fe',
                                    boxSizing: 'border-box',
                                    fontWeight: 'bold'
                                }}
                            />

                            {/* Revenue Indicator */}
                            <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#059669' }}>
                                <div style={{ fontWeight: '600' }}>Proj. Rev:</div>
                                <div>
                                    ${revenueProjections?.[m]?.toLocaleString(undefined, {
                                        minimumFractionDigits: 0,
                                        maximumFractionDigits: 0
                                    }) || 0}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default ParametersSection;