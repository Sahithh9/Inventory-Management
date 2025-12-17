
import _ from 'lodash';

/**
 * Calculates the running mean and variance to get Standard Deviation
 * @param {Array<number>} data 
 * @returns {number} stdDev
 */
export const calculateStdDev = (data) => {
    if (data.length < 2) return 0;
    const mean = _.mean(data);
    const variance = _.sumBy(data, (x) => Math.pow(x - mean, 2)) / (data.length - 1);
    return Math.sqrt(variance);
};

/**
 * Imputes Out-of-Stock (OOS) periods by averaging standard replacement values
 * @param {Array<number>} history 
 * @param {Array<boolean>} oosFlags 
 */
export const imputeHistory = (history, oosFlags) => {
    const validPoints = history.filter((_, idx) => !oosFlags[idx]);
    const fallback = validPoints.length > 0 ? _.mean(validPoints) : 0;
    return history.map((val, idx) => oosFlags[idx] ? fallback : val);
};

// --- FORECASTING MODELS ---

const forecastHolt = (history, alpha, beta, horizon, uplifts) => {
    let level = history[0];
    let trend = 0;
    if (history.length > 1) {
        trend = history[1] - history[0];
        level = history[1];
    }
    for (let i = 2; i < history.length; i++) {
        const x = history[i];
        const prevLevel = level;
        const prevTrend = trend;
        level = alpha * x + (1 - alpha) * (prevLevel + prevTrend);
        trend = beta * (level - prevLevel) + (1 - beta) * prevTrend;
    }
    const forecasts = [];
    for (let h = 1; h <= horizon; h++) {
        let forecast = level + h * trend;
        const upliftKey = `m${h}`;
        const upliftPct = uplifts[upliftKey] || 0;
        forecast = forecast * (1 + upliftPct / 100);
        forecasts.push(Math.max(0, Math.round(forecast)));
    }
    return { forecasts, trend };
};

const forecastSMA = (history, horizon, uplifts, period = 3) => {
    // Simple Moving Average of last 'period' months
    const relevantHistory = history.slice(-period);
    const avg = _.mean(relevantHistory) || 0;

    // For SMA, the forecast is flat, but we apply uplifts
    const forecasts = [];
    for (let h = 1; h <= horizon; h++) {
        let forecast = avg;
        const upliftKey = `m${h}`;
        const upliftPct = uplifts[upliftKey] || 0;
        forecast = forecast * (1 + upliftPct / 100);
        forecasts.push(Math.max(0, Math.round(forecast)));
    }
    return { forecasts, trend: 0 };
};

const forecastWMA = (history, horizon, uplifts) => {
    // Weighted Moving Average (3 months: 50%, 30%, 20%)
    if (history.length < 3) return forecastSMA(history, horizon, uplifts, history.length);

    const relevant = history.slice(-3);
    // Weights: Most recent = 0.5, previous = 0.3, oldest = 0.2
    const wAvg = (relevant[2] * 0.5) + (relevant[1] * 0.3) + (relevant[0] * 0.2);

    const forecasts = [];
    for (let h = 1; h <= horizon; h++) {
        let forecast = wAvg;
        const upliftKey = `m${h}`;
        const upliftPct = uplifts[upliftKey] || 0;
        forecast = forecast * (1 + upliftPct / 100);
        forecasts.push(Math.max(0, Math.round(forecast)));
    }
    return { forecasts, trend: 0 };
};

const forecastRegression = (history, horizon, uplifts) => {
    // Linear Regression: y = mx + c
    const n = history.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += history[i];
        sumXY += i * history[i];
        sumX2 += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const forecasts = [];
    for (let h = 1; h <= horizon; h++) {
        // x for forecast starts at n (next point after history end)
        const x = n + (h - 1);
        let forecast = slope * x + intercept;

        const upliftKey = `m${h}`;
        const upliftPct = uplifts[upliftKey] || 0;
        forecast = forecast * (1 + upliftPct / 100);

        forecasts.push(Math.max(0, Math.round(forecast)));
    }

    return { forecasts, trend: slope };
};

/**
 * Calculates Weighted Mean Absolute Percentage Error (WMAPE)
 * @param {Array<number>} actuals 
 * @param {Array<number>} forecasts 
 * @returns {number} wmape (0 to 100)
 */
export const calculateWMAPE = (actuals, forecasts) => {
    if (!actuals || !forecasts || actuals.length === 0) return 0;

    let sumAbsError = 0;
    let sumActual = 0;
    const n = Math.min(actuals.length, forecasts.length);

    for (let i = 0; i < n; i++) {
        sumAbsError += Math.abs(actuals[i] - forecasts[i]);
        sumActual += Math.abs(actuals[i]);
    }

    if (sumActual === 0) return 0;
    return (sumAbsError / sumActual) * 100;
};

/**
 * Finds the best forecasting model based on holdout validation (last 3 points)
 */
export const findBestModel = (history, horizon, uplifts) => {
    // Need at least 6 data points to do a split training/testing
    if (history.length < 6) return { bestModel: 'SMA', wmape: 0 };

    const holdoutSize = 3;
    const train = history.slice(0, -holdoutSize);
    const test = history.slice(-holdoutSize);

    // Candidates
    const models = [
        { type: 'SMA', params: {} },
        { type: 'WMA', params: {} },
        { type: 'REGRESSION', params: {} },
        { type: 'HOLT', params: { alpha: 0.5, beta: 0.3 } } // Default params
    ];

    let bestModel = 'SMA';
    let minError = Infinity;

    models.forEach(m => {
        // Forecast for the holdout period
        const result = calculateForecast(train, m.type, m.params, holdoutSize, {});
        // Note: passing empty uplifts for validation to test raw model fit

        const error = calculateWMAPE(test, result.forecasts);
        if (error < minError) {
            minError = error;
            bestModel = m.type;
        }
    });

    return { bestModel, wmape: Math.round(minError * 10) / 10 };
};


/**
 * Main Forecast Dispatcher
 */
export const calculateForecast = (history, modelType, params, horizon = 6, uplifts = {}) => {
    if (!history || history.length === 0) return { forecasts: Array(horizon).fill(0), trend: 0 };

    if (modelType === 'AUTO') {
        const { bestModel } = findBestModel(history, horizon, uplifts);
        // Recursively call with the selected best model
        // Note: For Holt, we use the passed params (alpha/beta) even if auto selected it, 
        // or we could optimize params too, but keeping it simple for now.
        return calculateForecast(history, bestModel, params, horizon, uplifts);
    }

    switch (modelType) {
        case 'SMA':
            return forecastSMA(history, horizon, uplifts);
        case 'WMA':
            return forecastWMA(history, horizon, uplifts);
        case 'REGRESSION':
            return forecastRegression(history, horizon, uplifts);
        case 'HOLT':
        default:
            return forecastHolt(history, params.alpha, params.beta, horizon, uplifts);
    }
};

/**
 * Custom Ordering Logic
 * Order Qty = (Avg Forecast Next 3M * Months to Hold) + (Avg Forecast Next 3M * PO Order Cycle) - Current Stock
 */
export const calculateOrdering = (forecasts, currentStock, monthsToHold, poOrderCycle) => {
    // 1. Avg Forecast Next 3 Months
    const next3Months = forecasts.slice(0, 3);
    const avgDemand = next3Months.length > 0 ? _.mean(next3Months) : 0;

    // 2. Target Stock
    // Formula: (Avg * Hold) + (Avg * Cycle)
    const targetStock = Math.round((avgDemand * monthsToHold) + (avgDemand * poOrderCycle));

    // 3. Order Qty
    const orderQty = Math.max(0, targetStock - currentStock);

    // 4. Days of Cover (Expert Metric)
    // How long current stock lasts based on average future demand
    // If daily demand = avgDemand / 30
    const dailyDemand = avgDemand / 30;
    const daysOfCover = dailyDemand > 0 ? Math.round(currentStock / dailyDemand) : 999;

    return {
        avgDemand: Math.round(avgDemand),
        targetStock,
        orderQty,
        daysOfCover
    };
};

/**
 * Simulations for Projected Stock, Sales (Units), and Lost Sales (Units)
 * Returns { projectedStock: [], soldUnits: [], lostUnits: [] }
 */
export const calculateInventorySimulation = (currentStock, forecasts, inbounds) => {
    const projectedStock = [];
    const soldUnits = [];
    const lostUnits = [];

    let runningStock = currentStock;

    for (let i = 0; i < forecasts.length; i++) {
        const demand = forecasts[i];
        const supply = inbounds[i] || 0;

        // Current available for sale
        const available = runningStock; // Assuming supply arrives at end of period or just net?
        // Usually inbound arrives during month. Let's assume available = start + inbound for simplicity
        // OR standard safety: available = runningStock. 
        // Let's stick to previous logic: runningStock = runningStock - demand + supply
        // But to calc lost sales, we need to check if demand > stock

        let sales = 0;
        let lost = 0;

        // FIFO: Stock acts as constraint
        // Assumption: Supply is available to meet demand in the same month (optimistic)
        const totalAvailable = runningStock + supply;

        if (totalAvailable >= demand) {
            sales = demand;
            lost = 0;
            runningStock = totalAvailable - demand;
        } else {
            sales = Math.max(0, totalAvailable);
            lost = demand - sales;
            runningStock = 0; // Stockout
        }

        projectedStock.push(Math.round(runningStock));
        soldUnits.push(Math.round(sales));
        lostUnits.push(Math.round(lost));
    }

    return { projectedStock, soldUnits, lostUnits };
};

// Legacy support if needed, but we should use calculateInventorySimulation
export const calculateProjectedStock = (currentStock, forecasts, inbounds) => {
    return calculateInventorySimulation(currentStock, forecasts, inbounds).projectedStock;
};
