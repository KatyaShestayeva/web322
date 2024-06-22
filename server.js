/*********************************************************************************
* WEB322 – Assignment 03
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
* of this assignment has been copied manually or electronically from any other source
* (including 3rd party web sites) or distributed to other students.
*
* Name: Katya Shestayeva 
  Student ID: 162363220
  Date: 2024-06-21
*
* Cyclic Web App URL: ________________________________________________________
*
* GitHub Repository URL: ______________________________________________________
*
********************************************************************************/


const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require("./store-service.js");
const app = express();

const HTTP_PORT = process.env.PORT || 8080;

// Middleware
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Multer setup for file uploads
const upload = multer();

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'Your_Cloud_Name',
    api_key: 'Your_API_Key',
    api_secret: 'Your_API_Secret',
    secure: true
});

// ROUTES

// Default Redirect
app.get("/", (req, res) => {
    res.redirect("/about");
});

// About page
app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"));
});

// Shop route
app.get("/shop", (req, res) => {
    storeService.getPublishedItems()
        .then((items) => {
            res.send(JSON.stringify(items));
        })
        .catch((err) => {
            console.log("Error:", err);
            res.status(500).send("Internal Server Error");
        });
});

// Items route with optional filters
app.get("/items", (req, res) => {
    const { category, minDate } = req.query;

    if (category) {
        // Filter items by category
        storeService.getItemsByCategory(parseInt(category))
            .then((filteredItems) => {
                res.send(JSON.stringify(filteredItems));
            })
            .catch((err) => {
                console.log("Error:", err);
                res.status(500).send("Internal Server Error");
            });
    } else if (minDate) {
        // Filter items by minimum date
        storeService.getItemsByMinDate(minDate)
            .then((filteredItems) => {
                res.send(JSON.stringify(filteredItems));
            })
            .catch((err) => {
                console.log("Error:", err);
                res.status(500).send("Internal Server Error");
            });
    } else {
        // Return all items
        storeService.getAllItems()
            .then((items) => {
                res.send(JSON.stringify(items));
            })
            .catch((err) => {
                console.log("Error:", err);
                res.status(500).send("Internal Server Error");
            });
    }
});


// Categories route
app.get("/categories", (req, res) => {
    storeService.getAllCategories()
        .then((categories) => {
            res.send(JSON.stringify(categories));
        })
        .catch((err) => {
            console.log("Error:", err);
            res.status(500).send("Internal Server Error");
        });
});

// Route for adding items with file upload
app.post("/items/add", upload.single('featureImage'), (req, res) => {
    const file = req.file; // Uploaded file details (multer adds this to req object)
    const { title, price, body, category, published } = req.body; // Form data

    // Upload file to Cloudinary
    if (file) {
        const uploadStream = cloudinary.uploader.upload_stream({ folder: 'items' }, (error, result) => {
            if (error) {
                console.error('Error uploading to Cloudinary:', error);
                res.status(500).send('Error uploading to Cloudinary');
            } else {
                // Handle successful upload, e.g., save item to database with Cloudinary URL
                console.log('Upload successful:', result);
                processItem(result.secure_url, req, res); // Pass secure URL to processItem function
            }
        });

        // Stream file buffer to Cloudinary upload stream
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
    } else {
        processItem("", req, res); // No file uploaded, proceed without image URL
    }
});

// Unknown path
app.use((req, res, next) => {
    res.status(404).send("404 - Page Not Found");
});

// Initialize store service and start server
storeService.initialize()
    .then(() => {
        app.listen(HTTP_PORT, () => {
            console.log(`Express http server listening on ${HTTP_PORT}`);
        });
    })
    .catch((err) => {
        console.log("ERROR ON SERVER BOOT:", err);
    });

// Function to process item data and add to store
function processItem(imageUrl, req, res) {
    // Prepare item data from request body
    const itemData = {
        title: req.body.title,
        price: req.body.price,
        body: req.body.body,
        category: req.body.category,
        published: req.body.published === 'on', // Convert checkbox value to boolean
        featureImage: imageUrl // Assign Cloudinary image URL
    };

    // Add item using store service
    storeService.addItem(itemData)
        .then(() => {
            res.redirect("/items"); // Redirect to items list after successful addition
        })
        .catch((err) => {
            console.error("Error adding item:", err);
            res.status(500).send("Error adding item");
        });
}
