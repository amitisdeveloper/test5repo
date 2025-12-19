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
      // GET /api/games - Get all games (prime and local)
      const { data: primeGames, error: primeError } = await supabase
        .from('games')
        .select('*')
        .eq('gameType', 'prime')
        .eq('isActive', true);

      const { data: localGames, error: localError } = await supabase
        .from('games')
        .select('*')
        .eq('gameType', 'local')
        .eq('isActive', true);

      if (primeError || localError) {
        throw new Error('Error fetching games');
      }

      res.json({
        prime: primeGames,
        local: localGames
      });
    } else if (req.method === 'POST') {
      // POST /api/games - Create a new game (authenticated)
      await auth(req);
      // Transform camelCase to match database schema
      const transformedBody = {
        nickName: req.body.nickName,
        isActive: req.body.isActive,
        gameType: req.body.gameType
      };

      const { data, error } = await supabase
        .from('games')
        .insert([transformedBody])
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
