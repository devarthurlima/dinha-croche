// src/components/productModal.js
import { generateProductWhatsAppUrl, formatCurrency } from '../services/whatsappService.js';
import { showToast } from './toast.js';

let modalElement = null;
let currentProduct = null;
let selectedSize = null;
let selectedColor = null;

export function initProductModal() {
  if (modalElement) return;

  modalElement = document.createElement('div');
  modalElement.id = 'product-modal';
  modalElement.className = 'modal-backdrop hidden';
  modalElement.setAttribute('role', 'dialog');
  modalElement.setAttribute('aria-modal', 'true');

  modalElement.innerHTML = `
    <div class="modal-dialog product-modal-dialog">
      <button class="modal-close-btn" id="modal-close-btn" aria-label="Fechar modal">&times;</button>
      
      <div class="product-modal-content">
        <div class="product-modal-gallery">
          <div class="modal-main-image-container">
            <img id="modal-main-img" src="" alt="" class="modal-main-img" />
          </div>
          <div class="modal-thumbs" id="modal-thumbs"></div>
        </div>

        <div class="product-modal-info">
          <div class="modal-header-meta">
            <span class="product-category-tag" id="modal-category">Categoria</span>
            <span class="product-sku-tag" id="modal-sku">SKU</span>
          </div>

          <h2 class="modal-product-title" id="modal-title">Nome do Produto</h2>
          
          <div class="modal-price-container">
            <span class="modal-old-price hidden" id="modal-old-price"></span>
            <span class="modal-current-price" id="modal-price">R$ 0,00</span>
            <span class="modal-installments" id="modal-installments">ou em até 3x sem juros</span>
          </div>

          <div class="modal-stock-status" id="modal-stock-status">
            <span class="stock-dot"></span>
            <span id="modal-stock-text">Pronta Entrega</span>
          </div>

          <p class="modal-description" id="modal-description"></p>

          <!-- Seletor de Tamanhos -->
          <div class="modal-selector-group" id="group-tamanhos">
            <label class="selector-label">Escolha o Tamanho: <span class="selected-val" id="selected-size-label"></span></label>
            <div class="options-pills" id="modal-sizes-container"></div>
          </div>

          <!-- Seletor de Cores -->
          <div class="modal-selector-group" id="group-cores">
            <label class="selector-label">Escolha a Cor: <span class="selected-val" id="selected-color-label"></span></label>
            <div class="options-pills" id="modal-colors-container"></div>
          </div>

          <!-- CTA do WhatsApp -->
          <div class="modal-actions">
            <a href="#" id="modal-whatsapp-btn" class="btn btn-whatsapp btn-large" target="_blank" rel="noopener noreferrer">
              <svg class="whatsapp-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z"/>
              </svg>
              <span>Comprar pelo WhatsApp</span>
            </a>

            <button id="modal-share-btn" class="btn btn-secondary btn-outline">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              <span>Compartilhar</span>
            </button>
          </div>

          <div class="modal-guarantee">
            <span>✨ Compra segura direto com a artesã</span>
            <span>📦 Envio para todo o Brasil</span>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modalElement);

  // Eventos de fechar
  modalElement.querySelector('#modal-close-btn').addEventListener('click', closeProductModal);
  modalElement.addEventListener('click', (e) => {
    if (e.target === modalElement) closeProductModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modalElement.classList.contains('hidden')) {
      closeProductModal();
    }
  });

  // Botão Compartilhar
  modalElement.querySelector('#modal-share-btn').addEventListener('click', () => {
    if (!currentProduct) return;
    const url = `${window.location.href.split('#')[0]}#produto-${currentProduct.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link do produto copiado com sucesso!', 'success');
      });
    } else {
      showToast('Compartilhe: ' + url, 'info');
    }
  });
}

/**
 * Abre o modal para um produto selecionado
 * @param {Object} product 
 */
export function openProductModal(product) {
  initProductModal();
  currentProduct = product;

  // Atualiza hash da URL sem scroll
  if (window.history.pushState) {
    window.history.pushState(null, null, `#produto-${product.id}`);
  }

  // Dados básicos
  document.getElementById('modal-title').textContent = product.nome;
  document.getElementById('modal-category').textContent = product.categoria || 'Moda';
  document.getElementById('modal-sku').textContent = product.sku ? `Ref: #${product.sku}` : '';
  document.getElementById('modal-description').textContent = product.descricao || 'Peça confeccionada com acabamento impecável e alta qualidade.';

  // Imagens
  const images = product.imagens && product.imagens.length > 0 ? product.imagens : ['./imagens/croche2.webp'];
  const mainImg = document.getElementById('modal-main-img');
  mainImg.src = images[0];
  mainImg.alt = product.nome;

  const thumbsContainer = document.getElementById('modal-thumbs');
  thumbsContainer.innerHTML = '';
  if (images.length > 1) {
    images.forEach((imgSrc, idx) => {
      const thumb = document.createElement('img');
      thumb.src = imgSrc;
      thumb.alt = `${product.nome} foto ${idx + 1}`;
      thumb.className = `modal-thumb ${idx === 0 ? 'active' : ''}`;
      thumb.addEventListener('click', () => {
        mainImg.src = imgSrc;
        thumbsContainer.querySelectorAll('.modal-thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbsContainer.appendChild(thumb);
    });
  }

  // Preço
  const priceEl = document.getElementById('modal-price');
  const oldPriceEl = document.getElementById('modal-old-price');
  if (product.precoPromocional && product.precoPromocional < product.preco) {
    oldPriceEl.textContent = formatCurrency(product.preco);
    oldPriceEl.classList.remove('hidden');
    priceEl.textContent = formatCurrency(product.precoPromocional);
  } else {
    oldPriceEl.classList.add('hidden');
    priceEl.textContent = formatCurrency(product.preco);
  }

  // Estoque
  const stockText = document.getElementById('modal-stock-text');
  const stockStatus = document.getElementById('modal-stock-status');
  if (product.sobEncomenda) {
    stockText.textContent = 'Feito sob encomenda (prazo sob consulta)';
    stockStatus.className = 'modal-stock-status status-encomenda';
  } else if (product.estoque <= 0) {
    stockText.textContent = 'Esgotado no momento (solicite reposição)';
    stockStatus.className = 'modal-stock-status status-esgotado';
  } else if (product.estoque <= 2) {
    stockText.textContent = `Apenas ${product.estoque} unidades disponíveis!`;
    stockStatus.className = 'modal-stock-status status-ultimas';
  } else {
    stockText.textContent = `Em estoque (${product.estoque} disponíveis)`;
    stockStatus.className = 'modal-stock-status status-disponivel';
  }

  // Tamanhos
  const sizesContainer = document.getElementById('modal-sizes-container');
  sizesContainer.innerHTML = '';
  const sizes = product.tamanhos && product.tamanhos.length > 0 ? product.tamanhos : ['Único'];
  selectedSize = sizes[0];
  document.getElementById('selected-size-label').textContent = selectedSize;

  sizes.forEach(size => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill-option ${size === selectedSize ? 'active' : ''}`;
    btn.textContent = size;
    btn.addEventListener('click', () => {
      selectedSize = size;
      document.getElementById('selected-size-label').textContent = size;
      sizesContainer.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      updateWhatsAppButton();
    });
    sizesContainer.appendChild(btn);
  });

  // Cores
  const colorsContainer = document.getElementById('modal-colors-container');
  colorsContainer.innerHTML = '';
  const colors = product.cores && product.cores.length > 0 ? product.cores : ['Padrão'];
  selectedColor = colors[0];
  document.getElementById('selected-color-label').textContent = selectedColor;

  colors.forEach(color => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pill-option ${color === selectedColor ? 'active' : ''}`;
    btn.textContent = color;
    btn.addEventListener('click', () => {
      selectedColor = color;
      document.getElementById('selected-color-label').textContent = color;
      colorsContainer.querySelectorAll('.pill-option').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      updateWhatsAppButton();
    });
    colorsContainer.appendChild(btn);
  });

  updateWhatsAppButton();

  // Exibe o modal
  modalElement.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function updateWhatsAppButton() {
  if (!currentProduct) return;
  const btn = document.getElementById('modal-whatsapp-btn');
  const url = generateProductWhatsAppUrl({
    product: currentProduct,
    selectedSize,
    selectedColor
  });
  btn.href = url;
}

export function closeProductModal() {
  if (!modalElement) return;
  modalElement.classList.add('hidden');
  document.body.classList.remove('modal-open');
  if (window.location.hash.startsWith('#produto-')) {
    window.history.pushState(null, null, ' ');
  }
}
