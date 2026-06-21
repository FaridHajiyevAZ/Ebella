async function loadProducts() {
  const grid = document.getElementById('product-grid');

  try {
    const res = await fetch('/api/products');
    const products = await res.json();

    if (products.length === 0) {
      grid.innerHTML = '<p class="muted">Hələ məhsul yoxdur.</p>';
      return;
    }

    grid.innerHTML = products.map(productCard).join('');
  } catch (err) {
    grid.innerHTML = '<p class="muted">Məhsulları yükləmək alınmadı.</p>';
  }
}

function productCard(product) {
  const first = product.variants[0];
  const image = first.images[0].imageUrl;
  const minPrice = Math.min(...product.variants.map((v) => v.price));

  return `
    <a class="product-card" href="/product.html?id=${product.id}">
      <div class="product-card-image">
        <img src="${image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-card-body">
        <h3>${product.name}</h3>
        <p class="price">${minPrice} AZN</p>
      </div>
    </a>
  `;
}

loadProducts();
