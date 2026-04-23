const fs = require('fs');
const path = require('path');

const categories = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf8')
);
const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8')
);

const errors = [];

const categoryIds = new Set();
const subcategoryIndex = {};

for (const c of categories) {
  if (!c.id || !c.name) {
    errors.push(`Category missing id or name: ${JSON.stringify(c)}`);
    continue;
  }
  if (categoryIds.has(c.id)) {
    errors.push(`Duplicate category id: ${c.id}`);
  }
  categoryIds.add(c.id);

  const subIds = new Set();
  for (const s of c.subcategories || []) {
    if (!s.id || !s.name) {
      errors.push(`Subcategory missing id or name in ${c.id}: ${JSON.stringify(s)}`);
      continue;
    }
    if (subIds.has(s.id)) {
      errors.push(`Duplicate subcategory id in ${c.id}: ${s.id}`);
    }
    subIds.add(s.id);
    subcategoryIndex[s.id] = c.id;
  }
}

const productIds = new Set();
const skuSet = new Set();
let variantCount = 0;

for (const p of products) {
  if (!p.id || !p.name) {
    errors.push(`Product missing id or name: ${JSON.stringify(p)}`);
    continue;
  }
  if (productIds.has(p.id)) {
    errors.push(`Duplicate product id: ${p.id}`);
  }
  productIds.add(p.id);

  if (!categoryIds.has(p.categoryId)) {
    errors.push(`Product "${p.id}" refers to unknown categoryId: ${p.categoryId}`);
  }
  if (subcategoryIndex[p.subcategoryId] !== p.categoryId) {
    errors.push(
      `Product "${p.id}": subcategoryId "${p.subcategoryId}" does not belong to categoryId "${p.categoryId}"`
    );
  }

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    errors.push(`Product "${p.id}" has no variants`);
    continue;
  }

  for (const v of p.variants) {
    variantCount++;
    if (!v.sku) {
      errors.push(`Product "${p.id}" has a variant without sku`);
    } else if (skuSet.has(v.sku)) {
      errors.push(`Duplicate sku: ${v.sku}`);
    } else {
      skuSet.add(v.sku);
    }
    if (!v.colorName) {
      errors.push(`Variant "${v.sku || '?'}" in product "${p.id}" missing colorName`);
    }
    if (typeof v.price !== 'number' || v.price < 0) {
      errors.push(`Variant "${v.sku || '?'}" in product "${p.id}" has invalid price`);
    }
    if (!Array.isArray(v.images) || v.images.length === 0) {
      errors.push(
        `Variant "${v.sku || '?'}" in product "${p.id}" has no images (at least 1 required)`
      );
    } else {
      v.images.forEach((img, j) => {
        if (!img || !img.imageUrl) {
          errors.push(
            `Variant "${v.sku || '?'}" in product "${p.id}" image[${j}] missing imageUrl`
          );
        }
      });
    }
  }
}

if (errors.length) {
  console.error('Data validation FAILED:');
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}

console.log(
  `OK — ${categories.length} categories, ${products.length} products, ${variantCount} variants. Data is consistent.`
);
