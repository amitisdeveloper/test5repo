/**
 * Debug script to test result time saving
 * This will help identify why result times aren't being saved
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugResultTimeSaving() {
  try {
    console.log('🔍 Debugging Result Time Saving Issue...\n');

    // Step 1: Check if result_time column exists
    console.log('1. Checking database schema...');
    const { data: games, error: schemaError } = await supabase
      .from('games')
      .select('*')
      .limit(1);

    if (schemaError) {
      console.error('❌ Database schema error:', schemaError.message);
      return;
    }

    console.log('✅ Database connection working');

    // Step 2: Create test game with resultTime
    console.log('\n2. Testing game creation with resultTime...');
    const testGame = {
      nick_name: 'Debug Test Game ' + Date.now(),
      game_type: 'local',
      is_active: true,
      result_time: '05:30 PM'
    };

    console.log('📤 Sending data to database:', testGame);

    const { data: createdGame, error: createError } = await supabase
      .from('games')
      .insert([testGame])
      .select()
      .single();

    if (createError) {
      console.error('❌ Create error:', createError.message);
      console.error('Error details:', createError);
      return;
    }

    console.log('✅ Game created successfully');
    console.log('📥 Database returned:', createdGame);

    // Step 3: Check if result_time was saved
    console.log('\n3. Verifying result_time was saved...');
    if (createdGame.result_time) {
      console.log('✅ result_time saved correctly:', createdGame.result_time);
    } else {
      console.log('❌ result_time NOT saved - this is the issue!');
      console.log('Available fields:', Object.keys(createdGame));
    }

    // Step 4: Test updating the result time
    console.log('\n4. Testing result time update...');
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({ result_time: '07:45 PM' })
      .eq('id', createdGame.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError.message);
    } else {
      console.log('✅ Update successful');
      console.log('Updated result_time:', updatedGame.result_time);
    }

    // Step 5: Test fetching games to see what we get back
    console.log('\n5. Testing game fetch...');
    const { data: fetchedGames, error: fetchError } = await supabase
      .from('games')
      .select('id, nick_name, result_time')
      .eq('id', createdGame.id)
      .single();

    if (fetchError) {
      console.error('❌ Fetch error:', fetchError.message);
    } else {
      console.log('✅ Fetch successful');
      console.log('Fetched game:', fetchedGames);
    }

    // Clean up test game
    console.log('\n6. Cleaning up test game...');
    await supabase
      .from('games')
      .delete()
      .eq('id', createdGame.id);

    console.log('✅ Test game cleaned up');

    console.log('\n🎯 Debug Summary:');
    console.log('- Database connection: ✅ Working');
    console.log('- Column exists: ✅ Yes');
    console.log('- Create operation: ' + (createdGame.result_time ? '✅ Saves result_time' : '❌ Does NOT save result_time'));
    console.log('- Update operation: ' + (updatedGame?.result_time ? '✅ Updates result_time' : '❌ Does NOT update result_time'));

    if (!createdGame.result_time) {
      console.log('\n🚨 ISSUE IDENTIFIED:');
      console.log('The result_time field is not being saved to the database.');
      console.log('This suggests either:');
      console.log('1. The database column was not created properly');
      console.log('2. There is a permissions issue');
      console.log('3. The API is not sending the data correctly');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

// Run the debug
debugResultTimeSaving();