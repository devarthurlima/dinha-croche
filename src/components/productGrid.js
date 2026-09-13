// src/components/productGrid.js
import { formatCurrency, generateProductWhatsAppUrl } from '../services/whatsappService.js';
import { openProductModal } from './productModal.js';

/**
 * Cria o elemento HTML de um Card de Produto
 * @param {Object} product 
 * @returns {HTMLElement}
 */
export function createProductCard(product) {
  const card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('data-id', product.id);
  card.setAttribute('data-category', (product.categoria || '').toLowerCase());

  // Badges
  let badgeHtml = '';
  if (product.precoPromocional && product.precoPromocional < product.preco) {
    const discountPercent = Math.round(((product.preco - product.precoPromocional) / product.preco) * 100);
    badgeHtml = `<span class="product-badge badge-promo">-${discountPercent}%</span>`;
  } else if (product.sobEncomenda) {
    badgeHtml = `<span class="product-badge badge-custom">Sob Encomenda</span>`;
  } else if (product.estoque <= 0) {
    badgeHtml = `<span class="product-badge badge-out">Esgotado</span>`;
  } else if (product.estoque <= 2) {
    badgeHtml = `<span class="product-badge badge-warning">Últimas Peças</span>`;
  } else if (product.destaque) {
    badgeHtml = `<span class="product-badge badge-highlight">Destaque</span>`;
  }

  // Preço e parcelamento
  const hasDiscount = product.precoPromocional && product.precoPromocional < product.preco;
  const currentPrice = hasDiscount ? product.precoPromocional : product.preco;
  const installmentValue = (currentPrice / 3).toFixed(2).replace('.', ',');

  const priceHtml = hasDiscount
    ? `<div class="price-wrapper">
         <span class="old-price">${formatCurrency(product.preco)}</span>
         <span class="current-price">${formatCurrency(product.precoPromocional)}</span>
       </div>`
    : `<div class="price-wrapper">
         <span class="current-price">${formatCurrency(product.preco)}</span>
       </div>`;

  const imageSrc = product.imagens && product.imagens.length > 0 ? product.imagens[0] : './imagens/croche2.webp';

  card.innerHTML = `
    <div class="product-image-container">
      ${badgeHtml}
      <img 
        src="${imageSrc}" 
        alt="${escapeHtml(product.nome)}" 
        loading="lazy" 
        width="400" 
        height="400" 
        class="product-image"
      />
      <div class="product-image-overlay">
        <button class="btn-quick-view" aria-label="Ver detalhes de ${escapeHtml(product.nome)}">
          🔍 Ver Detalhes
        </button>
      </div>
    </div>

    <div class="product-details">
      <div class="product-meta">
        <span class="product-category">${escapeHtml(product.categoria || 'Moda')}</span>
        ${product.sku ? `<span class="product-sku">#${escapeHtml(product.sku)}</span>` : ''}
      </div>

      <h3 class="product-title" title="${escapeHtml(product.nome)}">
        ${escapeHtml(product.nome)}
      </h3>

      ${priceHtml}
      <span class="product-installments">ou 3x de R$ ${installmentValue} sem juros</span>

      <div class="product-card-actions">
        <button class="btn btn-primary btn-details" type="button">
          Ver Peça
        </button>
        <a 
          href="${generateProductWhatsAppUrl({ product })}" 
          class="btn btn-whatsapp-icon" 
          target="_blank" 
          rel="noopener noreferrer"
          title="Pedir direto no WhatsApp"
          aria-label="Pedir ${escapeHtml(product.nome)} no WhatsApp"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
          </svg>
        </a>
      </div>
    </div>
  `;

  // Interatividade de clique para abrir detalhes
  const openModal = () => openProductModal(product);
  card.querySelector('.product-image-container').addEventListener('click', openModal);
  card.querySelector('.btn-details').addEventListener('click', openModal);
  card.querySelector('.product-title').addEventListener('click', openModal);

  return card;
}

/**
 * Renderiza uma lista de produtos em um container grid
 * @param {HTMLElement} container 
 * @param {Array} products 
 */
export function renderProductGrid(container, products) {
  if (!container) return;
  container.innerHTML = '';

  if (!products || products.length === 0) {
    container.innerHTML = `
      <div class="empty-products-state">
        <div class="empty-icon">🛍️</div>
        <h3>Nenhuma peça encontrada</h3>
        <p>Tente ajustar os filtros ou pesquisar por outro termo.</p>
      </div>
    `;
    return;
  }

  products.forEach(product => {
    const cardEl = createProductCard(product);
    container.appendChild(cardEl);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
