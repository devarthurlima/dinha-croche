# 🧶 Dinha Crochê & Moda — Vitrine Virtual & Gestão de Estoque

> Vitrine virtual moderna para loja de roupas artesanais e crochê, com catálogo interativo, finalização de pedidos direta pelo WhatsApp, painel administrativo (CRUD de estoque) e backend na nuvem com **Firebase**.

---

## ✨ Principais Funcionalidades

### 🛍️ Vitrine Virtual Pública (Catálogo de Roupas)
- **Layout Boutique & Mobile-First:** Design responsivo fluido construído com CSS Grid e variáveis de design tokens, adaptando-se perfeitamente de smartphones (320px) a telas 4K.
- **Filtros por Categoria:** Navegação dinâmica por peças (*Todas, Crochê, Vestidos, Conjuntos, Acessórios, Infantil*) com contadores atualizados em tempo real.
- **Filtro de Tamanhos & Ordenação:** Seleção por tamanho (*PP, P, M, G, GG, Plus, Único*) e ordenação por *Destaques*, *Menor Preço*, *Maior Preço* e *Mais Recentes*.
- **Busca Instantânea:** Pesquisa em tempo real por nome da peça, código SKU ou descrição.
- **Badges de Status:** Destaques visuais para *"Promoção (-%)"*, *"Sob Encomenda"*, *"Últimas Peças"*, *"Esgotado"* e *"Destaque"*.

### 📲 Vendas & Checkout via WhatsApp
- **Modal de Detalhes da Peça:** Galeria de fotos em alta resolução, guia de modelagem/tecido e **seletores interativos de Tamanho e Cor**.
- **Mensagem Pré-Formatada Automática:** O botão *"Comprar pelo WhatsApp"* gera uma URL inteligente com os dados da compra preenchidos para a vendedora:
  ```text
  Olá! Estava navegando na vitrine da Dinha Crochê & Moda e gostaria de fechar meu pedido dessa peça:
  
  ✨ Produto: Vestido Longo Fluido Floral Breeze (Ref: #VES-003)
  💰 Valor: R$ 169,90 (De R$ 189,90)
  📏 Tamanho: M
  🎨 Cor: Verde Oliva
  
  🔗 Link do produto: https://.../#produto-prod_vestido_01
  
  Gostaria de saber se está disponível para envio e como calculamos o frete!
  ```
- **Botão Flutuante de Atendimento:** Canal direto no canto inferior direito para suporte geral e dúvidas de encomendas.

### 🔐 Painel Administrativo & CRUD de Estoque
- **Autenticação Segura:** Protegido via **Firebase Authentication** com sessão persistente (e modo de demonstração local para testes imediatos: `admin@loja.com` / `admin123`).
- **Dashboard com Métricas:** Indicadores de *Total de Peças Cadastradas*, *Peças em Estoque* e *Peças Esgotadas*.
- **Controle de Estoque:** Tabela com busca interna, alteração de quantidade e botão de alternância rápida de visibilidade (*Visível na Vitrine* vs *Oculto*).
- **Cadastro e Edição Completa:** Formulário para nome, SKU, categoria com sugestões (*datalist*), preços, tamanhos múltiplos, cores, descrição e tags.
- **Upload de Fotos com Otimização:** Comprime e converte as imagens para o formato moderno **WebP** no próprio navegador antes de enviá-las ao **Firebase Storage**, acelerando o carregamento da vitrine (LCP) e reduzindo custos.

---

## 🛡️ Camadas de Segurança Implementadas

1. **Regras de Segurança do Cloud Firestore ([firestore.rules](file:///home/drianodev/Documents/projects/dinha-croche/firestore.rules)):**
   - Visitantes anônimos só têm permissão para ler peças com `ativo == true`.
   - Operações de escrita (`create`, `update`, `delete`) são restritas unicamente a administradores autenticados e com e-mail verificado.
   - Validação de tipagem e tamanho de campos (`is string`, `is number`, `size() <= 120`) e limites em arrays para mitigar ataques de Resource Exhaustion / DoS.
2. **Regras de Segurança do Firebase Storage ([storage.rules](file:///home/drianodev/Documents/projects/dinha-croche/storage.rules)):**
   - Leitura pública das fotos dos produtos.
   - Upload e exclusão restritos a administradores autenticados.
   - Validação estrita de formato MIME (`image/(jpeg|jpg|png|webp)`) e limite de 5MB por arquivo.
3. **Segurança no Frontend:**
   - Sanitização de dados contra injeção de scripts (XSS).
   - Codificação de URLs com `encodeURIComponent()` para parâmetros de links do WhatsApp.

---

## 🚀 Otimizações de SEO & Acessibilidade

- **Meta Tags Completas:** `description`, `keywords`, `author`, `robots` e tag canônica.
- **Open Graph & Twitter Cards:** Miniaturas e resumos ricos ao compartilhar páginas ou produtos no WhatsApp, Instagram e Facebook.
- **Dados Estruturados JSON-LD:** Implementação do schema Schema.org `ClothingStore` e `OfferCatalog` para rich snippets no Google.
- **Acessibilidade (WCAG):** Áreas de clique (touch targets) com no mínimo 44–48px, atributos `aria-label` em botões de ação e navegação via teclado.

---

## 📁 Estrutura de Arquivos

```text
dinha-croche/
├── index.html                   # Estrutura HTML5 com SEO, Open Graph e JSON-LD
├── style.css                    # Design System completo (variáveis CSS, Grid fluido e modais)
├── package.json                 # Dependências e scripts de desenvolvimento
├── .gitignore                   # Arquivos e pastas ignorados pelo Git
├── firestore.rules              # Regras de segurança do Cloud Firestore
├── storage.rules                # Regras de segurança do Firebase Storage
├── firebase.json                # Configuração do Firebase Hosting e rewrites SPA
├── .env.example                 # Exemplo das variáveis de ambiente do Firebase
├── imagens/                     # Ativos estáticos e fotos originais da loja
└── src/
    ├── config/
    │   └── firebase.js          # Inicialização modular do Firebase (com modo demo)
    ├── services/
    │   ├── productService.js    # CRUD de produtos (Firestore + persistência local)
    │   ├── authService.js       # Autenticação de admin (Firebase Auth + demo)
    │   ├── storageService.js    # Upload e compressão de fotos no navegador
    │   └── whatsappService.js   # Geração dinâmica das mensagens do WhatsApp
    ├── components/
    │   ├── toast.js             # Notificações visuais flutuantes
    │   ├── productGrid.js       # Grid e cards responsivos de produtos
    │   ├── productModal.js      # Modal de detalhes com seletores de tamanho e cor
    │   └── adminModal.js        # Painel administrativo com dashboard e CRUD
    └── app.js                   # Orquestrador principal da vitrine
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend Core:** HTML5 Semântico, Vanilla JavaScript (ES Modules) e Vanilla CSS com Design Tokens.
- **Build Tool:** [Vite](https://vitejs.dev/) (Hot Module Replacement ultrarrápido e bundling otimizado).
- **Backend & Cloud (BaaS):**
  - **Firebase Authentication:** Gestão de acesso administrativo.
  - **Cloud Firestore:** Banco de dados NoSQL em tempo real para catálogo e estoque.
  - **Firebase Storage:** Armazenamento em nuvem de fotos de produtos.
  - **Firebase Hosting:** Hospedagem com CDN global e SSL automático.
- **Tipografia:** Google Fonts (*Playfair Display* e *Outfit*).

---

## 💻 Como Executar Localmente

### 1. Clonar o repositório e instalar as dependências
```bash
git clone https://github.com/devarthurlima/dinha-croche.git
cd dinha-croche
npm install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
O projeto estará acessível em: `http://localhost:5173/`

### 3. Testar o Painel Administrativo
- Clique em **"🔒 Área da Lojista"** no topo da página.
- Para testes locais imediatos (modo de demonstração), utilize:
  - **E-mail:** `admin@loja.com`
  - **Senha:** `admin123`

---

## 🔥 Conectando ao seu Projeto Oficial do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative os serviços: **Authentication** (Email/Password), **Firestore Database**, **Storage** e **Hosting**.
3. Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
4. Preencha as credenciais do seu projeto Firebase e o telefone comercial do WhatsApp:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
   VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000
   VITE_WHATSAPP_NUMBER=5511999999999
   VITE_STORE_NAME=Dinha Crochê & Moda
   ```
5. Para publicar em produção no Firebase Hosting:
   ```bash
   npm run build
   npx firebase deploy
   ```

---

## 📄 Licença

Este projeto foi desenvolvido para a vitrine e catálogo da **Dinha Crochê & Moda**. Todos os direitos reservados.
