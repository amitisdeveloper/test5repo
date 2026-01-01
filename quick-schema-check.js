/**
 * Quick schema check without database queries
 */

const mongoose = require('mongoose');

// Import the actual Game model from the backend
const Game = require('./backend/models/Game');

console.log('🔍 Quick Schema Check...\n');

// Check the schema
console.log('1. Game Model Schema Fields:');
const schema = Game.schema.paths;
Object.keys(schema).forEach(field => {
  if (!field.startsWith('_') && field !== '__v') {
    console.log(`  - ${field}: ${schema[field].instance}`);
  }
});

// Check if resultTime field exists
if (schema.resultTime) {
  console.log('\n✅ resultTime field exists in schema');
  console.log('   Type:', schema.resultTime.instance);
  console.log('   Options:', schema.resultTime.options);
} else {
  console.log('\n❌ resultTime field does NOT exist in schema');
}

console.log('\n🎯 Schema check complete');