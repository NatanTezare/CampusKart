const db = require('../config/db');

const getMyItems = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const sql = 'SELECT * FROM items WHERE seller_id = $1 ORDER BY created_at DESC';
        const { rows: items } = await db.query(sql, [userId]);
        res.status(200).json(items);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: "Server error while fetching user's items" });
    }
};

// In createItem function in itemController.js
const createItem = async (req, res) => {
    const { title, description, price, category, quantity } = req.body;
    const seller_id = req.user.user_id;

    // The URL of the uploaded image is now in req.file.path
    const image_url = req.file ? req.file.path : null;

    if (!title || !description || !price || !category) {
        return res.status(400).json({ message: 'Please include all required fields' });
    }
    if (!image_url) {
        return res.status(400).json({ message: 'Image is required' });
    }

    try {
        const sql = 'INSERT INTO items (seller_id, title, description, price, category, quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING item_id';
        const { rows } = await db.query(sql, [seller_id, title, description, price, category, quantity || 1, image_url]);
        res.status(201).json({ message: 'Item created successfully!', itemId: rows[0].item_id });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while creating item' });
    }
};

const getAllItems = async (req, res) => {
    try {
        const { search, category } = req.query;
        let sql = `SELECT i.item_id, i.title, i.price, i.category, i.image_url, u.first_name AS seller_name FROM items AS i JOIN users AS u ON i.seller_id = u.user_id`;
        const params = [];
        let whereClauses = [];
        whereClauses.push("i.listing_status = 'active' AND i.quantity > 0");
        if (search) {
            params.push(`%${search}%`);
            whereClauses.push(`(i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`);
        }
        if (category) {
            params.push(category);
            whereClauses.push(`i.category = $${params.length}`);
        }
        if (whereClauses.length > 0) {
            sql += " WHERE " + whereClauses.join(" AND ");
        }
        sql += " ORDER BY i.created_at DESC";
        const { rows: items } = await db.query(sql, params);
        res.status(200).json(items);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while fetching items' });
    }
};

const getSingleItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const sql = `SELECT 
            i.item_id, i.title, i.description, i.price, i.category, i.quantity, i.image_url, i.created_at,
            u.first_name AS seller_name,
            u.usiu_email AS seller_email,
            u.phone_number AS seller_phone -- Add this line
        FROM items AS i
        JOIN users AS u ON i.seller_id = u.user_id
        WHERE i.item_id = $1 AND i.listing_status = 'active' AND i.quantity > 0`;

        const { rows: items } = await db.query(sql, [itemId]);
        if (items.length === 0) {
            return res.status(404).json({ message: 'Item not found or is not active' });
        }
        res.status(200).json(items[0]);
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while fetching item' });
    }
};

    const updateItem = async (req, res) => {
        try {
            const { itemId } = req.params;
            const userId = req.user.user_id;

            // 1. Get the original item from the database
            const { rows } = await db.query('SELECT * FROM items WHERE item_id = $1', [itemId]);
            const item = rows[0];

            if (!item) {
                return res.status(404).json({ message: 'Item not found' });
            }
            if (item.seller_id !== userId) {
                return res.status(403).json({ message: 'User not authorized to update this item' });
            }

            // 2. Check if a new image was uploaded.
            // If req.file exists, multer and cloudinary worked, so use the new URL.
            // If not, keep the existing image URL from the database.
            const updatedImageUrl = req.file ? req.file.path : item.image_url;

            // 3. Get the rest of the updated data from the request body
            const { title, description, price, category, quantity, listing_status } = req.body;

            // Use existing values as defaults if new values aren't provided
            const updatedTitle = title || item.title;
            const updatedDescription = description || item.description;
            const updatedPrice = price || item.price;
            const updatedCategory = category || item.category;
            const updatedQuantity = quantity === undefined ? item.quantity : quantity;
            const updatedStatus = listing_status || item.listing_status;

            // 4. Create and execute the updated SQL query
            const sql = `
                UPDATE items 
                SET title = $1, description = $2, price = $3, category = $4, quantity = $5, listing_status = $6, image_url = $7 
                WHERE item_id = $8
            `;
            await db.query(sql, [
                updatedTitle, 
                updatedDescription, 
                updatedPrice, 
                updatedCategory, 
                updatedQuantity, 
                updatedStatus, 
                updatedImageUrl, // Add the image url to the query parameters
                itemId
            ]);

            res.status(200).json({ message: 'Item updated successfully' });

        } catch (error) {
            console.error('Database Error:', error);
            res.status(500).json({ message: 'Server error while updating item' });
        }
    };

const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const userId = req.user.user_id;
        const { rows } = await db.query('SELECT seller_id FROM items WHERE item_id = $1', [itemId]);
        const item = rows[0];
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        if (item.seller_id !== userId) {
            return res.status(403).json({ message: 'User not authorized to delete this item' });
        }
        await db.query('DELETE FROM items WHERE item_id = $1', [itemId]);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ message: 'Server error while deleting item' });
    }
};

module.exports = { createItem, getAllItems, getSingleItem, updateItem, deleteItem, getMyItems };
