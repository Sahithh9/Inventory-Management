import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule, CsvExportModule } from 'ag-grid-community';

// Register AG Grid modules
ModuleRegistry.registerModules([ClientSideRowModelModule, CsvExportModule]);

/**
 * InventoryGrid: Display detailed inventory planning data with AG Grid
 * Responsibilities: Render inventory details, handle exports, row selection
 */
function InventoryGrid({ processedData, onRowClicked, gridRef }) {

    // Calculate Totals for Pinned Bottom Row
    const pinnedBottomRowData = useMemo(() => {
        if (!processedData || processedData.length === 0) return [];

        const totals = {
            sku: 'TOTALS',
            name: `${processedData.length} Products`,
            stock: 0,
            orderQty: 0,
            targetStock: 0, // NEW
            revenueSold: 0,
            revenueLost: 0,
            projectedInboundValue: 0,
            costOfGoods: 0,
            // Initialize forecast monthly totals
            f1: 0, f2: 0, f3: 0, f4: 0, f5: 0, f6: 0,
            // Initialize revenue monthly totals
            r1: 0, r2: 0, r3: 0, r4: 0, r5: 0, r6: 0,
            // Initialize lost revenue monthly totals
            lr1: 0, lr2: 0, lr3: 0, lr4: 0, lr5: 0, lr6: 0,
            // Initialize inbound monthly totals
            i1: 0, i2: 0, i3: 0, i4: 0, i5: 0, i6: 0,
            // Initialize projected stock monthly totals
            ps1: 0, ps2: 0, ps3: 0, ps4: 0, ps5: 0, ps6: 0 // NEW
        };

        processedData.forEach(p => {
            totals.stock += (p.stock || 0);
            totals.orderQty += (p.orderQty || 0);
            totals.targetStock += (p.targetStock || 0); // NEW
            totals.revenueSold += (p.revenueSold || 0);
            totals.revenueLost += (p.revenueLost || 0);
            totals.projectedInboundValue += (p.projectedInboundValue || 0);
            totals.costOfGoods += (p.costOfGoods || 0);

            // Sum up monthly forecasts, revenue, inbounds
            const price = p.price || 0;
            const cost = p.cost || (price * 0.6);

            if (p.forecasts && Array.isArray(p.forecasts)) {
                totals.f1 += (p.forecasts[0] || 0);
                totals.f2 += (p.forecasts[1] || 0);
                totals.f3 += (p.forecasts[2] || 0);
                totals.f4 += (p.forecasts[3] || 0);
                totals.f5 += (p.forecasts[4] || 0);
                totals.f6 += (p.forecasts[5] || 0);
            }

            if (p.soldUnits && Array.isArray(p.soldUnits)) {
                totals.r1 += (p.soldUnits[0] || 0) * price;
                totals.r2 += (p.soldUnits[1] || 0) * price;
                totals.r3 += (p.soldUnits[2] || 0) * price;
                totals.r4 += (p.soldUnits[3] || 0) * price;
                totals.r5 += (p.soldUnits[4] || 0) * price;
                totals.r6 += (p.soldUnits[5] || 0) * price;
            }

            if (p.lostUnits && Array.isArray(p.lostUnits)) {
                totals.lr1 += (p.lostUnits[0] || 0) * price;
                totals.lr2 += (p.lostUnits[1] || 0) * price;
                totals.lr3 += (p.lostUnits[2] || 0) * price;
                totals.lr4 += (p.lostUnits[3] || 0) * price;
                totals.lr5 += (p.lostUnits[4] || 0) * price;
                totals.lr6 += (p.lostUnits[5] || 0) * price;
            }

            if (p.inbounds && Array.isArray(p.inbounds)) {
                totals.i1 += (p.inbounds[0] || 0) * cost;
                totals.i2 += (p.inbounds[1] || 0) * cost;
                totals.i3 += (p.inbounds[2] || 0) * cost;
                totals.i4 += (p.inbounds[3] || 0) * cost;
                totals.i5 += (p.inbounds[4] || 0) * cost;
                totals.i6 += (p.inbounds[5] || 0) * cost;
            }

            // Sum Projected Stock (NEW)
            if (p.projectedStock && Array.isArray(p.projectedStock)) {
                totals.ps1 += (p.projectedStock[0] || 0);
                totals.ps2 += (p.projectedStock[1] || 0);
                totals.ps3 += (p.projectedStock[2] || 0);
                totals.ps4 += (p.projectedStock[3] || 0);
                totals.ps5 += (p.projectedStock[4] || 0);
                totals.ps6 += (p.projectedStock[5] || 0);
            }
        });

        return [totals];
    }, [processedData]);

    const onFirstDataRendered = useCallback((params) => {
        params.api.autoSizeAllColumns();
    }, []);

    const colDefs = [
        {
            field: "sku",
            headerName: "SKU",
            width: 120,
            pinned: 'left',
            filter: true,
            sortable: true
        },
        {
            field: "name",
            headerName: "Product Name",
            width: 200,
            pinned: 'left',
            filter: true,
            sortable: true
        },
        {
            field: "abcRank",
            headerName: "ABC",
            width: 70,
            sortable: true,
            cellStyle: p => ({
                backgroundColor: p.value === 'A' ? '#dcfce7' : p.value === 'B' ? '#fef9c3' : '#fee2e2',
                color: p.value === 'A' ? '#166534' : p.value === 'B' ? '#854d0e' : '#991b1b',
                fontWeight: 'bold',
                textAlign: 'center'
            })
        },
        {
            field: "stock",
            headerName: "In Stock",
            width: 100,
            sortable: true,
            cellStyle: { fontWeight: 'bold', color: '#1e3a8a', backgroundColor: '#eff6ff' },
            valueFormatter: params => params.value?.toLocaleString() || 0
        },
        {
            field: "targetStock",
            headerName: "Target Stock",
            width: 110,
            sortable: true,
            cellStyle: { backgroundColor: '#f0f9ff', color: '#0369a1', fontWeight: 'bold' },
            valueFormatter: params => params.value?.toLocaleString() || 0
        },
        {
            field: "orderQty",
            headerName: "To Order",
            width: 100,
            sortable: true,
            cellStyle: { backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 'bold' },
            valueFormatter: params => params.value?.toLocaleString() || 0
        },
        // Forecast Demand (New)
        {
            headerName: "Forecast Demand (Units)",
            children: [1, 2, 3, 4, 5, 6].map(m => ({
                headerName: `M${m} Fcst`,
                width: 90,
                valueGetter: p => {
                    if (p.node.rowPinned) return p.data[`f${m}`];
                    return p.data.forecasts ? p.data.forecasts[m - 1] : 0;
                },
                cellStyle: { color: '#4f46e5', fontWeight: '500', backgroundColor: '#eef2ff' }
            }))
        },
        // Revenue Breakdown
        {
            headerName: "Revenue Projections ($)",
            children: [1, 2, 3, 4, 5, 6].map(m => ({
                headerName: `M${m} Rev`,
                width: 110,
                valueGetter: p => {
                    if (p.node.rowPinned) return p.data[`r${m}`];
                    const units = p.data.soldUnits ? p.data.soldUnits[m - 1] : 0;
                    return units * (p.data.price || 0);
                },
                cellRenderer: params => {
                    if (params.node.rowPinned) {
                        // Simplify pinned row to just show total sold revenue
                        return <span style={{ fontWeight: 'bold' }}>${Math.round(params.value).toLocaleString()}</span>;
                    }

                    const val = params.value || 0;
                    // Check lost revenue
                    const lostUnits = params.data.lostUnits ? params.data.lostUnits[m - 1] : 0;
                    const lostRev = lostUnits * (params.data.price || 0);

                    return (
                        <div style={{ lineHeight: '1.2' }}>
                            <div style={{ color: '#059669' }}>${Math.round(val).toLocaleString()}</div>
                            {lostRev > 0 && (
                                <div style={{ color: '#dc2626', fontSize: '0.85em' }}>
                                    Lost: ${Math.round(lostRev).toLocaleString()}
                                </div>
                            )}
                        </div>
                    );
                }
            }))
        },
        // Inbound Value Breakdown
        {
            headerName: "Inbound Value ($)",
            children: [1, 2, 3, 4, 5, 6].map(m => ({
                headerName: `M${m} Inb`,
                width: 100,
                valueGetter: p => {
                    if (p.node.rowPinned) return p.data[`i${m}`];
                    const units = p.data.inbounds ? p.data.inbounds[m - 1] : 0;
                    const cost = p.data.cost || (p.data.price * 0.6);
                    return units * cost;
                },
                valueFormatter: params => params.value ? `$${(params.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '-',
                cellStyle: { color: '#854d0e', fontStyle: 'italic' }
            }))
        },
        // Detailed Grid
        {
            headerName: "Projected Stock (Units)",
            children: [1, 2, 3, 4, 5, 6].map(m => ({
                headerName: `M${m} Stk`,
                width: 80,
                valueGetter: p => {
                    if (p.node.rowPinned) return p.data[`ps${m}`];
                    return p.data.projectedStock ? p.data.projectedStock[m - 1] : 0;
                },
                cellStyle: p => {
                    const val = p.value;
                    return {
                        backgroundColor: val <= 0 ? '#fee2e2' : 'transparent',
                        color: val <= 0 ? '#dc2626' : 'inherit',
                        fontWeight: val <= 0 ? 'bold' : 'normal',
                        textAlign: 'center'
                    };
                }
            }))
        }
    ];

    return (
        <div className="section">
            <h2>📋 Inventory Plan Details</h2>
            <div className="ag-theme-quartz" style={{
                height: 600,
                width: '100%',
                marginTop: 15
            }}
            >
                <AgGridReact
                    ref={gridRef}
                    rowData={processedData}
                    columnDefs={colDefs}
                    pinnedBottomRowData={pinnedBottomRowData}
                    pagination={true}
                    paginationPageSize={20}
                    onFirstDataRendered={onFirstDataRendered}
                    onRowClicked={(e) => onRowClicked(e.data.sku)}
                    rowSelection="single"
                    defaultColDef={{
                        resizable: true,
                        sortable: true,
                        filter: true
                    }}
                />
            </div>
        </div>
    );
}

export default InventoryGrid;