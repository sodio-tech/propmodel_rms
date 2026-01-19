module.exports = {
    apps : [{
      name      : 'propmodel_rms',
      script    : './src/server.js',
      instances : '1', // or a specific number like 4
      exec_mode : 'cluster',
      watch     : false, // Restart on file changes
    }]
  
  }
