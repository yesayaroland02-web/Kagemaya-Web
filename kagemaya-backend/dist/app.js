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
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve uploaded files (avatar, payment proof, banner) sebagai static
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Routes Integration
app.use('/api/auth', auth_router_1.default);
app.use('/api/events', event_router_1.default);
app.use('/api/categories', category_router_1.default);
app.use('/api/orders', order_route_1.default);
app.use('/api/me', user_router_1.default);
app.use('/api/me', reward_routes_1.default);
exports.default = app;
