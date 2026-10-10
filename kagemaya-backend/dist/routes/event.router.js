"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controller_1 = require("../controllers/event.controller");
const router = (0, express_1.Router)();
// 1. Route Statis & Root dipasang lebih dulu
router.get('/categories', event_controller_1.getCategories);
router.get('/tickets/:ticketTypeId/availability', event_controller_1.checkTicketStock);
router.get('/:ticketTypeId/stock', event_controller_1.checkTicketStock);
router.get('/', event_controller_1.getEvents);
// 2. Route Dinamis (Parametric) dipasang di bawah
router.get('/:id', event_controller_1.getEventById);
exports.default = router;
