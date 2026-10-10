import dotenv from 'dotenv';

dotenv.config();

const config = {
  port: process.env.PORT || 5000,
  dbUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'secret_key_kagemaya',
  nodeEnv: process.env.NODE_ENV || 'development',
};

export default config;