"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
// Import Routers
const auth_router_1 = __importDefault(require("./routes/auth.router"));
const event_router_1 = __importDefault(require("./routes/event.router"));
const category_router_1 = __importDefault(require("./routes/category.router"));
const order_route_1 = __importDefault(require("./routes/order.route"));
const user_router_1 = __importDefault(require("./routes/user.router"));
const reward_routes_1 = __importDefault(require("./routes/reward.routes"));
const transaction_router_1 = __importDefault(require("./routes/transaction.router"));
const wishlist_router_1 = __importDefault(require("./routes/wishlist.router"));
const follow_router_1 = __importDefault(require("./routes/follow.router"));
const discussion_router_1 = __importDefault(require("./routes/discussion.router"));
// Import Background Jobs
const expireTransaction_job_1 = require("./jobs/expireTransaction.job");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files (avatar, payment proof, banner) sebagai static
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Root / Health Check
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        message: 'Kagemaya Backend API is running 🚀',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            events: '/api/events',
            categories: '/api/categories',
            transactions: '/api/transactions',
            me: '/api/me',
            wishlists: '/api/wishlists',
            follows: '/api/follows',
            discussions: '/api/discussions',
        },
    });
});
// Routes Integration
app.use('/api/auth', auth_router_1.default);
app.use('/api/events', event_router_1.default);
app.use('/api/categories', category_router_1.default);
app.use('/api/orders', order_route_1.default);
app.use('/api/me', user_router_1.default);
app.use('/api/me', reward_routes_1.default);
app.use('/api/transactions', transaction_router_1.default);
// CARD DAY 17 & DAY 18 APIs
app.use('/api/wishlists', wishlist_router_1.default);
app.use('/api', follow_router_1.default); // Mounts /api/follows/:organizerId and /api/organizers/:id
app.use('/api', discussion_router_1.default); // Mounts /api/events/:id/discussions and /api/discussions/:id/pin
// Initialize Background Cron Scheduler (Auto-Expire Transaksi)
(0, expireTransaction_job_1.initExpireTransactionCron)();
exports.default = app;
