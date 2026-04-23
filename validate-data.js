const fs = require('fs');
const path = require('path');

const categories = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'categories.json'), 'utf8')
);
const products = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'data', 'products.json'), 'utf8')
);

const errors = [];

const categorySlugs = new Set();
const subcategoryIndex = {};

for (const c of categories) {
  if (!c.slug || !c.name) {
    errors.push(`Category missing slug or name: ${JSON.stringify(c)}`);
    continue;
  }
  if (categorySlugs.has(c.slug)) {
    errors.push(`Duplicate category slug: ${c.slug}`);
  }
  categorySlugs.add(c.slug);

  const subSlugs = new Set();
  for (const s of c.subcategories || []) {
    if (!s.slug || !s.name) {
      errors.push(`Subcategory missing slug or name in ${c.slug}: ${JSON.stringify(s)}`);
      continue;
    }
    if (subSlugs.has(s.slug)) {
      errors.push(`Duplicate subcategory slug in ${c.slug}: ${s.slug}`);
    }
    subSlugs.add(s.slug);
    subcategoryIndex[s.slug] = c.slug;
  }
}

const productSlugs = new Set();
const skuSet = new Set();
let variantCount = 0;

for (const p of products) {
  if (!p.slug || !p.name) {
    errors.push(`Product missing slug or name: ${JSON.stringify(p)}`);
    continue;
  }
  if (productSlugs.has(p.slug)) {
    errors.push(`Duplicate product slug: ${p.slug}`);
  }
  productSlugs.add(p.slug);

  if (!categorySlugs.has(p.category_slug)) {
    errors.push(`Product "${p.slug}" refers to unknown category: ${p.category_slug}`);
  }
  if (subcategoryIndex[p.subcategory_slug] !== p.category_slug) {
    errors.push(
      `Product "${p.slug}": subcategory "${p.subcategory_slug}" does not belong to category "${p.category_slug}"`
    );
  }

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    errors.push(`Product "${p.slug}" has no variants`);
    continue;
  }

  for (const v of p.variants) {
    variantCount++;
    if (!v.sku) {
      errors.push(`Product "${p.slug}" has a variant without SKU`);
    } else if (skuSet.has(v.sku)) {
      errors.push(`Duplicate SKU: ${v.sku}`);
    } else {
      skuSet.add(v.sku);
    }
    if (!v.color_name) {
      errors.push(`Variant "${v.sku || '?'}" in product "${p.slug}" missing color_name`);
    }
    if (typeof v.price !== 'number' || v.price < 0) {
      errors.push(`Variant "${v.sku || '?'}" in product "${p.slug}" has invalid price`);
    }
    if (!Array.isArray(v.images) || v.images.length === 0) {
      errors.push(
        `Variant "${v.sku || '?'}" in product "${p.slug}" has no images (at least 1 required)`
      );
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
