CREATE TABLE items (
    item_id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INTEGER DEFAULT 1,
    image_url VARCHAR(255),
    listing_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_seller
        FOREIGN KEY(seller_id) 
        REFERENCES users(user_id)
        ON DELETE CASCADE
);