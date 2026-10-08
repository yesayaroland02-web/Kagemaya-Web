"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const config = {
    port: process.env.PORT || 5000,
    dbUrl: process.env.DATABASE_URL,
    jwtSecret: process.env.JWT_SECRET || 'default_jwt_secret',
    nodeEnv: process.env.NODE_ENV || 'development',
};
exports.default = config;
