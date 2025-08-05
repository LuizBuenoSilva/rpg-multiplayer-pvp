# 🚀 Guia de Hospedagem Gratuita - RPG Multiplayer

## Opção 1: Render.com (Recomendado)

### Pré-requisitos
1. Conta no GitHub
2. Conta no Render (gratuita)

### Passo 1: Preparar o Código

1. **Crie um repositório no GitHub**
   - Vá para [GitHub](https://github.com)
   - Clique em "New repository"
   - Nome: `rpg-multiplayer-pvp`
   - Marque como "Public"
   - Clique em "Create repository"

2. **Faça upload dos arquivos**
   - Clique em "uploading an existing file"
   - Arraste todos os arquivos do projeto:
     - `index.html`
     - `style.css`
     - `script.js`
     - `server.js`
     - `package.json`
     - `package-lock.json`
     - `README.md`
   - Commit: "Initial commit - RPG Multiplayer"

### Passo 2: Deploy no Render

1. **Acesse o Render**
   - Vá para [render.com](https://render.com)
   - Clique em "Get Started for Free"
   - Faça login com sua conta GitHub

2. **Crie um Web Service**
   - No dashboard, clique em "New +"
   - Selecione "Web Service"
   - Conecte seu repositório GitHub
   - Selecione o repositório `rpg-multiplayer-pvp`

3. **Configure o Serviço**
   ```
   Name: rpg-multiplayer
   Environment: Node
   Region: Oregon (US West) ou Frankfurt (Europe)
   Branch: main
   Build Command: npm install
   Start Command: npm start
   Instance Type: Free
   ```

4. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o build (3-5 minutos)
   - Sua URL será: `https://rpg-multiplayer-XXXX.onrender.com`

### Passo 3: Testar

1. **Acesse sua URL**
2. **Teste o modo solo**
3. **Teste o multiplayer**:
   - Abra em duas abas
   - Crie uma sala em uma aba
   - Entre na sala com o código na outra aba

---

## Opção 2: Railway.app

### Passo 1: Preparar o GitHub (mesmo da Opção 1)

### Passo 2: Deploy no Railway

1. **Acesse o Railway**
   - Vá para [railway.app](https://railway.app)
   - Clique em "Start a New Project"
   - Faça login com GitHub

2. **Deploy from GitHub**
   - Clique em "Deploy from GitHub repo"
   - Selecione `rpg-multiplayer-pvp`
   - Railway detectará automaticamente o Node.js

3. **Configurar (Automático)**
   - Railway configurará automaticamente
   - Build Command: `npm install`
   - Start Command: `npm start`

4. **Obter URL**
   - Vá em "Settings" → "Domains"
   - Clique em "Generate Domain"
   - Sua URL será: `https://seu-projeto.up.railway.app`

---

## Opção 3: Vercel (Para Frontend + Backend Separado)

### Para o Frontend

1. **Crie `vercel.json`**
```json
{
  "functions": {
    "server.js": {
      "runtime": "nodejs18.x"
    }
  },
  "routes": [
    { "src": "/socket.io/(.*)", "dest": "/server.js" },
    { "src": "/(.*)", "dest": "/server.js" }
  ]
}
```

2. **Deploy**
   - Instale Vercel CLI: `npm i -g vercel`
   - Execute: `vercel`
   - Siga as instruções

---

## 🔧 Solução de Problemas

### Erro de Build
```bash
# Se der erro de dependências
npm install --production
```

### Erro de Porta
```javascript
// No server.js, certifique-se que tem:
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
```

### WebSocket não Conecta
```javascript
// No script.js, use:
const socket = io(window.location.origin);
// Em vez de:
// const socket = io('http://localhost:3000');
```

---

## 📱 Compartilhar com Amigos

1. **Copie sua URL de produção**
2. **Compartilhe no WhatsApp/Discord**:
   ```
   🎮 Vamos jogar RPG Multiplayer!
   
   Link: https://seu-jogo.onrender.com
   
   Como jogar:
   1. Digite seu nome
   2. Eu vou criar uma sala
   3. Entrem com o código que eu mandar
   4. Vamos batalhar! ⚔️
   ```

3. **Crie uma sala e compartilhe o código**

---

## 💡 Dicas Importantes

### Performance
- **Render Free**: Pode "dormir" após 15min sem uso
- **Railway Free**: 500h/mês de uso
- **Primeira conexão**: Pode demorar 30s para "acordar"

### Limites Gratuitos
- **Render**: 750h/mês
- **Railway**: 500h/mês  
- **Vercel**: Sem limite de tempo, mas com limites de execução

### Melhor Performance
- Use **Render** para estabilidade
- Use **Railway** para deploy mais rápido
- Use **Vercel** se já usa para outros projetos

---

## 🎯 Próximos Passos

1. **Hospede o jogo**
2. **Teste com amigos**
3. **Compartilhe a diversão!**

**Boa sorte e divirtam-se! 🎮⚔️**