# RPG Multiplayer PvP

Um jogo RPG multiplayer em tempo real com sistema PvP, desenvolvido com HTML5 Canvas, Node.js e Socket.io.

## 🎮 Características

- **Modo Single Player**: Jogue sozinho contra NPCs
- **Modo Multiplayer**: Até 4 jogadores por sala
- **Sistema PvP**: Batalhas em tempo real entre jogadores
- **Salas com Código**: Crie ou entre em salas usando códigos únicos
- **Sistema de Progressão**: Ganhe XP, suba de nível e melhore seus atributos
- **Inventário**: Colete itens pelo mapa
- **Interface Responsiva**: Funciona em desktop e mobile

## 🚀 Como Jogar

### Modo Single Player
1. Digite seu nome
2. Clique em "Modo Solo"
3. Use as setas ou WASD para se mover
4. Encontre inimigos e itens pelo mapa

### Modo Multiplayer
1. Digite seu nome
2. **Criar Sala**: Clique em "Criar Sala" e compartilhe o código com seus amigos
3. **Entrar em Sala**: Digite o código da sala e clique em "Entrar na Sala"
4. Aguarde o host iniciar o jogo
5. Mova-se pelo mapa e use "Ataque PvP" para batalhar contra outros jogadores

## 🛠️ Instalação Local

### Pré-requisitos
- Node.js (versão 14 ou superior)
- npm ou yarn

### Passos

1. **Clone ou baixe o projeto**
```bash
git clone <url-do-repositorio>
cd rpg-multiplayer
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o servidor**
```bash
npm start
```

4. **Acesse o jogo**
Abra seu navegador e vá para: `http://localhost:3000`

## 🌐 Hospedagem Gratuita

### Opção 1: Render (Recomendado)

1. **Crie uma conta no [Render](https://render.com)**

2. **Conecte seu repositório GitHub**
   - Faça upload do código para um repositório GitHub
   - No Render, clique em "New" → "Web Service"
   - Conecte seu repositório GitHub

3. **Configure o serviço**
   - **Name**: `rpg-multiplayer`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Deploy**
   - Clique em "Create Web Service"
   - Aguarde o deploy (pode levar alguns minutos)
   - Seu jogo estará disponível em: `https://seu-app.onrender.com`

### Opção 2: Railway

1. **Crie uma conta no [Railway](https://railway.app)**

2. **Deploy do GitHub**
   - Clique em "Deploy from GitHub repo"
   - Selecione seu repositório
   - Railway detectará automaticamente que é um projeto Node.js

3. **Configure as variáveis (se necessário)**
   - Vá em "Variables"
   - Adicione `PORT` se necessário (geralmente não é preciso)

4. **Acesse seu jogo**
   - Após o deploy, você receberá uma URL pública

### Opção 3: Heroku (Limitado)

1. **Crie uma conta no [Heroku](https://heroku.com)**

2. **Instale o Heroku CLI**

3. **Deploy via CLI**
```bash
heroku create seu-rpg-multiplayer
git add .
git commit -m "Deploy inicial"
git push heroku main
```

## 📱 Como Compartilhar com Amigos

1. **Hospede o jogo** usando uma das opções acima
2. **Compartilhe a URL** com seus amigos
3. **Crie uma sala** e compartilhe o código de 6 dígitos
4. **Joguem juntos!**

## 🎯 Controles

### Movimento
- **Setas do teclado** ou **WASD**
- **Botões na tela** (mobile)

### Ações
- **Ataque PvP**: Atacar jogadores próximos
- **Defender**: Reduzir dano recebido
- **Magia**: Ataque mágico (consome MP)

## 🔧 Configurações Técnicas

### Estrutura do Projeto
```
rpg-multiplayer/
├── index.html          # Interface do jogo
├── style.css           # Estilos
├── script.js           # Lógica do cliente
├── server.js           # Servidor Node.js
├── package.json        # Dependências
└── README.md           # Este arquivo
```

### Tecnologias Utilizadas
- **Frontend**: HTML5 Canvas, CSS3, JavaScript ES6
- **Backend**: Node.js, Express.js
- **Comunicação**: Socket.io (WebSockets)
- **Hospedagem**: Render/Railway/Heroku

## 🐛 Solução de Problemas

### Erro de Conexão
- Verifique se o servidor está rodando
- Confirme se a porta está correta
- Teste a conexão de internet

### Lag no Multiplayer
- Verifique sua conexão de internet
- Serviços gratuitos podem ter latência maior
- Considere hospedar em um servidor pago para melhor performance

### Sala não Encontrada
- Verifique se o código está correto (6 dígitos)
- Confirme se o host não saiu da sala
- Tente criar uma nova sala

## 🎨 Personalização

### Modificar Cores dos Jogadores
Edite o array `colors` no arquivo `server.js`:
```javascript
const colors = ['#27ae60', '#e74c3c', '#3498db', '#f39c12'];
```

### Ajustar Dificuldade
Modifique os valores de HP, ataque e defesa nas classes `Player` e `Enemy`.

### Adicionar Novos Inimigos
Edite o objeto `enemyTypes` na classe `Enemy`.

## 📄 Licença

Este projeto é open source e está disponível sob a licença MIT.

## 🤝 Contribuição

Sinta-se livre para contribuir com melhorias:
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Divirta-se jogando! 🎮**