import app from './app';
import config from './config';

const PORT = config.port || process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});