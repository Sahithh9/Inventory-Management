
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './components/Auth';
import ShopifyConnect from './components/ShopifyConnect';
import { fetchUserInventory, saveUserInventory } from './services/inventoryService';
import Papa from 'papaparse';
import _ from 'lodash';
import {
    calculateForecast,
    imputeHistory,
    calculateOrdering,
    calculateInventorySimulation,
    findBestModel,
    calculateWMAPE
} from './utils/forecasting';
import { validateCSVData } from './utils/validation';

import MetricsPanel from './components/MetricsPanel';
import ParametersSection from './components/ParametersSection';
import ChartSection from './components/ChartSection';
import InventoryGrid from './components/InventoryGrid';
import StockoutRiskList from './components/StockoutRiskList';
import ErrorBoundary from './components/ErrorBoundary';
import RevenueAnalysisModal from './components/RevenueAnalysisModal';
import InventoryAnalysisModal from './components/InventoryAnalysisModal';

function App() {
    // --- STATE: Session & Sync ---
    const [session, setSession] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- CHECK: Auth Session ---
    // Moved to bottom to avoid hook errors


    // --- STATE: Forecasting Model Config ---
    const [modelType, setModelType] = useState('HOLT');
    const [alpha, setAlpha] = useState(0.5);
    const [beta, setBeta] = useState(0.3);

    // --- STATE: Ordering Parameters ---
    const [poOrderCycle, setPoOrderCycle] = useState(1.0);
    const [monthsToHold, setMonthsToHold] = useState(2.0);
    const [uplifts, setUplifts] = useState({ m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0 });

    // --- STATE: Inventory Data (Demo Data Default) ---
    const [products, setProducts] = useState([
        {
            sku: 'SKU-001',
            name: 'Wireless Headphones',
            stock: 45,
            price: 120,
            cost: 80,
            history: [12, 15, 18, 14, 16, 20, 17, 19, 22, 18, 21, 23],
            inbounds: [0, 10, 0, 0, 0, 0],
            oos_flags: Array(12).fill(false)
        },
        {
            sku: 'SKU-002',
            name: 'Smart Watch',
            stock: 22,
            price: 250,
            cost: 150,
            history: [8, 9, 7, 10, 12, 11, 9, 13, 10, 11, 14, 12],
            inbounds: [20, 0, 0, 20, 0, 0],
            oos_flags: Array(12).fill(false)
        },
        {
            sku: 'SKU-003',
            name: 'Yoga Mat',
            stock: 78,
            price: 45,
            cost: 20,
            history: [5, 6, 8, 7, 6, 9, 11, 8, 10, 9, 12, 10],
            inbounds: [0, 0, 0, 0, 0, 0],
            oos_flags: Array(12).fill(false)
        }
    ]);

    // --- EFFECT: Load Inventory from Supabase ---
    useEffect(() => {
        if (session?.user && !isLoaded) {
            fetchUserInventory(session.user).then(data => {
                if (data && data.length > 0) {
                    console.log('Loaded from Cloud:', data);
                    setProducts(data);
                }
                setIsLoaded(true);
            });
        }
    }, [session, isLoaded]);

    // --- HANDLER: Save Inventory ---
    const handleSave = async () => {
        if (!session?.user) return;
        setIsSaving(true);
        try {
            await saveUserInventory(products, session.user);
            alert('Inventory synced to cloud!');
        } catch (err) {
            alert('Failed to save: ' + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const [selectedSku, setSelectedSku] = useState(null);
    const [showRiskList, setShowRiskList] = useState(false);
    const [showRevenueModal, setShowRevenueModal] = useState(false);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showShopifyModal, setShowShopifyModal] = useState(false);
    const [errors, setErrors] = useState([]);

    const handleShopifySync = useCallback((syncedProducts) => {
        setProducts(syncedProducts);
        if (syncedProducts.length > 0) {
            setSelectedSku(syncedProducts[0].sku);
        }
        alert(`✅ Synced ${syncedProducts.length} products from Shopify!`);
    }, []);

    const gridRef = useRef(null);

    // On page load / whenever products change, ensure selectedSku is valid
    useEffect(() => {
        if (!selectedSku && products.length > 0) {
            setSelectedSku(products[0].sku);
            return;
        }
        if (selectedSku && !products.some(p => p.sku === selectedSku) && products.length > 0) {
            setSelectedSku(products[0].sku);
        }
    }, [products, selectedSku]);

    // --- CALCULATIONS: Process all products ---
    const processedData = useMemo(() => {
        const intermediate = products.map((product) => {
            const safeHistory = Array.isArray(product.history) ? product.history : [];
            const safeFlags = Array.isArray(product.oos_flags) ? product.oos_flags : Array(12).fill(false);
            const safeInbounds = Array.isArray(product.inbounds) ? product.inbounds : Array(6).fill(0);

            const cleanHistory = imputeHistory(safeHistory, safeFlags);

            let appliedModel = modelType;
            let accuracy = 0;
            let finalForecasts = Array(6).fill(0);
            let trend = 0;

            try {
                if (modelType === 'AUTO') {
                    const bm = findBestModel(cleanHistory, 6, uplifts) || {};
                    appliedModel = bm.bestModel || 'HOLT';
                    accuracy = Number(bm.wmape) || 0;

                    const result = calculateForecast(cleanHistory, appliedModel, { alpha, beta }, 6, uplifts) || {};
                    finalForecasts = Array.isArray(result.forecasts) ? result.forecasts : Array(6).fill(0);
                    trend = Number(result.trend) || 0;
                } else {
                    const result = calculateForecast(cleanHistory, modelType, { alpha, beta }, 6, uplifts) || {};
                    finalForecasts = Array.isArray(result.forecasts) ? result.forecasts : Array(6).fill(0);
                    trend = Number(result.trend) || 0;

                    // WMAPE for manual model (backtest last 3)
                    if (cleanHistory.length >= 6) {
                        const test = cleanHistory.slice(-3);
                        const train = cleanHistory.slice(0, -3);
                        const validation = calculateForecast(train, modelType, { alpha, beta }, 3, {}) || {};
                        const vf = Array.isArray(validation.forecasts) ? validation.forecasts : Array(3).fill(0);
                        accuracy = Number(calculateWMAPE(test, vf)) || 0;
                    }
                }
            } catch (e) {
                console.error('Forecasting failed for', product?.sku, e);
                finalForecasts = Array(6).fill(0);
                trend = 0;
                accuracy = 0;
            }

            const { avgDemand, targetStock, orderQty, daysOfCover } = calculateOrdering(
                finalForecasts,
                Number(product.stock) || 0,
                Number(monthsToHold) || 0,
                Number(poOrderCycle) || 0
            );

            const { projectedStock, soldUnits, lostUnits } = calculateInventorySimulation(
                Number(product.stock) || 0,
                finalForecasts,
                safeInbounds
            );

            const stockoutRisk = (Number(product.stock) || 0) <= targetStock * 0.5;

            const price = Number(product.price) || 0;
            const cost = Number(product.cost) || (price * 0.6);

            const revenueSold = _.sum(soldUnits) * price;
            const revenueLost = _.sum(lostUnits) * price;
            const costOfGoods = _.sum(soldUnits) * cost;
            const projectedInboundValue = _.sum(safeInbounds) * cost;

            // Sell Through Rate: Total Sold / (Start Stock + Total Inbounds)
            const totalSold6M = _.sum(soldUnits);
            const totalSupply = (product.stock || 0) + _.sum(safeInbounds);
            const sellThroughRate = totalSupply > 0 ? (totalSold6M / totalSupply) * 100 : 0;

            return {
                ...product,
                cleanHistory,
                forecasts: finalForecasts,
                trend,
                bestModel: appliedModel,
                accuracy: Math.round((accuracy || 0) * 10) / 10,
                avgDemand,
                targetStock,
                orderQty,
                daysOfCover,
                projectedStock,
                soldUnits,
                lostUnits,
                stockoutRisk,
                revenueSold,
                revenueLost,
                costOfGoods,
                projectedInboundValue,
                sellThroughRate,
                cost
            };
        });

        // ABC Ranking based on revenueSold
        const sorted = [...intermediate].sort((a, b) => (b.revenueSold || 0) - (a.revenueSold || 0));
        const totalRev = _.sumBy(sorted, 'revenueSold') || 1;

        let runningRev = 0;
        return sorted.map((p) => {
            runningRev += p.revenueSold || 0;
            const accumPct = (runningRev / totalRev) * 100;
            let rank = 'C';
            if (accumPct <= 80) rank = 'A';
            else if (accumPct <= 95) rank = 'B';
            return { ...p, abcRank: rank };
        });
    }, [products, modelType, alpha, beta, poOrderCycle, monthsToHold, uplifts]);

    // --- DERIVED METRICS ---
    const metrics = useMemo(() => {
        return {
            totalProducts: processedData.length,
            lowStockCount: processedData.filter((p) => p.stockoutRisk).length,
            totalOrderQty: processedData.reduce((acc, p) => acc + (p.orderQty || 0), 0),
            totalValue: processedData.reduce((acc, p) => acc + ((p.stock || 0) * (p.price || 0)), 0),
            totalRevenue6M: processedData.reduce((acc, p) => acc + (p.revenueSold || 0), 0),
            totalLostSales6M: processedData.reduce((acc, p) => acc + (p.revenueLost || 0), 0)
        };
    }, [processedData]);

    // --- REVENUE PROJECTIONS PER MONTH ---
    const revenueProjections = useMemo(() => {
        const monthlyRev = { m1: 0, m2: 0, m3: 0, m4: 0, m5: 0, m6: 0 };
        processedData.forEach((p) => {
            (p.soldUnits || []).forEach((units, idx) => {
                if (idx < 6) monthlyRev[`m${idx + 1}`] += (Number(units) || 0) * (Number(p.price) || 0);
            });
        });
        return monthlyRev;
    }, [processedData]);

    // --- HANDLERS: File Upload ---
    const handleFileUpload = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results) => {
                const validation = validateCSVData(results.data);

                if (!validation.isValid) {
                    setErrors(validation.errors);
                    alert(`Import failed: ${validation.errors[0]}`);
                    return;
                }

                const loaded = validation.validRows.map((row) => ({
                    sku: row.sku,
                    name: row.name,
                    stock: Number(row.stock) || 0,
                    price: Number(row.price) || 0,
                    cost: Number(row.cost) || 0,
                    history: [
                        row.m1, row.m2, row.m3, row.m4, row.m5, row.m6,
                        row.m7, row.m8, row.m9, row.m10, row.m11, row.m12
                    ].map((v) => Number(v) || 0),
                    inbounds: [
                        row.inbound_m1, row.inbound_m2, row.inbound_m3,
                        row.inbound_m4, row.inbound_m5, row.inbound_m6
                    ].map((v) => Number(v) || 0),
                    oos_flags: Array(12).fill(false)
                }));

                setProducts(loaded);
                setSelectedSku(loaded[0]?.sku || null);
                setErrors([]);
                alert(`✅ Successfully loaded ${loaded.length} products!`);
            },
            error: (error) => {
                setErrors([`CSV parsing error: ${error.message}`]);
                alert(`Error: ${error.message}`);
            }
        });
    }, []);

    // --- HANDLERS: Export Grid ---
    const onBtnExport = useCallback(() => {
        if (gridRef.current?.api) {
            gridRef.current.api.exportDataAsCsv({ fileName: 'inventory_plan.csv' });
        }
    }, []);

    // --- HANDLERS: Grid Row Selection ---
    const handleRowClicked = useCallback((sku) => {
        setSelectedSku(sku);
    }, []);

    // --- RENDER CHECK: Auth ---
    if (!session) {
        return <Auth />;
    }

    return (
        <ErrorBoundary>
            <div className="dashboard-container">
                <h1>📦 E-Commerce Planner Pro</h1>
                <p className="subtitle">Advanced Inventory Planning & Demand Forecasting</p>

                <MetricsPanel
                    totalProducts={metrics.totalProducts}
                    lowStockCount={metrics.lowStockCount}
                    totalOrderQty={metrics.totalOrderQty}
                    totalValue={metrics.totalValue}
                    totalRevenue={metrics.totalRevenue6M}
                    showRiskList={showRiskList}
                    onRiskClick={() => setShowRiskList(!showRiskList)}
                    onRevenueClick={() => setShowRevenueModal(true)}
                    onInventoryClick={() => setShowInventoryModal(true)}
                />

                <ParametersSection
                    modelType={modelType}
                    setModelType={setModelType}
                    alpha={alpha}
                    setAlpha={setAlpha}
                    beta={beta}
                    setBeta={setBeta}
                    poOrderCycle={poOrderCycle}
                    setPoOrderCycle={setPoOrderCycle}
                    monthsToHold={monthsToHold}
                    setMonthsToHold={setMonthsToHold}
                    uplifts={uplifts}
                    setUplifts={setUplifts}
                    revenueProjections={revenueProjections}
                    onFileUpload={handleFileUpload}
                    onExport={onBtnExport}
                    onSave={handleSave}
                    isSaving={isSaving}
                    onConnectShopify={() => setShowShopifyModal(true)}
                    errors={errors}
                />

                {showRiskList && <StockoutRiskList processedData={processedData} monthsToHold={monthsToHold} />}

                <ChartSection
                    processedData={processedData}
                    selectedSku={selectedSku}
                    setSelectedSku={setSelectedSku}
                />

                <InventoryGrid
                    processedData={processedData}
                    onRowClicked={handleRowClicked}
                    gridRef={gridRef}
                />

                <ShopifyConnect
                    isOpen={showShopifyModal}
                    onClose={() => setShowShopifyModal(false)}
                    onSyncComplete={handleShopifySync}
                />

                {/* Revenue Drill-down Modal */}
                <RevenueAnalysisModal
                    isOpen={showRevenueModal}
                    onClose={() => setShowRevenueModal(false)}
                    data={processedData}
                    totalRevenue={metrics.totalRevenue6M}
                />

                {/* Inventory Drill-down Modal */}
                <InventoryAnalysisModal
                    isOpen={showInventoryModal}
                    onClose={() => setShowInventoryModal(false)}
                    data={processedData}
                />
            </div>
        </ErrorBoundary>
    );
}

export default App;
