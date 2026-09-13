// src/components/adminModal.js
import { 
  loginAdmin, 
  logoutAdmin, 
  subscribeAuthState, 
  getCurrentAdmin 
} from '../services/authService.js';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleProductStatus 
} from '../services/productService.js';
import { uploadProductImage } from '../services/storageService.js';
import { formatCurrency } from '../services/whatsappService.js';
import { showToast } from './toast.js';

let adminModalElement = null;
let currentAdminUser = null;
let editingProductId = null;
let onProductsChangedCallback = null;

export function initAdminModal(onProductsChanged) {
  onProductsChangedCallback = onProductsChanged;

  if (adminModalElement) return;

  adminModalElement = document.createElement('div');
  adminModalElement.id = 'admin-modal';
  adminModalElement.className = 'modal-backdrop hidden';
  adminModalElement.setAttribute('role', 'dialog');
  adminModalElement.setAttribute('aria-modal', 'true');

  adminModalElement.innerHTML = `
    <div class="modal-dialog admin-modal-dialog">
      <button class="modal-close-btn" id="admin-close-btn" aria-label="Fechar painel">&times;</button>
      <div id="admin-modal-body"></div>
    </div>
  `;

  document.body.appendChild(adminModalElement);

  adminModalElement.querySelector('#admin-close-btn').addEventListener('click', closeAdminModal);
  adminModalElement.addEventListener('click', (e) => {
    if (e.target === adminModalElement) closeAdminModal();
  });

  // Observa o estado de autenticação
  subscribeAuthState((user) => {
    currentAdminUser = user;
    if (!adminModalElement.classList.contains('hidden')) {
      renderAdminView();
    }
  });
}

export function openAdminModal() {
  if (!adminModalElement) initAdminModal();
  adminModalElement.classList.remove('hidden');
  document.body.classList.add('modal-open');
  renderAdminView();
}

export function closeAdminModal() {
  if (!adminModalElement) return;
  adminModalElement.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function renderAdminView() {
  const container = document.getElementById('admin-modal-body');
  if (!container) return;

  if (!currentAdminUser) {
    renderLoginForm(container);
  } else {
    renderDashboard(container);
  }
}

// ----------------------------------------------------
// TELA DE LOGIN DO ADMINISTRADOR
// ----------------------------------------------------
function renderLoginForm(container) {
  container.innerHTML = `
    <div class="admin-login-view">
      <div class="login-header">
        <div class="login-icon">🔐</div>
        <h2>Acesso da Lojista</h2>
        <p>Gerencie produtos, fotos e controle de estoque em tempo real.</p>
      </div>

      <form id="admin-login-form" class="admin-form">
        <div class="form-group">
          <label for="admin-email">E-mail de Acesso</label>
          <input 
            type="email" 
            id="admin-email" 
            required 
            placeholder="ex: dinha@loja.com" 
            value="admin@loja.com"
            autocomplete="email"
          />
        </div>

        <div class="form-group">
          <label for="admin-password">Senha</label>
          <input 
            type="password" 
            id="admin-password" 
            required 
            placeholder="Sua senha secreta" 
            value="admin123"
            autocomplete="current-password"
          />
        </div>

        <div class="login-hint">
          <span>💡 <strong>Dica de Demonstração:</strong> Use <code>admin@loja.com</code> e senha <code>admin123</code> para testar imediatamente.</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block btn-large" id="btn-submit-login">
          <span>Entrar no Painel</span>
        </button>
      </form>
    </div>
  `;

  const form = container.querySelector('#admin-login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim();
    const password = document.getElementById('admin-password').value;
    const btn = document.getElementById('btn-submit-login');

    try {
      btn.disabled = true;
      const res = await loginAdmin(email, password);
      currentAdminUser = res.user;
      showToast('Bem-vinda ao painel administrativo!', 'success');
      renderAdminView();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span>Entrar no Painel</span>';
    }
  });
}

// ----------------------------------------------------
// DASHBOARD ADMINISTRATIVO & LISTA DE PRODUTOS
// ----------------------------------------------------
async function renderDashboard(container) {
  container.innerHTML = `
    <div class="admin-dashboard-view">
      <header class="dashboard-topbar">
        <div class="dashboard-user">
          <span class="user-badge">Admin</span>
          <span class="user-email">${escapeHtml(currentAdminUser.email || 'Administradora')}</span>
        </div>
        <div class="dashboard-actions">
          <button class="btn btn-primary" id="btn-new-product">
            ➕ Novo Produto
          </button>
          <button class="btn btn-secondary btn-outline" id="btn-logout">
            Sair
          </button>
        </div>
      </header>

      <div class="dashboard-stats" id="dashboard-stats">
        <div class="stat-card">
          <span class="stat-num" id="stat-total">-</span>
          <span class="stat-label">Total de Peças</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" id="stat-in-stock">-</span>
          <span class="stat-label">Em Estoque</span>
        </div>
        <div class="stat-card">
          <span class="stat-num" id="stat-out">-</span>
          <span class="stat-label">Esgotados</span>
        </div>
      </div>

      <div class="dashboard-list-header">
        <h3>Estoque & Catálogo</h3>
        <input 
          type="text" 
          id="admin-search-input" 
          placeholder="Buscar produto por nome ou SKU..." 
          class="admin-search-box"
        />
      </div>

      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Peça</th>
              <th>Categoria</th>
              <th>Preço</th>
              <th>Estoque</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody id="admin-products-tbody">
            <tr><td colspan="6" class="text-center">Carregando catálogo...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Eventos de topo
  container.querySelector('#btn-logout').addEventListener('click', async () => {
    await logoutAdmin();
    currentAdminUser = null;
    showToast('Sessão encerrada.', 'info');
    renderAdminView();
  });

  container.querySelector('#btn-new-product').addEventListener('click', () => {
    renderProductForm(container, null);
  });

  // Carrega lista de produtos
  await loadAndRenderProductsTable(container);
}

async function loadAndRenderProductsTable(container) {
  const tbody = container.querySelector('#admin-products-tbody');
  const searchInput = container.querySelector('#admin-search-input');
  
  const allProducts = await getProducts({ includeInactive: true });

  // Atualiza métricas
  const total = allProducts.length;
  const inStock = allProducts.filter(p => (p.estoque > 0 || p.sobEncomenda) && p.ativo).length;
  const outOfStock = allProducts.filter(p => p.estoque <= 0 && !p.sobEncomenda).length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-in-stock').textContent = inStock;
  document.getElementById('stat-out').textContent = outOfStock;

  const renderRows = (items) => {
    tbody.innerHTML = '';
    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Nenhum produto cadastrado.</td></tr>`;
      return;
    }

    items.forEach(prod => {
      const tr = document.createElement('tr');
      const img = prod.imagens && prod.imagens.length > 0 ? prod.imagens[0] : './imagens/croche2.webp';
      
      const priceStr = prod.precoPromocional && prod.precoPromocional < prod.preco
        ? `${formatCurrency(prod.precoPromocional)} <small class="text-muted"><del>${formatCurrency(prod.preco)}</del></small>`
        : formatCurrency(prod.preco);

      tr.innerHTML = `
        <td class="cell-product">
          <img src="${img}" alt="" class="table-thumb" />
          <div>
            <strong class="product-name-txt">${escapeHtml(prod.nome)}</strong>
            <span class="product-sku-txt">${prod.sku ? '#' + escapeHtml(prod.sku) : ''}</span>
          </div>
        </td>
        <td><span class="tag-pill">${escapeHtml(prod.categoria || 'Moda')}</span></td>
        <td>${priceStr}</td>
        <td>
          <span class="stock-badge ${prod.estoque > 0 ? 'stock-ok' : 'stock-zero'}">
            ${prod.sobEncomenda ? 'Encomenda' : prod.estoque + ' un'}
          </span>
        </td>
        <td>
          <button class="btn-status-toggle ${prod.ativo ? 'status-active' : 'status-inactive'}" title="Clique para alternar">
            ${prod.ativo ? '✓ Visível' : '✕ Oculto'}
          </button>
        </td>
        <td class="cell-actions">
          <button class="btn-icon btn-edit" title="Editar Produto">✏️</button>
          <button class="btn-icon btn-delete" title="Excluir Produto">🗑️</button>
        </td>
      `;

      // Alternar Visibilidade
      tr.querySelector('.btn-status-toggle').addEventListener('click', async () => {
        const newStatus = await toggleProductStatus(prod.id, prod.ativo);
        prod.ativo = newStatus;
        showToast(`Produto ${newStatus ? 'visível na vitrine' : 'ocultado'}.`, 'info');
        if (onProductsChangedCallback) onProductsChangedCallback();
        renderRows(items);
      });

      // Editar
      tr.querySelector('.btn-edit').addEventListener('click', () => {
        renderProductForm(container, prod);
      });

      // Excluir
      tr.querySelector('.btn-delete').addEventListener('click', async () => {
        if (confirm(`Tem certeza que deseja excluir permanentemente "${prod.nome}"?`)) {
          await deleteProduct(prod.id);
          showToast('Produto excluído com sucesso.', 'success');
          if (onProductsChangedCallback) onProductsChangedCallback();
          await loadAndRenderProductsTable(container);
        }
      });

      tbody.appendChild(tr);
    });
  };

  renderRows(allProducts);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = allProducts.filter(p => 
        p.nome.toLowerCase().includes(term) || 
        (p.sku && p.sku.toLowerCase().includes(term)) ||
        (p.categoria && p.categoria.toLowerCase().includes(term))
      );
      renderRows(filtered);
    });
  }
}

// ----------------------------------------------------
// FORMULÁRIO DE CADASTRO / EDIÇÃO DE PRODUTO
// ----------------------------------------------------
function renderProductForm(container, product) {
  const isEditing = Boolean(product && product.id);
  editingProductId = isEditing ? product.id : null;

  const currentSizes = (product && product.tamanhos) || ['P', 'M', 'G'];
  const allCommonSizes = ['PP', 'P', 'M', 'G', 'GG', 'Plus', 'Único'];
  const currentImages = (product && product.imagens) || [];

  container.innerHTML = `
    <div class="admin-product-form-view">
      <div class="form-header">
        <button class="btn btn-secondary btn-sm" id="btn-back-to-list">← Voltar</button>
        <h3>${isEditing ? 'Editar Peça' : 'Cadastrar Nova Peça'}</h3>
      </div>

      <form id="product-crud-form" class="admin-form">
        <div class="form-grid-2">
          <div class="form-group">
            <label for="field-nome">Nome da Peça *</label>
            <input 
              type="text" 
              id="field-nome" 
              required 
              maxlength="120" 
              placeholder="Ex: Vestido Midi Floral Romântico" 
              value="${isEditing ? escapeHtml(product.nome) : ''}"
            />
          </div>

          <div class="form-group">
            <label for="field-sku">Código SKU / Referência</label>
            <input 
              type="text" 
              id="field-sku" 
              maxlength="30" 
              placeholder="Ex: VES-042" 
              value="${isEditing ? escapeHtml(product.sku || '') : ''}"
            />
          </div>
        </div>

        <div class="form-grid-3">
          <div class="form-group">
            <label for="field-categoria">Categoria *</label>
            <input 
              type="text" 
              id="field-categoria" 
              list="categories-list" 
              required 
              placeholder="Ex: Vestidos, Crochê..." 
              value="${isEditing ? escapeHtml(product.categoria || '') : 'Vestidos'}"
            />
            <datalist id="categories-list">
              <option value="Crochê"></option>
              <option value="Vestidos"></option>
              <option value="Conjuntos"></option>
              <option value="Blusas & Tops"></option>
              <option value="Saias & Shorts"></option>
              <option value="Acessórios"></option>
              <option value="Infantil"></option>
            </datalist>
          </div>

          <div class="form-group">
            <label for="field-preco">Preço de Venda (R$) *</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              id="field-preco" 
              required 
              placeholder="129.90" 
              value="${isEditing ? product.preco : ''}"
            />
          </div>

          <div class="form-group">
            <label for="field-preco-promo">Preço Promocional (R$)</label>
            <input 
              type="number" 
              step="0.01" 
              min="0" 
              id="field-preco-promo" 
              placeholder="Opcional" 
              value="${isEditing && product.precoPromocional ? product.precoPromocional : ''}"
            />
          </div>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label for="field-estoque">Quantidade em Estoque</label>
            <input 
              type="number" 
              id="field-estoque" 
              min="0" 
              value="${isEditing ? (product.estoque || 0) : 5}"
            />
          </div>

          <div class="form-group">
            <label for="field-cores">Cores Disponíveis (separadas por vírgula)</label>
            <input 
              type="text" 
              id="field-cores" 
              placeholder="Ex: Terracota, Verde Oliva, Cru" 
              value="${isEditing && product.cores ? escapeHtml(product.cores.join(', ')) : 'Terracota, Off White'}"
            />
          </div>
        </div>

        <!-- Grade de Tamanhos -->
        <div class="form-group">
          <label>Tamanhos Disponíveis:</label>
          <div class="checkbox-pills" id="sizes-selector">
            ${allCommonSizes.map(sz => `
              <label class="checkbox-pill-label">
                <input type="checkbox" name="sizes" value="${sz}" ${currentSizes.includes(sz) ? 'checked' : ''} />
                <span>${sz}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="form-group">
          <label for="field-descricao">Descrição da Peça & Tecido</label>
          <textarea 
            id="field-descricao" 
            rows="3" 
            placeholder="Detalhes sobre modelagem, tecido, cuidados e caimento..."
          >${isEditing ? escapeHtml(product.descricao || '') : ''}</textarea>
        </div>

        <!-- Upload de Imagem -->
        <div class="form-group">
          <label>Fotos da Peça (WebP, JPG, PNG - máx 5MB)</label>
          <div class="image-uploader-dropzone" id="dropzone">
            <input type="file" id="field-file-upload" accept="image/png, image/jpeg, image/webp" class="file-input-hidden" />
            <div class="dropzone-content">
              <span>📷 Clique para selecionar ou arraste uma foto</span>
              <small>A imagem é comprimida automaticamente para máxima velocidade</small>
            </div>
          </div>
          <div class="uploaded-previews" id="previews-container">
            ${currentImages.map((src, i) => `
              <div class="preview-item">
                <img src="${src}" alt="preview ${i}" />
                <button type="button" class="btn-remove-img" data-index="${i}">&times;</button>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Opções adicionais / Toggles -->
        <div class="form-toggles">
          <label class="toggle-label">
            <input type="checkbox" id="field-ativo" ${(!isEditing || product.ativo !== false) ? 'checked' : ''} />
            <span>Produto Ativo (Visível na Vitrine)</span>
          </label>

          <label class="toggle-label">
            <input type="checkbox" id="field-destaque" ${product && product.destaque ? 'checked' : ''} />
            <span>Exibir em Destaque na Página Inicial</span>
          </label>

          <label class="toggle-label">
            <input type="checkbox" id="field-encomenda" ${product && product.sobEncomenda ? 'checked' : ''} />
            <span>Produção Sob Encomenda</span>
          </label>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" id="btn-cancel-form">Cancelar</button>
          <button type="submit" class="btn btn-primary btn-large" id="btn-save-product">
            <span>💾 Salvar Peça</span>
          </button>
        </div>
      </form>
    </div>
  `;

  // Controle de Fotos
  let formImages = [...currentImages];
  const previewsContainer = container.querySelector('#previews-container');
  const fileInput = container.querySelector('#field-file-upload');
  const dropzone = container.querySelector('#dropzone');

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast('Comprimindo e enviando foto...', 'info', 2000);
      const url = await uploadProductImage(file, isEditing ? product.id : 'novo');
      formImages.push(url);
      updatePreviews();
      showToast('Foto adicionada com sucesso!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  function updatePreviews() {
    previewsContainer.innerHTML = formImages.map((src, i) => `
      <div class="preview-item">
        <img src="${src}" alt="preview ${i}" />
        <button type="button" class="btn-remove-img" data-index="${i}">&times;</button>
      </div>
    `).join('');

    previewsContainer.querySelectorAll('.btn-remove-img').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        formImages.splice(idx, 1);
        updatePreviews();
      });
    });
  }

  updatePreviews();

  // Voltar / Cancelar
  const goBack = () => renderDashboard(container);
  container.querySelector('#btn-back-to-list').addEventListener('click', goBack);
  container.querySelector('#btn-cancel-form').addEventListener('click', goBack);

  // Submissão
  const form = container.querySelector('#product-crud-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const selectedSizes = Array.from(container.querySelectorAll('#sizes-selector input:checked'))
      .map(input => input.value);

    const colors = document.getElementById('field-cores').value
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const productPayload = {
      nome: document.getElementById('field-nome').value.trim(),
      sku: document.getElementById('field-sku').value.trim(),
      categoria: document.getElementById('field-categoria').value.trim(),
      preco: parseFloat(document.getElementById('field-preco').value),
      precoPromocional: document.getElementById('field-preco-promo').value 
        ? parseFloat(document.getElementById('field-preco-promo').value) 
        : null,
      estoque: parseInt(document.getElementById('field-estoque').value, 10) || 0,
      tamanhos: selectedSizes.length > 0 ? selectedSizes : ['Único'],
      cores: colors.length > 0 ? colors : ['Padrão'],
      descricao: document.getElementById('field-descricao').value.trim(),
      imagens: formImages.length > 0 ? formImages : ['./imagens/croche2.webp'],
      ativo: document.getElementById('field-ativo').checked,
      destaque: document.getElementById('field-destaque').checked,
      sobEncomenda: document.getElementById('field-encomenda').checked
    };

    const submitBtn = document.getElementById('btn-save-product');
    try {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Salvando dados...</span>';

      if (isEditing) {
        await updateProduct(product.id, productPayload);
        showToast('Peça atualizada com sucesso!', 'success');
      } else {
        await createProduct(productPayload);
        showToast('Nova peça cadastrada com sucesso!', 'success');
      }

      if (onProductsChangedCallback) onProductsChangedCallback();
      renderDashboard(container);
    } catch (err) {
      showToast('Erro ao salvar: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>💾 Salvar Peça</span>';
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
