// src/app.js
import { getProducts } from './services/productService.js';
import { renderProductGrid } from './components/productGrid.js';
import { initProductModal, openProductModal } from './components/productModal.js';
import { initAdminModal, openAdminModal } from './components/adminModal.js';
import { generateGeneralWhatsAppUrl } from './services/whatsappService.js';

// Estado global da aplicação
const state = {
  allProducts: [],
  filteredProducts: [],
  selectedCategory: 'all',
  selectedSize: 'all',
  searchTerm: '',
  sortBy: 'featured'
};

document.addEventListener('DOMContentLoaded', async () => {
  initProductModal();
  initAdminModal(() => {
    // Callback quando produtos forem alterados pelo painel admin
    loadProducts();
  });

  setupEventListeners();
  await loadProducts();
  handleUrlHashRouting();
  injectStructuredData();
});

/**
 * Carrega a lista de produtos da vitrine
 */
async function loadProducts() {
  const gridContainer = document.getElementById('products-grid');
  if (gridContainer) {
    gridContainer.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>Carregando peças da vitrine...</p>
      </div>
    `;
  }

  try {
    state.allProducts = await getProducts({ includeInactive: false });
    applyFiltersAndSort();
    updateCategoryCountBadges();
  } catch (err) {
    console.error('Erro ao carregar catálogo:', err);
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="empty-products-state">
          <h3>Ops! Não conseguimos carregar o catálogo.</h3>
          <p>Tente recarregar a página em instantes.</p>
        </div>
      `;
    }
  }
}

/**
 * Aplica filtros de categoria, tamanho, busca e ordenação
 */
function applyFiltersAndSort() {
  let list = [...state.allProducts];

  // Filtro por Categoria
  if (state.selectedCategory !== 'all') {
    list = list.filter(p => 
      (p.categoria || '').toLowerCase() === state.selectedCategory.toLowerCase()
    );
  }

  // Filtro por Tamanho
  if (state.selectedSize !== 'all') {
    list = list.filter(p => 
      Array.isArray(p.tamanhos) && p.tamanhos.includes(state.selectedSize)
    );
  }

  // Filtro por Termo de Busca
  if (state.searchTerm.trim()) {
    const term = state.searchTerm.toLowerCase().trim();
    list = list.filter(p => 
      p.nome.toLowerCase().includes(term) ||
      (p.descricao && p.descricao.toLowerCase().includes(term)) ||
      (p.categoria && p.categoria.toLowerCase().includes(term)) ||
      (p.sku && p.sku.toLowerCase().includes(term))
    );
  }

  // Ordenação
  if (state.sortBy === 'price-asc') {
    list.sort((a, b) => (a.precoPromocional || a.preco) - (b.precoPromocional || b.preco));
  } else if (state.sortBy === 'price-desc') {
    list.sort((a, b) => (b.precoPromocional || b.preco) - (a.precoPromocional || a.preco));
  } else if (state.sortBy === 'newest') {
    list.sort((a, b) => new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0));
  } else {
    // 'featured': Destaques primeiro
    list.sort((a, b) => (b.destaque ? 1 : 0) - (a.destaque ? 1 : 0));
  }

  state.filteredProducts = list;

  const countBadge = document.getElementById('products-count');
  if (countBadge) {
    countBadge.textContent = `${list.length} ${list.length === 1 ? 'peça encontrada' : 'peças encontradas'}`;
  }

  const gridContainer = document.getElementById('products-grid');
  renderProductGrid(gridContainer, list);
}

/**
 * Atualiza os contadores de categoria
 */
function updateCategoryCountBadges() {
  const categoryPills = document.querySelectorAll('.category-pill');
  categoryPills.forEach(pill => {
    const cat = pill.getAttribute('data-category');
    let count = 0;
    if (cat === 'all') {
      count = state.allProducts.length;
    } else {
      count = state.allProducts.filter(p => (p.categoria || '').toLowerCase() === cat.toLowerCase()).length;
    }
    const countEl = pill.querySelector('.pill-count');
    if (countEl) countEl.textContent = count;
  });
}

/**
 * Configura ouvintes de eventos da interface
 */
function setupEventListeners() {
  // Filtros de Categoria
  const categoryContainer = document.getElementById('categories-nav');
  if (categoryContainer) {
    categoryContainer.addEventListener('click', (e) => {
      const pill = e.target.closest('.category-pill');
      if (!pill) return;

      categoryContainer.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      state.selectedCategory = pill.getAttribute('data-category');
      applyFiltersAndSort();
    });
  }

  // Busca textual
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchTerm = e.target.value;
      applyFiltersAndSort();
    });
  }

  // Filtro de Tamanho
  const sizeSelect = document.getElementById('size-filter');
  if (sizeSelect) {
    sizeSelect.addEventListener('change', (e) => {
      state.selectedSize = e.target.value;
      applyFiltersAndSort();
    });
  }

  // Ordenação
  const sortSelect = document.getElementById('sort-filter');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFiltersAndSort();
    });
  }

  // Botões de Abertura do Painel Admin
  document.querySelectorAll('.btn-open-admin').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminModal();
    });
  });

  // Botão flutuante do WhatsApp
  const floatBtn = document.getElementById('whatsapp-floating-btn');
  if (floatBtn) {
    floatBtn.href = generateGeneralWhatsAppUrl();
  }

  // Roteamento de hash da URL
  window.addEventListener('hashchange', handleUrlHashRouting);

  // FAQ Accordion
  document.querySelectorAll('.pergunta').forEach((botao) => {
    botao.addEventListener('click', () => {
      const item = botao.parentElement;
      const aberto = item.classList.contains('aberto');

      document.querySelectorAll('.item-faq').forEach((outro) => {
        outro.classList.remove('aberto');
        outro.querySelector('.pergunta').setAttribute('aria-expanded', 'false');
      });

      if (!aberto) {
        item.classList.add('aberto');
        botao.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/**
 * Abre o modal de um produto se o hash da URL for `#produto-{id}`
 */
function handleUrlHashRouting() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#produto-')) {
    const prodId = hash.replace('#produto-', '');
    const product = state.allProducts.find(p => p.id === prodId);
    if (product) {
      openProductModal(product);
    }
  } else if (hash === '#admin') {
    openAdminModal();
  }
}

/**
 * Injeta Schema.org JSON-LD para SEO avançado de roupas e loja de moda
 */
function injectStructuredData() {
  const schemaData = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Dinha Moda & Crochê",
    "description": "Vitrine virtual de roupas femininas artesanais, vestidos, croppeds e peças exclusivas em crochê feitas à mão com pedidos diretos via WhatsApp.",
    "url": window.location.origin,
    "telephone": "+5511999999999",
    "priceRange": "R$ 49 - R$ 250",
    "paymentAccepted": "Pix, Cartão de Crédito, Transferência",
    "currenciesAccepted": "BRL",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Catálogo de Peças",
      "itemListElement": [
        {
          "@type": "OfferCatalog",
          "name": "Crochê Artesanal"
        },
        {
          "@type": "OfferCatalog",
          "name": "Vestidos e Conjuntos"
        }
      ]
    }
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schemaData);
  document.head.appendChild(script);
}
