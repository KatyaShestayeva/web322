const fs = require("fs");

let items;
let categories;

fs.readFile("./data/items.json", "utf8", (err, jsonString) => {
	if (err) {
		console.log("File read error:", err);
		return;
	}
	// Initialize items array
	items = JSON.parse(jsonString);
});

module.exports.initialize = function () {
	return new Promise((resolve, reject) => {
		fs.readFile("./data/categories.json", "utf8", (err, jsonString) => {
			if (err) {
				console.log("File read error:", err);
				reject("Unable to read category file");
				return;
			}
			categories = JSON.parse(jsonString);
			resolve();
		});
	});
};

module.exports.getAllItems = function () {
	return new Promise((resolve, reject) => {
		items.length !== 0 ? resolve(items) : reject("Items array is empty!");
	});
};

module.exports.getAllCategories = function () {
	return new Promise((resolve, reject) => {
		categories.length !== 0 ? resolve(categories) : reject("Categories array is empty!");
	});
};

module.exports.getPublishedItems = function () {
	return new Promise((resolve, reject) => {
		const publishedItems = items.filter((item) => item.published === true);
		publishedItems.length !== 0 ? resolve(publishedItems) : reject("No published items found!");
	});
};

module.exports.getItemsByCategory = function (category) {
	return new Promise((resolve, reject) => {
		const filteredItems = items.filter((item) => item.category === category);
		filteredItems.length !== 0 ? resolve(filteredItems) : reject("No items found for the category");
	});
};

module.exports.getItemsByMinDate = function (minDateStr) {
	return new Promise((resolve, reject) => {
		const minDate = new Date(minDateStr);
		const filteredItems = items.filter((item) => new Date(item.postDate) >= minDate);
		filteredItems.length !== 0 ? resolve(filteredItems) : reject("No items found for the minimum date");
	});
};

module.exports.getItemById = function (id) {
	return new Promise((resolve, reject) => {
		const item = items.find((item) => item.id === id);
		item ? resolve(item) : reject("Item not found");
	});
};


app.get("/item/:id", (req, res) => {
    const itemId = parseInt(req.params.id);

    storeService.getItemById(itemId)
        .then((item) => {
            res.send(JSON.stringify(item));
        })
        .catch((err) => {
            console.log("Error:", err);
            res.status(404).send("Item not found");
        });
});