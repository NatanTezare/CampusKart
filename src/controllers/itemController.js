// src/controllers/itemController.js
const db = require('../config/db');

// @desc    Create a new item
// @route   POST /api/items
// @access  Private
const createItem = async (req, res) => {
    const { title, description, price, category, quantity } = req.body;
    const seller_id = req.user.user_id; // Get seller ID from the logged-in user

    if (!title || !description || !price || !category) {
        return res.status(400).json({ message: 'Please include all required fields' });
    }

    try {
        const sql = 'INSERT INTO items (seller_id, title, description, price, category, quantity) VALUES (?, ?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [seller_id, title, description, price, category, quantity || 1]);

        res.status(201).json({
            message: 'Item created successfully!',
            itemId: result.insertId
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while creating item' });
    }
};

// @desc    Fetch all active items, with search and filtering
// @route   GET /api/items
// @access  Public
const getAllItems = async (req, res) => {
    try {
        // Get search and category from the query string
        const { search, category } = req.query;

        // Start with the base SQL query
        let sql = `
            SELECT 
                i.item_id, 
                i.title, 
                i.price, 
                i.category, 
                i.image_url, 
                u.first_name AS seller_name 
            FROM items AS i
            JOIN users AS u ON i.seller_id = u.user_id
        `;

        const params = [];
        let whereClauses = [];

        // ALWAYS filter for active items first. This solves the problem you mentioned
        // by ensuring sold-out items are never included in the main results.
        whereClauses.push("i.listing_status = 'active' AND i.quantity > 0");

        // If there is a search term, add a search condition
        if (search) {
            whereClauses.push("(i.title LIKE ? OR i.description LIKE ?)");
            // We add '%' wildcards to search for the term anywhere in the title or description
            params.push(`%${search}%`, `%${search}%`);
        }

        // If there is a category filter, add a category condition
        if (category) {
            whereClauses.push("i.category = ?");
            params.push(category);
        }

        // If we have any WHERE conditions, append them to the SQL query
        if (whereClauses.length > 0) {
            sql += " WHERE " + whereClauses.join(" AND ");
        }
        
        // Add ordering to show the newest items first
        sql += " ORDER BY i.created_at DESC";

        // Execute the final, dynamically built query
        const [items] = await db.query(sql, params);

        res.status(200).json(items);

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while fetching items' });
    }
};

// @desc    Fetch a single item by ID
// @route   GET /api/items/:itemId
// @access  Public
const getSingleItem = async (req, res) => {
    try {
        // Get the item ID from the URL parameters
        const { itemId } = req.params;

        const sql = `
            SELECT 
                i.item_id, 
                i.title, 
                i.description,
                i.price, 
                i.category,
                i.quantity,
                i.image_url,
                i.created_at,
                u.first_name AS seller_name,
                u.usiu_email AS seller_email 
            FROM items AS i
            JOIN users AS u ON i.seller_id = u.user_id
            WHERE i.item_id = ? AND i.listing_status = 'active'
        `;

        const [items] = await db.query(sql, [itemId]);

        // Check if an item was found
        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found or is not active' });
        }

        res.status(200).json(items[0]); // Send the single item object

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while fetching item' });
    }
};

// @desc    Update an item
// @route   PUT /api/items/:itemId
// @access  Private
const updateItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.user_id; // From our protect middleware

        // 1. First, find the item to make sure it exists and belongs to the user
        const [items] = await db.query('SELECT * FROM items WHERE item_id = ?', [itemId]);
        const item = items[0];

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // 2. Authorization Check: Ensure the logged-in user is the seller
        if (item.seller_id !== userId) {
            return res.status(403).json({ message: 'User not authorized to update this item' }); // 403 Forbidden
        }

        // 3. Prepare the update
        const { title, description, price, category, quantity, listing_status } = req.body;

        // Use existing values as defaults if new values aren't provided
        const updatedTitle = title || item.title;
        const updatedDescription = description || item.description;
        const updatedPrice = price || item.price;
        const updatedCategory = category || item.category;
        const updatedQuantity = quantity || item.quantity;
        const updatedStatus = listing_status || item.listing_status;

        // 4. Execute the update query
        const sql = `
            UPDATE items SET 
                title = ?, 
                description = ?, 
                price = ?, 
                category = ?, 
                quantity = ?, 
                listing_status = ? 
            WHERE item_id = ?
        `;
        await db.query(sql, [updatedTitle, updatedDescription, updatedPrice, updatedCategory, updatedQuantity, updatedStatus, itemId]);

        res.status(200).json({ message: 'Item updated successfully' });

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while updating item' });
    }
};


const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.user_id; // From our protect middleware

        // 1. First, find the item to make sure it exists and get the seller_id
        const [items] = await db.query('SELECT seller_id FROM items WHERE item_id = ?', [itemId]);
        const item = items[0];

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        // 2. Authorization Check: Ensure the logged-in user is the seller
        if (item.seller_id !== userId) {
            return res.status(403).json({ message: 'User not authorized to delete this item' });
        }

        // 3. Execute the delete query
        await db.query('DELETE FROM items WHERE item_id = ?', [itemId]);

        res.status(200).json({ message: 'Item deleted successfully' });

    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while deleting item' });
    }
};


module.exports = {
    createItem,
    getAllItems,
    getSingleItem,
    updateItem,
    deleteItem, // Export the new function
};