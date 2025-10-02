const app = require('./index');
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));

process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
