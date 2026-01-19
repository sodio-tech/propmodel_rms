module.exports = {
    apps : [{
      name      : 'mastery',
      script    : './src/server.js',
      instances : '2', // or a specific number like 4
      exec_mode : 'cluster',
      watch     : false, // Restart on file changes
    }]
  
  }