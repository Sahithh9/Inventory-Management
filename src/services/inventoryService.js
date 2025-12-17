
import { supabase } from '../supabaseClient';

// Helper to ensure user has an organization
const getOrCreateOrg = async (user) => {
    // 1. Check profile
    let { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

    if (profile?.organization_id) return profile.organization_id;

    // 2. If no org, create one
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: `${user.email}'s Team` })
        .select()
        .single();

    if (orgError) throw orgError;

    // 3. Link profile to org
    // Check if profile exists first (it should via a trigger, but if not create/update it)
    const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            email: user.email,
            organization_id: org.id
        });

    if (updateError) throw updateError;

    return org.id;
};

export const fetchUserInventory = async (user) => {
    if (!user) return null;

    try {
        const orgId = await getOrCreateOrg(user);

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('organization_id', orgId);

        if (error) throw error;

        if (!data || data.length === 0) return null;

        return data.map(item => ({
            ...item,
            // Only use JSON parsed fields if they exist, otherwise default to empty arrays
            history: item.history || [],
            inbounds: item.inbounds || [],
            oos_flags: item.oos_flags || []
        }));
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return null;
    }
};

export const saveUserInventory = async (products, user) => {
    if (!user) return;

    try {
        const orgId = await getOrCreateOrg(user);

        const updates = products.map(p => ({
            sku: p.sku,
            name: p.name,
            stock: p.stock,
            price: p.price,
            cost: p.cost,
            organization_id: orgId,
            history: p.history,   // arrays handling by jsonb
            inbounds: p.inbounds,
            oos_flags: p.oos_flags
        }));

        const { error } = await supabase
            .from('products')
            .upsert(updates, { onConflict: 'organization_id, sku' });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error saving inventory:', error);
        throw error;
    }
};
