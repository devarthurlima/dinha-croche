// src/services/whatsappService.js

/**
 * Remove caracteres não numéricos de um telefone
 * @param {string} phone 
 * @returns {string} Telefone limpo (ex: 5511987654321)
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '5511999999999';
  return phone.replace(/\D/g, '');
}

/**
 * Formata um valor numérico em Real Brasileiro (BRL)
 * @param {number} value 
 * @returns {string} Ex: "R$ 149,90"
 */
export function formatCurrency(value) {
  if (typeof value !== 'number' || isNaN(value)) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Gera o link seguro do WhatsApp com mensagem pré-formatada para um produto específico
 * @param {Object} params
 * @param {string} params.phone - Telefone da loja
 * @param {Object} params.product - Objeto do produto
 * @param {string} [params.selectedSize] - Tamanho selecionado
 * @param {string} [params.selectedColor] - Cor selecionada
 * @returns {string} URL pronta para abertura no WhatsApp
 */
export function generateProductWhatsAppUrl({ phone, product, selectedSize, selectedColor }) {
  const storePhone = cleanPhoneNumber(phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999');
  
  const priceToDisplay = product.precoPromocional && product.precoPromocional < product.preco
    ? `${formatCurrency(product.precoPromocional)} (De ${formatCurrency(product.preco)})`
    : formatCurrency(product.preco);

  const sku = product.sku ? `(Ref: #${product.sku})` : '';
  const sizeText = selectedSize ? `\n📏 *Tamanho:* ${selectedSize}` : '';
  const colorText = selectedColor ? `\n🎨 *Cor:* ${selectedColor}` : '';
  
  const currentUrl = typeof window !== 'undefined' ? window.location.href.split('#')[0] : '';
  const productLink = `${currentUrl}#produto-${product.id}`;

  const messageLines = [
    `Olá! Estava navegando na vitrine da *${import.meta.env.VITE_STORE_NAME || 'Dinha Crochê & Moda'}* e gostaria de fechar meu pedido dessa peça:`,
    ``,
    `✨ *Produto:* ${product.nome} ${sku}`,
    `💰 *Valor:* ${priceToDisplay}${sizeText}${colorText}`,
    ``,
    `🔗 *Link do produto:* ${productLink}`,
    ``,
    `Gostaria de saber se está disponível para envio e como calculamos o frete!`
  ];

  const fullMessage = messageLines.join('\n');
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(fullMessage)}`;
}

/**
 * Gera o link seguro do WhatsApp para atendimento geral
 * @param {string} [phone] 
 * @returns {string} URL de contato direto
 */
export function generateGeneralWhatsAppUrl(phone) {
  const storePhone = cleanPhoneNumber(phone || import.meta.env.VITE_WHATSAPP_NUMBER || '5511999999999');
  const message = `Olá! Gostaria de tirar uma dúvida sobre as peças e encomendas da ${import.meta.env.VITE_STORE_NAME || 'Dinha Crochê & Moda'}.`;
  return `https://wa.me/${storePhone}?text=${encodeURIComponent(message)}`;
}
