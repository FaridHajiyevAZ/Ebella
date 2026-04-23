const fs = require('fs');
const path = require('path');

const CATEGORIES_PATH = path.join(__dirname, 'categories.json');
const PRODUCTS_PATH = path.join(__dirname, 'products.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// ---- Categories ----

function getCategories() {
  return readJson(CATEGORIES_PATH);
}

function findCategoryById(id) {
  return getCategories().find((c) => c.id === id) || null;
}

function getSubcategories() {
  const result = [];
  for (const c of getCategories()) {
    for (const s of c.subcategories || []) {
      result.push({ ...s, categoryId: c.id });
    }
  }
  return result;
}

function findSubcategoryById(id) {
  for (const c of getCategories()) {
    const s = (c.subcategories || []).find((s) => s.id === id);
    if (s) return { ...s, categoryId: c.id };
  }
  return null;
}

// ---- Products ----

function getProducts() {
  return readJson(PRODUCTS_PATH);
}

function findProductById(id) {
  return getProducts().find((p) => p.id === id) || null;
}

function saveProducts(products) {
  writeJson(PRODUCTS_PATH, products);
}

function createProduct(product) {
  const products = getProducts();
  products.push(product);
  saveProducts(products);
  return product;
}

function updateProduct(id, next) {
  const products = getProducts();
  const i = products.findIndex((p) => p.id === id);
  if (i === -1) return null;
  products[i] = next;
  saveProducts(products);
  return products[i];
}

function deleteProduct(id) {
  const products = getProducts();
  const i = products.findIndex((p) => p.id === id);
  if (i === -1) return false;
  products.splice(i, 1);
  saveProducts(products);
  return true;
}

module.exports = {
  getCategories,
  findCategoryById,
  getSubcategories,
  findSubcategoryById,
  getProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
