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

    if (req.method === 'GET') {
      // GET /api/games/:id - Get a single game (authenticated)
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json(data);
    } else if (req.method === 'PUT') {
      // PUT /api/games/:id - Update a game (authenticated)
      // Transform camelCase to match database schema
      const transformedBody = {
        nick_name: req.body.nickName,
        is_active: req.body.isActive,
        game_type: req.body.gameType,
        result_time: req.body.resultTime
      };

      const { data, error } = await supabase
        .from('games')
        .update(transformedBody)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Game not found' });
      }

      res.json(data);
    } else if (req.method === 'DELETE') {
      // DELETE /api/games/:id - Delete a game and its associated results (authenticated)
      
      // First, get the game name to find associated results
      const { data: game, error: gameError } = await supabase
        .from('games')
        .select('nick_name')
        .eq('id', id)
        .single();

      if (gameError) {
        throw gameError;
      }

      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }

      // Delete all results associated with this game
      const { error: resultsError } = await supabase
        .from('results')
        .delete()
        .eq('name', game.nick_name);

      if (resultsError) {
        console.error('Error deleting results:', resultsError);
        // Continue with game deletion even if results deletion fails
      }

      // Delete the game itself
      const { error: deleteGameError } = await supabase
        .from('games')
        .delete()
        .eq('id', id);

      if (deleteGameError) {
        throw deleteGameError;
      }

      res.json({ 
        message: 'Game and associated results deleted successfully',
        deletedResults: game.nick_name
      });
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
