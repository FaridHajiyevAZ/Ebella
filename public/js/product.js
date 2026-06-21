const productRoot = document.getElementById('product');
const productId = new URLSearchParams(location.search).get('id');

if (!productId) {
  productRoot.innerHTML = '<p class="muted">Məhsul tapılmadı.</p>';
} else {
  loadProduct(productId);
}

async function loadProduct(id) {
  try {
    const res = await fetch('/api/products/' + encodeURIComponent(id));
    if (!res.ok) {
      productRoot.innerHTML = '<p class="muted">Məhsul tapılmadı.</p>';
      return;
    }
    const product = await res.json();
    render(product);
  } catch (err) {
    productRoot.innerHTML = '<p class="muted">Məhsulu yükləmək alınmadı.</p>';
  }
}

function render(product) {
  let selectedVariant = 0;
  let selectedImage = 0;

  productRoot.innerHTML = `
    <article class="product-detail">
      <div class="gallery">
        <img id="main-image" class="main-image" alt="${escapeHtml(product.name)}" />
        <div id="thumbs" class="thumbs"></div>
      </div>
      <div class="product-info">
        <h1>${escapeHtml(product.name)}</h1>
        <p id="price" class="price"></p>
        <p class="description">${escapeHtml(product.description)}</p>

        <div class="variant-picker">
          <strong>Rəng: <span id="color-name"></span></strong>
          <div id="swatches" class="swatches"></div>
        </div>

        <p id="stock" class="stock"></p>

        <button id="whatsapp-btn" class="whatsapp-btn" type="button">
          WhatsApp ilə sifariş et
        </button>
      </div>
    </article>
  `;

  const swatchesEl = document.getElementById('swatches');
  swatchesEl.innerHTML = product.variants
    .map(
      (v, i) => `
        <button class="swatch" data-index="${i}"
                style="background:${v.colorCode}"
                title="${escapeHtml(v.colorName)}"
                aria-label="${escapeHtml(v.colorName)}"></button>
      `
    )
    .join('');

  swatchesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('.swatch');
    if (!btn) return;
    selectedVariant = Number(btn.dataset.index);
    selectedImage = 0;
    paint();
  });

  function paint() {
    const v = product.variants[selectedVariant];

    document.getElementById('main-image').src = v.images[selectedImage].imageUrl;
    document.getElementById('color-name').textContent = v.colorName;
    document.getElementById('price').textContent = v.price + ' AZN';

    const stockEl = document.getElementById('stock');
    if (v.stock === 0) {
      stockEl.textContent = 'Bitib';
      stockEl.className = 'stock out';
    } else if (v.stock <= 3) {
      stockEl.textContent = `Yalnız ${v.stock} ədəd qalıb`;
      stockEl.className = 'stock low';
    } else {
      stockEl.textContent = 'Stokda var';
      stockEl.className = 'stock';
    }

    const thumbsEl = document.getElementById('thumbs');
    thumbsEl.innerHTML = v.images
      .map(
        (img, i) => `
          <img class="thumb${i === selectedImage ? ' active' : ''}"
               data-index="${i}"
               src="${img.imageUrl}" alt="" />
        `
      )
      .join('');

    document.querySelectorAll('.swatch').forEach((s) => {
      s.classList.toggle('active', Number(s.dataset.index) === selectedVariant);
    });
  }

  document.getElementById('thumbs').addEventListener('click', (e) => {
    const img = e.target.closest('.thumb');
    if (!img) return;
    selectedImage = Number(img.dataset.index);
    paint();
  });

  document.getElementById('whatsapp-btn').addEventListener('click', () => {
    const v = product.variants[selectedVariant];
    alert(
      `WhatsApp sifarişi (bu addımda hələ tam işləmir):\n\n` +
        `• Məhsul: ${product.name}\n` +
        `• Rəng: ${v.colorName}\n` +
        `• SKU: ${v.sku}\n` +
        `• Qiymət: ${v.price} AZN`
    );
  });

  paint();
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
