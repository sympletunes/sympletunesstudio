import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient('https://vjkzvckvcfkyvipuuczf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqa3p2Y2t2Y2ZreXZpcHV1Y3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY1NzUyNzYsImV4cCI6MjA2MjE1MTI3Nn0.6gdUtLeEYKla2wbIMGVvu-1LLSYDMDFIlxKaj3ZVjQc');

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session?.user) {
    window.location.href = 'dashboard.html'; // Or any other page
  }
});
