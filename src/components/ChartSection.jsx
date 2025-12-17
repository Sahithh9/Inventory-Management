import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';

// Register ChartJS modules
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

/**
 * ChartSection: Demand forecasting and inventory projection visualization
 * Responsibilities: Render chart with history, forecast, and projected inventory
 */
function ChartSection({ processedData, selectedSku, setSelectedSku }) {
    const [searchTerm, setSearchTerm] = React.useState('');

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return processedData;
        const lower = searchTerm.toLowerCase();
        return processedData.filter(p =>
            p.sku.toLowerCase().includes(lower) ||
            p.name.toLowerCase().includes(lower)
        );
    }, [processedData, searchTerm]);

    const chartConfig = useMemo(() => {
        if (!processedData || processedData.length === 0) return null;

        // Auto-select first product if none selected or not in processedData
        // (handle case where selectedSku might be filtered out? No, should still show chart if valid)
        let product = processedData.find(p => p.sku === selectedSku);

        // If not found (e.g. init), default to first available
        if (!product) product = processedData[0];
        if (!product) return null;

        // Get last historical value for connecting history to forecast
        const lastHistVal = product.cleanHistory[product.cleanHistory.length - 1];

        const histLabels = product.history.map((_, i) => `Hist ${i + 1}`);
        const fcstLabels = Array(6).fill(0).map((_, i) => `Fcst ${i + 1}`);
        const labels = [...histLabels, ...fcstLabels];

        // Build datasets
        const histData = [...product.history, ...Array(6).fill(null)];

        const fcstData = [
            ...Array(product.history.length - 1).fill(null),
            lastHistVal,
            ...product.forecasts
        ];

        const projData = [
            ...Array(product.history.length).fill(null),
            ...product.projectedStock
        ];

        const targetData = Array(labels.length).fill(product.targetStock);

        return {
            product,
            data: {
                labels,
                datasets: [
                    {
                        label: 'History Sales',
                        data: histData,
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.05)',
                        tension: 0.2,
                        pointRadius: 4,
                        pointBackgroundColor: '#667eea'
                    },
                    {
                        label: 'Forecast Demand',
                        data: fcstData,
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.05)',
                        borderDash: [5, 5],
                        tension: 0.2,
                        pointRadius: 4,
                        pointBackgroundColor: '#f59e0b'
                    },
                    {
                        label: 'Target Stock',
                        data: targetData,
                        borderColor: '#10b981',
                        borderWidth: 2,
                        pointRadius: 0,
                        borderDash: [3, 3]
                    },
                    {
                        label: 'Proj. Inventory',
                        data: projData,
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        tension: 0.2,
                        pointRadius: 4,
                        pointBackgroundColor: '#8b5cf6'
                    }
                ]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                plugins: {
                    legend: {
                        onClick: (e) => e.stopPropagation(),
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 12 }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Units',
                            font: { weight: 'bold' }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Timeline',
                            font: { weight: 'bold' }
                        }
                    }
                }
            }
        };
    }, [processedData, selectedSku]);

    if (!chartConfig) {
        return (
            <div className="section">
                <h2>📈 Demand & Inventory Plan</h2>
                <p style={{ color: '#999', textAlign: 'center', padding: '40px' }}>
                    No data available. Please import products.
                </p>
            </div>
        );
    }

    const { product } = chartConfig;
    const totalRev6M = product.forecasts.reduce((sum, val) => sum + (val * product.price), 0);

    return (
        <div className="section">
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                flexWrap: 'wrap',
                gap: 15
            }}
            >
                <div>
                    <h2>📈 Demand & Inventory Plan</h2>
                    {/* Selected Product Revenue Summary */}
                    <div style={{
                        marginTop: 4,
                        fontSize: '0.9em',
                        color: '#4b5563',
                        display: 'flex',
                        gap: 15
                    }}>
                        <span>
                            <strong>Forecast Revenue (6M):</strong>{' '}
                            <span style={{ color: '#059669', fontWeight: 'bold' }}>
                                ${totalRev6M.toLocaleString()}
                            </span>
                        </span>
                        <span>
                            <strong>ABC Rank:</strong>{' '}
                            <span style={{
                                padding: '2px 6px',
                                borderRadius: 4,
                                backgroundColor: product.abcRank === 'A' ? '#dcfce7' : product.abcRank === 'B' ? '#fef9c3' : '#fee2e2',
                                color: product.abcRank === 'A' ? '#166534' : product.abcRank === 'B' ? '#854d0e' : '#991b1b',
                                fontWeight: 'bold'
                            }}>
                                {product.abcRank}
                            </span>
                        </span>
                        {product.bestModel && (
                            <span>
                                <strong>Model:</strong> {product.bestModel}
                                {product.accuracy > 0 && ` (Err: ${product.accuracy}%)`}
                            </span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flex: 1, justifyContent: 'flex-end', minWidth: 250 }}>
                    <input
                        type="text"
                        placeholder="🔍 Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            width: '120px'
                        }}
                    />
                    <select
                        value={selectedSku || ''}
                        onChange={e => setSelectedSku(e.target.value)}
                        style={{
                            flex: 1,
                            maxWidth: 300,
                            padding: '8px 12px',
                            borderRadius: 6,
                            border: '1px solid #d1d5db',
                            fontSize: '0.95em',
                            cursor: 'pointer'
                        }}
                    >
                        {filteredProducts.map(p => (
                            <option key={p.sku} value={p.sku}>
                                {p.name} ({p.sku})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div style={{
                height: 400,
                background: 'white',
                padding: 20,
                borderRadius: 10,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
            >
                <Line data={chartConfig.data} options={chartConfig.options} />
            </div>
        </div>
    );
}

export default ChartSection;