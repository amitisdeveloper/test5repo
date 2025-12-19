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
    await auth(req);

    const { id } = req.query;

    if (req.method === 'PUT') {
      // PUT /api/results/:id - Update a result (authenticated)
      const { data, error } = await supabase
        .from('results')
        .update(req.body)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Result not found' });
      }

      res.json(data);
    } else if (req.method === 'DELETE') {
      // DELETE /api/results/:id - Delete a result (authenticated)
      const { error } = await supabase
        .from('results')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      res.json({ message: 'Result deleted successfully' });
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
