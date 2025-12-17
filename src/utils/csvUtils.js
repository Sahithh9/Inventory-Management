/**
 * CSV Utilities for template download and data handling
 */

/**
 * Generates CSV template as a blob and triggers download
 * Works completely client-side - no server needed!
 */
export const downloadTemplateCSV = () => {
    const headers = [
        'sku',
        'name',
        'stock',
        'price',
        'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'm11', 'm12',
        'inbound_m1', 'inbound_m2', 'inbound_m3', 'inbound_m4', 'inbound_m5', 'inbound_m6'
    ];

    const sampleRows = [
        ['SKU-001', 'Wireless Headphones', 45, 120, 12, 15, 18, 14, 16, 20, 17, 19, 22, 18, 21, 23, 0, 10, 0, 0, 0, 0],
        ['SKU-002', 'Smart Watch', 22, 250, 8, 9, 7, 10, 12, 11, 9, 13, 10, 11, 14, 12, 20, 0, 0, 20, 0, 0],
        ['SKU-003', 'Yoga Mat', 78, 45, 5, 6, 8, 7, 6, 9, 11, 8, 10, 9, 12, 10, 0, 0, 0, 0, 0, 0],
        ['SKU-004', 'USB-C Cable', 120, 15, 25, 28, 32, 30, 35, 38, 40, 42, 45, 48, 50, 52, 50, 0, 100, 0, 75, 0],
        ['SKU-005', 'Phone Case', 95, 25, 18, 20, 22, 21, 25, 28, 26, 29, 31, 33, 35, 37, 0, 50, 0, 0, 50, 0]
    ];

    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    sampleRows.forEach(row => {
        csvContent += row.join(',') + '\n';
    });

    // Create blob and trigger download (with BOM for Excel)
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'inventory_template.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Creates documentation for CSV format
 */
export const getCSVDocumentation = () => {
    return `
## CSV Import Format Guide

### Required Columns:
- **sku**: Unique SKU identifier (e.g., SKU-001)
- **name**: Product name (e.g., "Wireless Headphones")
- **stock**: Current stock quantity (must be >= 0)
- **price**: Unit price in dollars (must be >= 0)

### Historical Demand (12 months):
- **m1 through m12**: Monthly demand/sales for the past 12 months
  - Example: m1=12, m2=15, m3=18 (numbers represent units sold)
  - Must be >= 0
  - Can be 0 if no sales that month

### Inbound Supply (Next 6 months):
- **inbound_m1 through inbound_m6**: Expected purchase order deliveries
  - Example: inbound_m1=0, inbound_m2=10 (10 units arriving in month 2)
  - Must be >= 0
  - Used to calculate projected inventory levels

### Example Row:
\`\`\`
SKU-001,Wireless Headphones,45,120,12,15,18,14,16,20,17,19,22,18,21,23,0,10,0,0,0,0
\`\`\`

### Tips:
1. Use the template file to get the correct column structure
2. Empty cells are treated as 0
3. Negative numbers will be rejected
4. Text fields (sku, name) are case-sensitive
5. Numbers can be integers or decimals
`;
};