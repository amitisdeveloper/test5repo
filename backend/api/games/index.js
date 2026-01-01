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

      // Transform snake_case to camelCase for frontend compatibility
      const transformGame = (game) => ({
        ...game,
        nickName: game.nick_name,
        gameType: game.game_type,
        isActive: game.is_active,
        resultTime: game.result_time || null
      });

      const transformedPrimeGames = (primeGames || []).map(transformGame);
      const transformedLocalGames = (localGames || []).map(transformGame);

      if (primeError || localError) {
        throw new Error('Error fetching games');
      }

      res.json({
        prime: transformedPrimeGames,
        local: transformedLocalGames
      });
    } else if (req.method === 'POST') {
      // POST /api/games - Create a new game (authenticated)
      await auth(req);
      // Transform camelCase to match database schema
      const transformedBody = {
        nick_name: req.body.nickName,
        is_active: req.body.isActive,
        game_type: req.body.gameType,
        result_time: req.body.resultTime
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
