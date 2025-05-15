// js/supabase-client.js

// IMPORTANT: In a real production app with a build process (like Vite, Webpack, Next.js),
// you would typically store these in environment variables:
// const SUPABASE_URL = process.env.SUPABASE_URL;
// const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// For this vanilla JS example, we'll define them here.
// This ANON key is public, security is managed by RLS policies.

const SUPABASE_URL = 'https://vjkzvckvcfkyvipuuczf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3p2Y2t2Y2ZreXZpcHV1Y3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzUyNzYsImV4cCI6MjA2MjE1MTI3Nn0.6gdUtLeEYKla2wbIMGVvu-1LLSYDMDFIlxKaj3ZVjQc';

// Create a single Supabase client for interacting with your database
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Export the client for use in other JS files
// If using ES6 modules (recommended for larger projects):
// export { supabase };

// For vanilla JS in <script> tags, supabase will be globally available
// if this script is loaded before others that need it,
// or you can attach it to the window object explicitly if needed:
// window.supabaseClient = supabase;