import app from './app';
import config from './config';

// Gunakan config.port (atau sesuaikan dengan property di config Anda)
const PORT = config.port || process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});