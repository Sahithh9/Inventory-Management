# Quick Start Guide 🚀

Get your inventory dashboard up and running in 5 minutes!

## Prerequisites

- Node.js 16+ and npm
- A CSV file with your inventory data (or use the template)

## Installation

### 1. Install Dependencies
```bash
cd inventory-dashboard
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

The app will open at: **http://localhost:5174/**

## First Run: Import Sample Data

The app comes with 3 sample products pre-loaded. You can:

### Option A: Use Sample Data (Fastest)
1. Open the app
2. Adjust forecasting parameters if desired
3. Click **"Export"** to save results

### Option B: Import Your Own Data (Recommended)
1. Click the **📥 "Template"** button
2. A CSV file downloads automatically
3. Open it in Excel/Google Sheets
4. Replace sample data with your products
5. Save as CSV
6. Click **📤 "Import CSV"** and select your file
7. App validates and loads your data

## Understanding the Interface

### 📋 Top Section: Metrics
- **Total Products** - Number of SKUs loaded
- **Suggested Order Vol** - Total units to order across all products
- **Stock Health** - Number of products with low stock alerts
- **Total Inventory Value** - Dollar value of all inventory

### 🛠️ Middle Section: Parameters

**Forecasting Model:**
- **Holt's Linear Trend** (default) - Best for trending data
- **Simple Moving Avg** - Best for stable demand
- **Weighted Moving Avg** - Recent-heavy average
- **Linear Regression** - Consistent trends

**Advanced Parameters (for Holt only):**
- **α (Alpha)** - How much to weight current demand (0.0 = ignore, 1.0 = only current)
- **β (Beta)** - How much to weight trend changes (0.0 = no trend, 1.0 = only trend)

**Ordering Configuration:**
- **PO Order Cycle** - How long between orders (months)
- **Months to Hold** - Safety stock buffer (months)

**Demand Uplifts:**
- Adjust forecast by percentage per month
- Example: +20% for promotions, -10% for slow season
- Left-to-right: Month 1 through Month 6

### 📈 Chart Section
- **Blue line** - Historical sales
- **Orange dashed line** - Forecast demand
- **Green dashed line** - Target stock level
- **Purple shaded area** - Projected inventory

Click on any product in the dropdown to view its forecast.

### 📋 Grid Section
Detailed breakdown of all products:
- **SKU/Name** - Product identifier
- **Stock** - Current inventory
- **To Order** - Recommended order quantity
- **Cover (Days)** - How long current stock lasts
  - Red (<30 days) = Critical
  - Yellow (<60 days) = Watch
  - Green (>60 days) = Healthy
- **Forecast M1-M6** - Next 6 months demand
- **Projected Stock M1-M6** - Expected inventory level
  - Red = Stockout risk
  - Green = Healthy

## Common Tasks

### Import New Products
1. Click **📥 Template** to download blank CSV
2. Fill with your data
3. Click **📤 Import CSV**
4. Select your file
5. Click **✅ Alert appears** when done

### Adjust Forecasting
1. Change **Forecasting Model** dropdown
2. For Holt: adjust Alpha/Beta sliders
3. Chart updates instantly
4. View results in grid

### Set Safety Stock
1. Adjust **Months to Hold** (higher = more safety stock)
2. **Target Stock** in grid updates
3. **To Order** quantity recalculates

### Account for Promotions
1. Increase **Demand Uplifts** for promotional months
2. Example: Set Month 2 to "+30" for 30% bump
3. Forecast and ordering automatically adjust

### Export Results
1. Click **📡 Export**
2. CSV file downloads with all planning metrics
3. Use for:
   - Sending to procurement team
   - Importing to ERP/WMS
   - Sharing with stakeholders

## Tips for Best Results

📊 **Good Forecasts Need:**
- At least 12 months of historical data
- Stable demand patterns
- Clear seasonality (if any)

⚠️ **Avoid:**
- Negative stock numbers
- Negative demand
- Extreme uplift values (>500%)

🦪 **Experiment:**
- Try different forecasting models
- Adjust Alpha/Beta to see impact
- Test various safety stock levels
- Use uplifts for what-if scenarios

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move between fields |
| Enter | Submit form (not all) |
| Click SKU row | Select product for chart |

## Troubleshooting

### App won't load
- Clear browser cache (Ctrl+Shift+Del)
- Refresh page (F5)
- Check console for errors (F12)

### CSV import fails
- Download template again
- Compare column names exactly
- Check for negative values
- Remove empty rows
- Ensure m1-m12 and inbound_m1-m6 columns exist

### Chart not updating
- Try selecting another product
- Refresh the page
- Check browser console (F12) for errors

### Numbers look wrong
- Verify input data (check CSV)
- Check Alpha/Beta values (should be 0-1)
- Verify inbound quantities
- Check Months to Hold setting

## Next Steps

1. 📈 **Analyze Forecasts** - Review chart trends
2. 📖 **Read Guide** - See CSV_TEMPLATE_GUIDE.md for details
3. 🦨 **Tune Parameters** - Experiment with model settings
4. 📤 **Export Results** - Share plan with team
5. 🔄 **Iterate** - Update data monthly for continuous planning

## Need Help?

Check these resources:
- **CSV_TEMPLATE_GUIDE.md** - Data import help
- **REFACTORING_SUMMARY.md** - Technical details
- Browser console (F12) - Error messages

---

**Happy Planning! 🎉**
