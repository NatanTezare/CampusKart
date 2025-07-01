// src/routes/itemRoutes.js
const express = require('express');
const router = express.Router();
// Add deleteItem to the import
const { createItem, getAllItems, getSingleItem, updateItem, deleteItem } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/items (Private) - Create an item
router.post('/', protect, createItem);

// GET /api/items (Public) - Get all active items
router.get('/', getAllItems);

// GET /api/items/:itemId (Public) - Get a single item
router.get('/:itemId', getSingleItem);

// PUT /api/items/:itemId (Private) - Update an item
router.put('/:itemId', protect, updateItem);

// DELETE /api/items/:itemId (Private) - Delete an item
router.delete('/:itemId', protect, deleteItem); // Add this new route

module.exports = router;