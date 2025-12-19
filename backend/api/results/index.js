const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Auth middleware
const auth = async (req) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) throw new Error('Access denied. No token provided.');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid token.');
  return user;
};

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // GET /api/results - Get all results
      const { data, error } = await supabase
        .from('results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.json(data);
    } else if (req.method === 'POST') {
      // POST /api/results - Create a new result (authenticated)
      await auth(req);
      const { data, error } = await supabase
        .from('results')
        .insert([req.body])
        .select()
        .single();

      if (error) {
        throw error;
      }

      res.status(201).json(data);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    if (error.message.includes('Access denied') || error.message.includes('Invalid token')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
