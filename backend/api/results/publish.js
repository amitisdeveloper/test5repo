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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await auth(req);

    const { gameId, left, center, right } = req.body;

    if (!gameId || !left || !center || !right) {
      return res.status(400).json({ error: 'Game ID and all result numbers are required' });
    }

    // Find the game to get its name
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (gameError || !game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    // Create result
    const resultData = {
      name: game.nick_name,
      left,
      center,
      right,
      result: `${left}${center}${right}`
    };

    const { data, error } = await supabase
      .from('results')
      .insert([resultData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error publishing result:', error);
    if (error.message.includes('Access denied') || error.message.includes('Invalid token')) {
      res.status(401).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Server error' });
    }
  }
}
