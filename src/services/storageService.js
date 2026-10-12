// src/services/storageService.js
import { storage, ref, uploadBytes, getDownloadURL, isConfigured } from '../config/firebase.js';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Redimensiona e comprime uma imagem usando Canvas no navegador para otimizar velocidade e custos
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} maxHeight 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao comprimir imagem.'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Converte um Blob ou File para string Base64 (usado em modo offline/demo)
 * @param {Blob|File} blob 
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Valida e faz upload de imagem para o Firebase Storage ou armazena localmente em modo demo
 * @param {File} file 
 * @param {string} productId 
 * @returns {Promise<string>} URL pública da imagem
 */
export async function uploadProductImage(file, productId = 'temp') {
  // Validações de segurança no cliente
  if (!file) {
    throw new Error('Nenhum arquivo selecionado.');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Formato inválido! Envie imagens JPG, PNG ou WEBP.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('Tamanho excessivo! A imagem deve ter no máximo 5MB.');
  }

  // Comprime a imagem antes do envio para economizar banda e acelerar LCP
  const compressedBlob = await compressImage(file);

  // Se o Firebase estiver ativo e configurado com storage
  if (isConfigured && storage) {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const storagePath = `produtos/${productId}/${Date.now()}_${cleanFileName}.webp`;
    const storageReference = ref(storage, storagePath);

    const snapshot = await uploadBytes(storageReference, compressedBlob, {
      contentType: 'image/webp'
    });

    return await getDownloadURL(snapshot.ref);
  }

  // Fallback: modo demonstração salva base64 no navegador
  return await blobToBase64(compressedBlob);
}
