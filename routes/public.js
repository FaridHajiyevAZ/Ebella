const express = require('express');
const router = express.Router();
const store = require('../data/store');

// -------------------- Helpers --------------------

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/ə/g, 'e')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function validateProductPayload(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    return ['Request body must be a JSON object'];
  }

  if (!body.name) errors.push('name is required');
  if (!body.categoryId) errors.push('categoryId is required');
  if (!body.subcategoryId) errors.push('subcategoryId is required');

  if (body.categoryId && !store.findCategoryById(body.categoryId)) {
    errors.push(`categoryId "${body.categoryId}" does not exist`);
  }
  if (body.subcategoryId) {
    const sub = store.findSubcategoryById(body.subcategoryId);
    if (!sub) {
      errors.push(`subcategoryId "${body.subcategoryId}" does not exist`);
    } else if (body.categoryId && sub.categoryId !== body.categoryId) {
      errors.push(
        `subcategoryId "${body.subcategoryId}" does not belong to category "${body.categoryId}"`
      );
    }
  }

  if (!Array.isArray(body.variants) || body.variants.length === 0) {
    errors.push('product must have at least one variant');
  } else {
    body.variants.forEach((v, i) => {
      const label = `variants[${i}]`;
      if (!v.colorName) errors.push(`${label}.colorName is required`);
      if (!Array.isArray(v.images) || v.images.length === 0) {
        errors.push(`${label} must have at least one image`);
      } else {
        v.images.forEach((img, j) => {
          if (!img || !img.imageUrl) {
            errors.push(`${label}.images[${j}].imageUrl is required`);
          }
        });
      }
    });
  }

  return errors;
}

function buildProductFromPayload(body, existing) {
  const id = existing ? existing.id : body.id || slugify(body.name);
  return {
    id,
    name: body.name,
    description: body.description || '',
    categoryId: body.categoryId,
    subcategoryId: body.subcategoryId,
    createdAt: existing ? existing.createdAt : new Date().toISOString().slice(0, 10),
    variants: body.variants.map((v) => ({
      colorName: v.colorName,
      colorCode: v.colorCode || '#cccccc',
      sku: v.sku || '',
      price: typeof v.price === 'number' ? v.price : 0,
      stock: typeof v.stock === 'number' ? v.stock : 0,
      images: v.images.map((img) => ({ imageUrl: img.imageUrl })),
    })),
  };
}

// -------------------- Category routes --------------------

// GET /api/categories — full category tree (categories with subcategories nested)
router.get('/categories', (req, res) => {
  res.json(store.getCategories());
});

// GET /api/subcategories — flat list of all subcategories with their parent categoryId
router.get('/subcategories', (req, res) => {
  res.json(store.getSubcategories());
});

// -------------------- Product routes --------------------

// GET /api/products — list every product
router.get('/products', (req, res) => {
  res.json(store.getProducts());
});

// GET /api/products/:id — one product by id
router.get('/products/:id', (req, res) => {
  const product = store.findProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// POST /api/products — create a new product
// NOTE: auth will be added in a later step; for now this route is open.
router.post('/products', (req, res) => {
  const errors = validateProductPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const product = buildProductFromPayload(req.body);
  if (store.findProductById(product.id)) {
    return res
      .status(409)
      .json({ error: `A product with id "${product.id}" already exists` });
  }

  store.createProduct(product);
  res.status(201).json(product);
});

// PUT /api/products/:id — replace an existing product
router.put('/products/:id', (req, res) => {
  const existing = store.findProductById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });

  const errors = validateProductPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const updated = buildProductFromPayload(req.body, existing);
  store.updateProduct(existing.id, updated);
  res.json(updated);
});

// DELETE /api/products/:id — remove a product
router.delete('/products/:id', (req, res) => {
  const ok = store.deleteProduct(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
});

// -------------------- Health --------------------

router.get('/health', (req, res) => {
  res.json({ ok: true, area: 'public' });
});

module.exports = router;
