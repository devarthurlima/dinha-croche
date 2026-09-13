// src/services/productService.js
import { 
  db, 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  isConfigured 
} from '../config/firebase.js';

const LOCAL_STORAGE_PRODUCTS_KEY = 'dinha_products_catalog_v1';

// Seed inicial para o catálogo demonstrativo
const INITIAL_SEED_PRODUCTS = [
  {
    id: 'prod_croche_01',
    sku: 'CRP-001',
    nome: 'Cropped Rendado em Crochê Artesanal',
    descricao: 'Peça confeccionada 100% à mão em fio de algodão nobre. Acabamento delicado e amarração regulável nas costas para caimento perfeito.',
    categoria: 'Crochê',
    preco: 99.90,
    precoPromocional: 84.90,
    tamanhos: ['P', 'M', 'G'],
    cores: ['Colorido Boho', 'Terracota', 'Cru'],
    imagens: ['./imagens/croche2.webp'],
    estoque: 6,
    sobEncomenda: false,
    destaque: true,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: 'prod_croche_02',
    sku: 'SHT-002',
    nome: 'Short Feminino Praia & Verão em Crochê',
    descricao: 'Short artesanal vazado com cordão ajustável na cintura. Ideal para compor looks de praia, resort ou festivais.',
    categoria: 'Crochê',
    preco: 129.90,
    precoPromocional: 109.90,
    tamanhos: ['P', 'M', 'G'],
    cores: ['Off White', 'Areia', 'Preto'],
    imagens: ['./imagens/croche3.webp'],
    estoque: 4,
    sobEncomenda: false,
    destaque: true,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: 'prod_vestido_01',
    sku: 'VES-003',
    nome: 'Vestido Longo Fluido Floral Breeze',
    descricao: 'Vestido em viscose premium com decote suave e elástico sutil na cintura. Toque macio, forro interno e caimento elegante.',
    categoria: 'Vestidos',
    preco: 189.90,
    precoPromocional: 169.90,
    tamanhos: ['P', 'M', 'G', 'GG'],
    cores: ['Floral Rosê', 'Azul Serenity', 'Verde Oliva'],
    imagens: ['./imagens/novelo003.jpeg'],
    estoque: 8,
    sobEncomenda: false,
    destaque: true,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: 'prod_conjunto_01',
    sku: 'CNJ-004',
    nome: 'Conjunto Elegance Saia Midi & Top',
    descricao: 'Conjunto versátil que pode ser usado em conjunto ou separadamente. Tecido leve com textura rústica sofisticada.',
    categoria: 'Conjuntos',
    preco: 229.00,
    precoPromocional: 199.90,
    tamanhos: ['M', 'G'],
    cores: ['Cru Artesanal', 'Mostarda Suave'],
    imagens: ['./imagens/novelo01.jpeg'],
    estoque: 3,
    sobEncomenda: false,
    destaque: true,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: 'prod_acessorio_01',
    sku: 'BOL-005',
    nome: 'Bolsa Tote Bag Artesanal em Fio Náutico',
    descricao: 'Bolsa estruturada tecida manualmente com alça reforçada e fecho magnético interno. Resistente à água e ideal para o dia a dia.',
    categoria: 'Acessórios',
    preco: 139.90,
    precoPromocional: null,
    tamanhos: ['Único'],
    cores: ['Caramelo', 'Preto Noir', 'Terracota'],
    imagens: ['./imagens/novelo002.jpeg'],
    estoque: 5,
    sobEncomenda: false,
    destaque: false,
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  {
    id: 'prod_infantil_01',
    sku: 'INF-006',
    nome: 'Casaquinho Baby & Gorro Fofura',
    descricao: 'Conjuntinho infantil confeccionado com linha 100% antialérgica especial para bebês. Acompanha gorrinho delicado.',
    categoria: 'Infantil',
    preco: 89.90,
    precoPromocional: 74.90,
    tamanhos: ['0-3 meses', '3-6 meses', '6-12 meses'],
    cores: ['Amarelo Manteiga', 'Rosa Algodão', 'Azul Céu'],
    imagens: ['./imagens/novelo04.jpeg'],
    estoque: 7,
    sobEncomenda: true,
    destaque: false,
    ativo: true,
    criadoEm: new Date().toISOString()
  }
];

/**
 * Inicializa os produtos locais no localStorage caso não existam
 */
function getLocalProducts() {
  const data = localStorage.getItem(LOCAL_STORAGE_PRODUCTS_KEY);
  if (!data) {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_SEED_PRODUCTS));
    return INITIAL_SEED_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(INITIAL_SEED_PRODUCTS));
    return INITIAL_SEED_PRODUCTS;
  }
}

/**
 * Salva produtos locais no localStorage
 */
function saveLocalProducts(products) {
  localStorage.setItem(LOCAL_STORAGE_PRODUCTS_KEY, JSON.stringify(products));
}

/**
 * Busca produtos do Firestore ou da persistência local
 * @param {Object} options
 * @param {boolean} [options.includeInactive] - Se true, traz também itens inativos (para admin)
 * @param {string} [options.category] - Filtro de categoria
 * @returns {Promise<Array>}
 */
export async function getProducts({ includeInactive = false, category = 'all' } = {}) {
  if (isConfigured && db) {
    try {
      const prodCollection = collection(db, 'produtos');
      let q;

      if (!includeInactive) {
        if (category && category !== 'all') {
          q = query(prodCollection, where('ativo', '==', true), where('categoria', '==', category));
        } else {
          q = query(prodCollection, where('ativo', '==', true));
        }
      } else {
        if (category && category !== 'all') {
          q = query(prodCollection, where('categoria', '==', category));
        } else {
          q = query(prodCollection);
        }
      }

      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data()
      }));

      // Se o banco Firestore estiver vazio na primeira execução, devolve a lista local ou faz seed
      if (list.length === 0 && !includeInactive) {
        return getLocalProducts().filter(p => includeInactive || p.ativo);
      }
      return list;
    } catch (error) {
      console.warn('Erro ao consultar Firestore, utilizando fallback local:', error);
      return getLocalProducts().filter(p => (includeInactive ? true : p.ativo));
    }
  }

  // Fallback LocalStorage
  let list = getLocalProducts();
  if (!includeInactive) {
    list = list.filter(p => p.ativo);
  }
  if (category && category !== 'all') {
    list = list.filter(p => p.categoria.toLowerCase() === category.toLowerCase());
  }
  return list;
}

/**
 * Cria um novo produto
 * @param {Object} productData 
 * @returns {Promise<Object>}
 */
export async function createProduct(productData) {
  // Sanitização e validações obrigatórias
  const cleanData = {
    nome: String(productData.nome || '').trim(),
    sku: String(productData.sku || `SKU-${Date.now().toString().slice(-4)}`).trim(),
    descricao: String(productData.descricao || '').trim(),
    categoria: String(productData.categoria || 'Outros').trim(),
    preco: parseFloat(productData.preco) || 0,
    precoPromocional: productData.precoPromocional ? parseFloat(productData.precoPromocional) : null,
    tamanhos: Array.isArray(productData.tamanhos) ? productData.tamanhos : ['Único'],
    cores: Array.isArray(productData.cores) ? productData.cores : ['Padrão'],
    imagens: Array.isArray(productData.imagens) && productData.imagens.length > 0 
      ? productData.imagens 
      : ['./imagens/croche2.webp'],
    estoque: parseInt(productData.estoque, 10) || 0,
    sobEncomenda: Boolean(productData.sobEncomenda),
    destaque: Boolean(productData.destaque),
    ativo: productData.ativo !== false,
    criadoEm: new Date().toISOString()
  };

  if (isConfigured && db) {
    try {
      const docRef = await addDoc(collection(db, 'produtos'), {
        ...cleanData,
        criadoEm: serverTimestamp()
      });
      return { id: docRef.id, ...cleanData };
    } catch (error) {
      console.warn('Falha ao gravar no Firestore, salvando localmente:', error);
    }
  }

  // Fallback Local
  const localList = getLocalProducts();
  const newProduct = {
    id: `prod_${Date.now()}`,
    ...cleanData
  };
  localList.unshift(newProduct);
  saveLocalProducts(localList);
  return newProduct;
}

/**
 * Atualiza um produto existente
 * @param {string} productId 
 * @param {Object} productData 
 * @returns {Promise<void>}
 */
export async function updateProduct(productId, productData) {
  const updates = { ...productData };
  delete updates.id;

  if (updates.preco !== undefined) updates.preco = parseFloat(updates.preco);
  if (updates.precoPromocional !== undefined) {
    updates.precoPromocional = updates.precoPromocional ? parseFloat(updates.precoPromocional) : null;
  }
  if (updates.estoque !== undefined) updates.estoque = parseInt(updates.estoque, 10);
  updates.atualizadoEm = new Date().toISOString();

  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'produtos', productId);
      await updateDoc(docRef, {
        ...updates,
        atualizadoEm: serverTimestamp()
      });
      return;
    } catch (error) {
      console.warn('Falha ao atualizar no Firestore, atualizando localmente:', error);
    }
  }

  // Fallback Local
  const localList = getLocalProducts();
  const index = localList.findIndex(p => p.id === productId);
  if (index !== -1) {
    localList[index] = { ...localList[index], ...updates };
    saveLocalProducts(localList);
  }
}

/**
 * Exclui um produto
 * @param {string} productId 
 * @returns {Promise<void>}
 */
export async function deleteProduct(productId) {
  if (isConfigured && db) {
    try {
      const docRef = doc(db, 'produtos', productId);
      await deleteDoc(docRef);
      return;
    } catch (error) {
      console.warn('Falha ao excluir no Firestore, removendo localmente:', error);
    }
  }

  // Fallback Local
  const localList = getLocalProducts().filter(p => p.id !== productId);
  saveLocalProducts(localList);
}

/**
 * Alterna visibilidade do produto (Ativo / Inativo)
 * @param {string} productId 
 * @param {boolean} currentStatus 
 * @returns {Promise<boolean>} Novo status
 */
export async function toggleProductStatus(productId, currentStatus) {
  const newStatus = !currentStatus;
  await updateProduct(productId, { ativo: newStatus });
  return newStatus;
}
