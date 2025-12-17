
import _ from 'lodash';
import { supabase } from '../supabaseClient'; // usage optional if we save token later

// Helper to calculate "Month Index" (0 = Current, 1 = Last Month, etc.)
const getMonthIndex = (dateParams) => {
    const date = new Date(dateParams);
    const today = new Date();
    // primitive month diff
    return (today.getMonth() - date.getMonth()) +
        (12 * (today.getFullYear() - date.getFullYear()));
};

export const fetchShopifyData = async (domain, accessToken) => {
    // Ensure protocol
    const shopUrl = domain.includes('http') ? domain : `https://${domain}`;

    // Headers for Shopify Admin API
    const headers = {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken
    };

    try {
        // 1. Fetch Products (First 250 for MVP)
        // Note: In production we would paginate.
        const productsUrl = `${shopUrl}/admin/api/2023-10/products.json?limit=250&fields=id,title,variants,images,vendor`;
        const prodRes = await fetch(productsUrl, { headers });

        if (!prodRes.ok) {
            throw new Error(`Failed to fetch products: ${prodRes.statusText}`);
        }
        const prodData = await prodRes.json();

        // 2. Fetch Orders (Last 6 months)
        // We need this to build the Sales History array
        // Calculate date 6 months ago
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const ordersUrl = `${shopUrl}/admin/api/2023-10/orders.json?status=any&created_at_min=${sixMonthsAgo.toISOString()}&limit=250&fields=created_at,line_items`;
        const orderRes = await fetch(ordersUrl, { headers });

        if (!orderRes.ok) {
            throw new Error(`Failed to fetch orders: ${orderRes.statusText}`);
        }
        const orderData = await orderRes.json();

        // 3. Process Orders to build History Map
        // Map<SKU, Array[12]> (History M1..M12)
        // Note: Our app uses M1 = Month -1 (Last Month). Current month is usually partial.
        // Let's assume M1 = Last Completed Month for stability, or just rolling window.
        // For simplicity: M1 = Last 30 days, M2 = 30-60 days ago.
        // OR: Calendar Months. Let's stick to Calendar Months offset from Today.

        const historyMap = {}; // SKU -> [m1, m2, m3, m4, m5, m6...]

        orderData.orders.forEach(order => {
            const orderDate = new Date(order.created_at);
            const mIdx = getMonthIndex(orderDate);

            // We only care about last 12 months (indices 1 to 12. 0 is current partial month)
            // Actually dashboard often expects M1 to provide trend.
            // Let's map 0 -> M1 (Current), 1 -> M2, etc, or shift by 1 if we want closed months.
            // Let's use 0 as "M1" for now to include recent data.

            if (mIdx >= 0 && mIdx < 12) {
                order.line_items.forEach(item => {
                    const sku = item.sku || 'UNKNOWN';
                    if (!historyMap[sku]) historyMap[sku] = Array(12).fill(0);
                    historyMap[sku][mIdx] += item.quantity;
                });
            }
        });

        // 4. Map to Dashboard Schema
        const mappedProducts = prodData.products.flatMap(p => {
            // Shopify Products have Variants. Each Variant is a SKU row in our app.
            return p.variants.map(v => {
                const sku = v.sku || `SHOPIFY-${v.id}`;
                const history = historyMap[sku] || Array(12).fill(0);

                // Estimate Cost (Shopify doesn't always performantly expose cost in basic API without extra scopes, 
                // but 'inventory_item' might have it. For MVP, default to 50% price)
                const price = Number(v.price) || 0;

                return {
                    sku: sku,
                    name: `${p.title} - ${v.title !== 'Default Title' ? v.title : ''}`.trim(),
                    stock: v.inventory_quantity || 0,
                    price: price,
                    cost: price * 0.5, // Placeholder as Cost requires InventoryItem API
                    history: history,
                    inbounds: Array(6).fill(0), // No PO data from Shopify yet
                    oos_flags: Array(12).fill(false)
                };
            });
        });

        return mappedProducts;

    } catch (error) {
        console.error('Shopify Sync Error:', error);
        throw error;
    }
};
