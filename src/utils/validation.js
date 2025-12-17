/**
 * Input Validation Utilities
 * Ensures data integrity and prevents crashes
 */

export const ValidationErrors = {
    INVALID_ALPHA: 'Alpha must be between 0 and 1',
    INVALID_BETA: 'Beta must be between 0 and 1',
    INVALID_PO_CYCLE: 'PO Order Cycle must be positive',
    INVALID_MONTHS: 'Months to Hold must be positive',
    NEGATIVE_STOCK: 'Stock cannot be negative',
    INVALID_CSV: 'CSV must have required columns: sku, name, stock, price, m1-m12, inbound_m1-m6',
    EMPTY_CSV: 'CSV file is empty',
    NEGATIVE_HISTORY: 'Monthly history values cannot be negative'
};

/**
 * Validates forecasting model parameters
 * @param {number} alpha - Level smoothing parameter
 * @param {number} beta - Trend smoothing parameter
 * @returns {Array<string>} Array of error messages (empty if valid)
 */
export const validateModelParams = (alpha, beta) => {
    const errors = [];

    if (isNaN(alpha) || alpha < 0 || alpha > 1) {
        errors.push(ValidationErrors.INVALID_ALPHA);
    }

    if (isNaN(beta) || beta < 0 || beta > 1) {
        errors.push(ValidationErrors.INVALID_BETA);
    }

    return errors;
};

/**
 * Validates ordering parameters
 * @param {number} poOrderCycle - Purchase order cycle in months
 * @param {number} monthsToHold - Safety stock in months
 * @returns {Array<string>} Array of error messages (empty if valid)
 */
export const validateOrderingParams = (poOrderCycle, monthsToHold) => {
    const errors = [];

    if (isNaN(poOrderCycle) || poOrderCycle <= 0) {
        errors.push(ValidationErrors.INVALID_PO_CYCLE);
    }

    if (isNaN(monthsToHold) || monthsToHold <= 0) {
        errors.push(ValidationErrors.INVALID_MONTHS);
    }

    return errors;
};

/**
 * Validates a single product row from CSV
 * @param {Object} row - Product data row
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export const validateProductRow = (row) => {
    const errors = [];

    // Check required columns
    const requiredFields = ['sku', 'name', 'stock', 'price'];
    for (const field of requiredFields) {
        if (!row[field] && row[field] !== 0) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Validate cost (optional, defaults to 0 if missing)
    if (row.cost !== undefined && row.cost !== null && row.cost !== '') {
        const cost = Number(row.cost);
        if (isNaN(cost) || cost < 0) {
            errors.push('Cost cannot be negative');
        }
    }

    // Validate stock
    const stock = Number(row.stock);
    if (isNaN(stock) || stock < 0) {
        errors.push(ValidationErrors.NEGATIVE_STOCK);
    }

    // Validate price
    const price = Number(row.price);
    if (isNaN(price) || price < 0) {
        errors.push('Price cannot be negative');
    }

    // Validate history months (m1-m12)
    for (let i = 1; i <= 12; i++) {
        const monthKey = `m${i}`;
        const value = Number(row[monthKey]) || 0;
        if (value < 0) {
            errors.push(ValidationErrors.NEGATIVE_HISTORY);
            break;
        }
    }

    // Validate inbound months (inbound_m1-m6)
    for (let i = 1; i <= 6; i++) {
        const inboundKey = `inbound_m${i}`;
        const value = Number(row[inboundKey]) || 0;
        if (value < 0) {
            errors.push(`Inbound month ${i} cannot be negative`);
            break;
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Validates entire CSV dataset
 * @param {Array<Object>} data - Parsed CSV data
 * @returns {Object} { isValid: boolean, errors: Array<string>, validRows: Array<Object> }
 */
export const validateCSVData = (data) => {
    const errors = [];
    const validRows = [];

    if (!data || data.length === 0) {
        errors.push(ValidationErrors.EMPTY_CSV);
        return { isValid: false, errors, validRows: [] };
    }

    // Check for required columns
    const firstRow = data[0];
    const requiredColumns = ['sku', 'name', 'stock', 'price'];
    const hasMonths = Array.from({ length: 12 }, (_, i) => `m${i + 1}`).every(m => m in firstRow);
    const hasInbounds = Array.from({ length: 6 }, (_, i) => `inbound_m${i + 1}`).every(m => m in firstRow);

    if (!requiredColumns.every(col => col in firstRow) || !hasMonths || !hasInbounds) {
        errors.push(ValidationErrors.INVALID_CSV);
        return { isValid: false, errors, validRows: [] };
    }

    // Validate each row
    data.forEach((row, index) => {
        if (!row.sku) return; // Skip empty rows

        const validation = validateProductRow(row);
        if (validation.isValid) {
            validRows.push(row);
        } else {
            errors.push(`Row ${index + 2} (${row.sku}): ${validation.errors.join(', ')}`);
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
        validRows
    };
};

/**
 * Sanitizes uplift values to prevent NaN/Infinity
 * @param {Object} uplifts - Monthly uplift percentages
 * @returns {Object} Sanitized uplifts
 */
export const sanitizeUplifts = (uplifts) => {
    const sanitized = {};

    for (const [key, value] of Object.entries(uplifts)) {
        const num = Number(value);
        // Clamp between -100% and 1000% (reasonable bounds)
        sanitized[key] = isNaN(num) ? 0 : Math.max(-100, Math.min(1000, num));
    }

    return sanitized;
};

/**
 * Sanitizes numeric inputs
 * @param {number} value - Input value
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @returns {number} Clamped value
 */
export const clampNumber = (value, min = 0, max = 100) => {
    const num = Number(value);
    if (isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
};