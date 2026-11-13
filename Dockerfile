# ==========================================
# Estágio 1: Build da Aplicação
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Instala dependências
COPY package.json package-lock.json* ./
RUN npm install

# Copia código-fonte e configurações
COPY tsconfig.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src/ ./src/
COPY backend/ ./backend/

# Executa o build do frontend e backend
RUN npm run build

# ==========================================
# Estágio 2: Imagem Final de Produção (Runner)
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia apenas dependências essenciais de produção
COPY package.json package-lock.json* ./
RUN npm install --only=production

# Copia os artefatos compilados
COPY --from=builder /app/dist ./dist

# Usuário não-root para segurança
USER node

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
