// src/routes/itemRoutes.js
const upload = require('../config/cloudinary'); // Import the upload config
const express = require('express');
const router = express.Router();
// Add deleteItem to the import
const { createItem, getAllItems, getSingleItem, updateItem, deleteItem, getMyItems } = require('../controllers/itemController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/items (Private) - Create an item
router.post('/', protect, upload.single('image'), createItem);

// GET /api/items (Public) - Get all active items
router.get('/', getAllItems);

// GET /api/items/my-items (Private) - Get items for the logged-in user
router.get('/my-items', protect, getMyItems); // Add this line

// GET /api/items/:itemId (Public) - Get a single item
router.get('/:itemId', getSingleItem);

// PUT /api/items/:itemId (Private) - Update an item
router.put('/:itemId', protect, upload.single('image'), updateItem);

// DELETE /api/items/:itemId (Private) - Delete an item
router.delete('/:itemId', protect, deleteItem); // Add this new route

module.exports = router;