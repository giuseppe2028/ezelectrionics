
-- Create table for Users
CREATE TABLE users (
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    role TEXT NOT NULL,
    password TEXT,
    salt TEXT,
    address TEXT,
    birthdate TEXT,
    PRIMARY KEY(username)
);

-- Create table for Product Descriptors
CREATE TABLE ProductDescriptor (
    model TEXT NOT NULL PRIMARY KEY,
    category TEXT NOT NULL,
    arrival_date TEXT NOT NULL,
    selling_price REAL NOT NULL,
    quantity INTEGER CHECK(quantity >= 0),
    details TEXT
);

-- Create table for Carts
CREATE TABLE Cart (
    id_cart INTEGER PRIMARY KEY AUTOINCREMENT,
    paid INTEGER,
    payment_date TEXT,
    total REAL,
    ref_username TEXT,
    FOREIGN KEY (ref_username) REFERENCES users(username) ON DELETE CASCADE
);

-- Create table for Product-User (Cart Items)
CREATE TABLE ProductUser (
    ref_product_descriptor TEXT,
    id_cart INTEGER,
    quantity INTEGER,
    PRIMARY KEY (ref_product_descriptor, id_cart),
    FOREIGN KEY (ref_product_descriptor) REFERENCES ProductDescriptor(model) ON DELETE CASCADE,
    FOREIGN KEY (id_cart) REFERENCES Cart(id_cart) ON DELETE CASCADE
);

-- Create table for Reviews
CREATE TABLE Review (
    score INTEGER,
    date TEXT,
    comment TEXT,
    ref_user TEXT,
    ref_product_descriptor TEXT,
    PRIMARY KEY (ref_user,ref_product_descriptor),
    FOREIGN KEY (ref_user) REFERENCES users(username) ON DELETE CASCADE,
    FOREIGN KEY (ref_product_descriptor) REFERENCES ProductDescriptor(model) ON DELETE CASCADE
);

-- Create table for History of Products
CREATE TABLE ProductHistory (
    id INTEGER,
    ref_product TEXT,
    quantity INTEGER,
    change_date TEXT,
    FOREIGN KEY (ref_product) REFERENCES ProductDescriptor(model) ON DELETE CASCADE,
    PRIMARY KEY (id AUTOINCREMENT)
);
