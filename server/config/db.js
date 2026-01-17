const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
const connectDB = async () => {
    try {
        // Test the connection by querying a simple table or using a health check
        const { error } = await supabase.from('children').select('count').limit(1);
        
        // If table doesn't exist yet, that's okay - it's just a connection test
        if (error && error.code !== 'PGRST116') {
            console.warn('Supabase connection test warning:', error.message);
        }
        
        console.log("Supabase connected successfully");
        return supabase;
    } catch (error) {
        console.error("Supabase connection error:", error);
        process.exit(1);
    }
};

module.exports = { supabase, connectDB };
