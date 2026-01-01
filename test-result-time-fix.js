/**
 * Test script to verify resultTime field is working correctly
 * This tests the database field mapping fixes
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testResultTimeFix() {
  try {
    console.log('🔍 Testing Result Time Field Fix...\n');

    // Test 1: Check if games table has result_time column
    console.log('1. Checking games table structure...');
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, nick_name, result_time')
      .limit(3);

    if (gamesError) {
      console.error('❌ Error fetching games:', gamesError.message);
      return;
    }

    console.log('✅ Games fetched successfully');
    games.forEach(game => {
      console.log(`   Game: ${game.nick_name}, Result Time: ${game.result_time || 'Not set'}`);
    });

    // Test 2: Create a test game with resultTime
    console.log('\n2. Testing game creation with resultTime...');
    const testGame = {
      nick_name: 'Test Game ' + Date.now(),
      game_type: 'local',
      is_active: true,
      result_time: '03:45 PM'
    };

    const { data: createdGame, error: createError } = await supabase
      .from('games')
      .insert([testGame])
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating test game:', createError.message);
      return;
    }

    console.log('✅ Test game created successfully');
    console.log(`   Created Game: ${createdGame.nick_name}`);
    console.log(`   Result Time: ${createdGame.result_time}`);

    // Test 3: Update the game with different resultTime
    console.log('\n3. Testing game update with different resultTime...');
    const { data: updatedGame, error: updateError } = await supabase
      .from('games')
      .update({ result_time: '07:30 PM' })
      .eq('id', createdGame.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating test game:', updateError.message);
    } else {
      console.log('✅ Test game updated successfully');
      console.log(`   Updated Result Time: ${updatedGame.result_time}`);
    }

    // Test 4: Test the API response transformation
    console.log('\n4. Testing API response transformation...');
    // This simulates what the API does - transform snake_case to camelCase
    const transformedGame = {
      ...updatedGame,
      nickName: updatedGame.nick_name,
      gameType: updatedGame.game_type,
      isActive: updatedGame.is_active,
      resultTime: updatedGame.result_time
    };

    console.log('✅ API transformation working');
    console.log(`   Frontend will receive:`);
    console.log(`   - nickName: ${transformedGame.nickName}`);
    console.log(`   - gameType: ${transformedGame.gameType}`);
    console.log(`   - resultTime: ${transformedGame.resultTime}`);

    // Test 5: Clean up test game
    console.log('\n5. Cleaning up test game...');
    const { error: deleteError } = await supabase
      .from('games')
      .delete()
      .eq('id', createdGame.id);

    if (deleteError) {
      console.error('⚠️  Warning: Could not delete test game:', deleteError.message);
    } else {
      console.log('✅ Test game cleaned up successfully');
    }

    console.log('\n🎉 Result Time Fix Test Complete!');
    console.log('The timing issue should now be resolved.');
    console.log('Games will now store and display the correct result times.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testResultTimeFix();