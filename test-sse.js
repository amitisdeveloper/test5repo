const eventEmitter = require('./backend/utils/eventEmitter');

console.log('Testing SSE Event Emission\n');

// Simulate what happens when a game is deleted
console.log('Simulating game deletion...');
eventEmitter.emit('game-deleted', { type: 'game-deleted', gameId: 'test123' });

console.log('Simulating game creation...');
eventEmitter.emit('game-created', { type: 'game-created', gameId: 'test456', nickName: 'Test Game' });

console.log('Simulating result posting...');
eventEmitter.emit('result-posted', { type: 'result-posted', gameId: 'test789' });

console.log('\n✓ All events emitted successfully');
process.exit(0);
