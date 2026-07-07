const fs = require('fs');
const graph = require('../meta/codebase_graph.json');

const query = process.argv[2]; // Get search term from command line

if (!query) {
  console.log("Usage: node search_graph.js <SearchTerm>");
  console.log("Example: node search_graph.js 'ApiService'");
  process.exit(1);
}

console.log(` Searching graph for: "${query}"...\n`);

// 1. Find matching nodes
const matches = graph.nodes.filter(n => 
  n.id.toLowerCase().includes(query.toLowerCase()) || 
  (n.name && n.name.toLowerCase().includes(query.toLowerCase()))
);

if (matches.length === 0) {
  console.log("No matches found.");
  process.exit(0);
}

matches.forEach(node => {
  console.log(` NODE: [${node.type}] ${node.id}`);
  
  // 2. Find dependencies (What does this import/call?)
  const dependencies = graph.edges
    .filter(e => e.source === node.id)
    .map(e => e.target);
    
  if (dependencies.length > 0) {
    console.log(`     DEPENDS ON:`);
    dependencies.forEach(d => console.log(`       - ${d}`));
  }

  // 3. Find dependents (What imports/calls this?)
  const dependents = graph.edges
    .filter(e => e.target === node.id)
    .map(e => e.source);

  if (dependents.length > 0) {
    console.log(`     USED BY:`);
    dependents.forEach(d => console.log(`       - ${d}`));
  }
  
  console.log('-'.repeat(40));
});