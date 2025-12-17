# CSV Import Template Guide

## Overview

This guide explains how to prepare your inventory data for import into the E-Commerce Planner Pro. The tool accepts CSV files with a specific structure.

## Column Reference

### Required Columns

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| **sku** | Text | Unique SKU identifier | Required, unique per row |
| **name** | Text | Product name | Required |
| **stock** | Number | Current inventory level | Must be >= 0 |
| **price** | Number | Unit price | Must be >= 0, decimals OK |

### Historical Demand (12 months)

| Column | Type | Description |
|--------|------|-------------|
| **m1** | Number | Month 1 demand (oldest) |
| **m2** | Number | Month 2 demand |
| **m3** | Number | Month 3 demand |
| ... | ... | ... |
| **m12** | Number | Month 12 demand (most recent) |

- Must be in **chronological order** (oldest → newest)
- Can be zero if no sales that month
- Must be >= 0
- Represents actual units sold/demanded

### Inbound Supply (Next 6 months)

| Column | Type | Description |
|--------|------|-------------|
| **inbound_m1** | Number | Expected units arriving next month |
| **inbound_m2** | Number | Expected units arriving month 2 |
| **inbound_m3** | Number | Expected units arriving month 3 |
| **inbound_m4** | Number | Expected units arriving month 4 |
| **inbound_m5** | Number | Expected units arriving month 5 |
| **inbound_m6** | Number | Expected units arriving month 6 |

- Represents purchase order deliveries
- Must be >= 0
- Used to calculate projected inventory levels
- Leave as 0 if no inbound scheduled

## Example CSV Format

```csv
sku,name,stock,price,m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,inbound_m1,inbound_m2,inbound_m3,inbound_m4,inbound_m5,inbound_m6
SKU-001,Wireless Headphones,45,120,12,15,18,14,16,20,17,19,22,18,21,23,0,10,0,0,0,0
SKU-002,Smart Watch,22,250,8,9,7,10,12,11,9,13,10,11,14,12,20,0,0,20,0,0
SKU-003,Yoga Mat,78,45,5,6,8,7,6,9,11,8,10,9,12,10,0,0,0,0,0,0
```

## Data Validation Rules

The application validates your data on import. Here are the rules:

✅ **Accepted:**
- Stock = 0
- Demand = 0
- Inbound = 0
- Decimal prices (e.g., 19.99)
- Integer and decimal demands

❌ **Rejected:**
- Negative stock (-5)
- Negative demand (-10)
- Negative inbound (-20)
- Negative price (-50)
- Empty required fields
- Missing month columns (m1-m12)
- Missing inbound columns (inbound_m1-inbound_m6)

## How to Prepare Your Data

### Step 1: Download the Template
Click the **"📥 Template"** button in the Parameters section. This gives you a pre-formatted CSV with sample data.

### Step 2: Fill in Your Data
Replace the sample data with your actual inventory and demand data. Keep the column structure the same.

### Step 3: Review
- Ensure all required columns are present
- Check that historical data is in chronological order (m1 = oldest, m12 = newest)
- Verify all numbers are non-negative
- Remove any empty rows

### Step 4: Import
Click **"📤 Import CSV"** and select your file. The app will validate and load it immediately.

## Common Issues & Solutions

### "CSV parsing error"
**Cause:** File is corrupted or not a valid CSV  
**Solution:** Open in Excel/Google Sheets, re-save as CSV, and try again

### "Missing required columns"
**Cause:** You removed or renamed a column  
**Solution:** Use the template file as reference; add missing columns

### "Negative values rejected"
**Cause:** You have negative numbers in stock, price, or demand  
**Solution:** Review your data and replace negative values with 0 or positive numbers

### "Empty CSV file"
**Cause:** File is empty or only has headers  
**Solution:** Add at least one product row with data

### "Row X: Missing required field"
**Cause:** A row is missing SKU, name, stock, or price  
**Solution:** Fill in all required fields for that row

## Tips for Best Results

### Demand History
- **Use actual sales data** from your POS or ERP system
- **Update monthly** for most accurate forecasts
- Include **at least 12 months** of history
- If you have gaps (out-of-stock periods), mark those with 0 or your best estimate

### Inbound Supply
- **Get from procurement team** - PO delivery schedules
- **Update regularly** as orders are placed/delivered
- **Be realistic** about lead times and order quantities

### Forecasting Models
- **Holt's Linear Trend:** Best for trending data (growth/decline)
- **Simple Moving Average:** Best for stable, non-trending demand
- **Weighted Moving Average:** Balances recent trends with history
- **Linear Regression:** Best for consistent linear trends

### Demand Uplifts
- Use uplifts to account for **promotions, seasonality, or events**
- Enter percentages (e.g., "10" = +10% demand)
- Negative values reduce forecast (e.g., "-20" = -20% demand)
- Apply to specific months only

## File Format Details

- **Format:** Plain text CSV (Comma-Separated Values)
- **Encoding:** UTF-8 (standard)
- **Delimiter:** Comma (`,`)
- **Line Endings:** LF or CRLF (auto-detected)
- **Extension:** `.csv`
- **Max Size:** Limited only by browser memory (~1000s of SKUs)

## Example with Different Products

```csv
sku,name,stock,price,m1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,inbound_m1,inbound_m2,inbound_m3,inbound_m4,inbound_m5,inbound_m6
P-USB-C,USB-C Cable 3ft,120,15,25,28,32,30,35,38,40,42,45,48,50,52,50,0,100,0,75,0
P-CASE-BLK,Phone Case Black,95,25,18,20,22,21,25,28,26,29,31,33,35,37,0,50,0,0,50,0
P-SCREEN-PRO,Screen Protector,150,8,40,45,50,48,52,55,58,60,62,65,68,70,100,0,50,100,0,50
```

## Next Steps

1. Download the template (click **"Template"** button)
2. Open in Excel or Google Sheets
3. Replace sample data with your products
4. Save as CSV
5. Click **"Import CSV"** in the app
6. Tune forecasting parameters (model, α, β)
7. Export results when ready

## Questions?

If you encounter issues:
1. Check the error message in the red alert box
2. Refer to the "Common Issues" section above
3. Validate your CSV with a tool like [CSV Validator](https://csvlint.io/)
4. Re-download the template and compare your structure

---

**Last Updated:** 2025
