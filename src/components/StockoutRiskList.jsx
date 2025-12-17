import React from 'react';
import { Download } from 'lucide-react';
import Papa from 'papaparse';

/**
 * StockoutRiskList: Alerts for items at risk of stockout
 * Responsibilities: Display list of high-risk items with order projections
 */
function StockoutRiskList({ processedData, monthsToHold = 3 }) {
    const riskItems = processedData
        .filter(p => p.stockoutRisk || p.lostUnits.some(u => u > 0))
        .map(item => {
            // Find first month where stock drops below zero
            const stock = item.projectedStock || [];
            const stockoutIndex = stock.findIndex(s => s <= 0);

            // Logic: Order 'monthsToHold' months before stockout.
            // StockoutIndex (0 = M1, 1 = M2, etc.) corresponds to the month number (1-indexed).
            // Example: Stockout in M4 (index 3). monthsToHold = 3. Order in M1 (4-3).

            let orderMonth = 'Immediate';

            if (stockoutIndex !== -1) {
                // Determine the actual stockout month (1-indexed)
                const stockoutMonthNum = stockoutIndex + 1;

                // Calculate when to order
                // Floor the result to ensure we order early enough (e.g., 5 - 2.5 = 2.5 -> Order Month 2)
                const orderMonthNum = Math.floor(stockoutMonthNum - monthsToHold);

                if (orderMonthNum <= 1) {
                    orderMonth = 'Immediate (M1)';
                } else {
                    orderMonth = `Month ${orderMonthNum}`;
                }
            } else if (item.stockoutRisk) {
                // If flagged as risk but no specific stockout month found (e.g. consistently low but not negative?), assume immediate
                orderMonth = 'Immediate';
            } else {
                orderMonth = 'N/A';
            }

            // Estimate Cost of Order
            const cost = item.cost || 0;
            const orderCost = (item.orderQty || 0) * cost;

            return { ...item, orderMonth, orderCost };
        })
        .sort((a, b) => b.revenueLost - a.revenueLost); // Still prioritize by impact (Revenue Lost)

    const handleExport = () => {
        const csvData = riskItems.map(item => ({
            SKU: item.sku,
            'Product Name': item.name,
            'Projected Order Qty': item.orderQty,
            'Schedule': item.orderMonth,
            'Est. Order Cost': item.orderCost // UPDATED
        }));

        const csvString = Papa.unparse(csvData);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'stock_risk_export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (riskItems.length === 0) return null;

    return (
        <div style={{
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            borderRadius: 8,
            padding: 15,
            marginBottom: 20
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ margin: 0, color: '#991b1b', fontSize: '1.1em', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ⚠️ Stockout Risks & Replenishment
                    <span style={{ fontSize: '0.8em', fontWeight: 'normal', color: '#b91c1c' }}>
                        ({riskItems.length} items requiring attention)
                    </span>
                </h3>
                <button
                    onClick={handleExport}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 12px',
                        backgroundColor: '#fecdd3',
                        border: '1px solid #fda4af',
                        borderRadius: 6,
                        color: '#991b1b',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '0.9em'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fda4af'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fecdd3'}
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            <div style={{ maxHeight: 250, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#fff1f2' }}>
                        <tr style={{ textAlign: 'left', color: '#991b1b' }}>
                            <th style={{ padding: 5 }}>SKU</th>
                            <th style={{ padding: 5 }}>Name</th>
                            <th style={{ padding: 5, textAlign: 'right' }}>Proj. Order Qty</th>
                            <th style={{ padding: 5, textAlign: 'right' }}>Schedule</th>
                            <th style={{ padding: 5, textAlign: 'right' }}>Est. Order Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {riskItems.map(item => (
                            <tr key={item.sku} style={{ borderBottom: '1px solid #fecdd3' }}>
                                <td style={{ padding: 5 }}><strong>{item.sku}</strong></td>
                                <td style={{ padding: 5 }}>{item.name}</td>
                                <td style={{ padding: 5, textAlign: 'right', fontWeight: 'bold' }}>
                                    {item.orderQty.toLocaleString()}
                                </td>
                                <td style={{ padding: 5, textAlign: 'right', color: '#b45309', fontWeight: '500' }}>
                                    {item.orderMonth}
                                </td>
                                <td style={{ padding: 5, textAlign: 'right', color: '#2563eb', fontWeight: 'bold' }}>
                                    {item.orderCost > 0 ? `$${item.orderCost.toLocaleString()}` : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default StockoutRiskList;
