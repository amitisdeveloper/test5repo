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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await auth(req);

    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .order('nickName', { ascending: true })
      .order('createdAt', { ascending: false });

    if (gamesError) {
      throw new Error('Error fetching games');
    }

    // Get unique game names and their latest instances
    const uniqueGames = [];
    const seenNames = new Set();

    for (const game of games) {
      if (!seenNames.has(game.nick_name)) {
        seenNames.add(game.nick_name);

        // Get the latest result for this game
        const { data: latestResult, error: resultError } = await supabase
          .from('results')
          .select('*')
          .eq('name', game.nick_name)
          .order('created_at', { ascending: false })
          .limit(1);

        uniqueGames.push({
          ...game,
          latestResult: latestResult && latestResult.length > 0 ? {
            result: latestResult[0].result,
            date: latestResult[0].created_at,
            time: latestResult[0].time
          } : null
        });
      }
    }

    res.json(uniqueGames);
  } catch (error) {
    console.error('Error fetching games:', error);
    if (error.message.includes('Access denied') || error.message.includes('Invalid token')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
