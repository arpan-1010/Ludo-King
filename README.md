# 🎲 Ludo King Multiplayer Game

A full-stack multiplayer Ludo game built as a Bun monorepo.

## ✨ Features
- User authentication
- Multiplayer gameplay
- Real-time communication
- Responsive React UI
- PostgreSQL persistence
- Shared packages

## 🛠 Tech Stack
|Layer|Technology|
|---|---|
|Frontend|React, Vite, Tailwind CSS, shadcn/ui|
|Backend|TypeScript, Hono, Bun|
|Database|PostgreSQL, Prisma|
|Realtime|WebSockets architecture|
|Deployment|Vercel + Railway|

## 📁 Project Structure
```text
  Ludo-King-main/
    .env.example
    .gitignore
    bun.lock
    index.ts
    package.json
    tsconfig.json
    apps/
      client/
        .env.production
        .gitignore
        bun.lock
        components.json
        index.html
        index.ts
        package.json
        postcss.config.js
        tailwind.config.js
        tsconfig.json
        vercel.json
        vite.config.ts
        src/
          App.tsx
          index.css
          main.tsx
          vite-env.d.ts
          components/
            Board.tsx
            Dice.tsx
            Navbar.tsx
            PlayerHUD.tsx
            WaitingRoom.tsx
            WinScreen.tsx
            ui/
              button.tsx
              card.tsx
              input.tsx
              label.tsx
          hooks/
            useAuth.ts
            useDarkMode.ts
            useGameSocket.ts
          lib/
            api.ts
            utils.ts
          pages/
            GamePage.tsx
            LobbyPage.tsx
            LoginPage.tsx
            NotFoundPage.tsx
            RegisterPage.tsx
          store/
            authStore.ts
            gameStore.ts
      server/
        .gitignore
        Dockerfile
        bun.lock
        index.ts
        package.json
        tsconfig.json
        src/
          index.ts
          engine/
            boardUtils.ts
            dice.ts
            gameEngine.ts
          lib/
            jwt.ts
            password.ts
          middleware/
            auth.ts
          routes/
            auth.ts
            game.ts
          ws/
            handler.ts
            roomManager.ts
    packages/
      db/
        .gitignore
        bun.lock
        index.ts
        package.json
        tsconfig.json
        prisma/
          schema.prisma
          migrations/
            migration_lock.toml
            20260616124620_init/
              migration.sql
            20260616132807_rank_optional/
              migration.sql
        src/
          index.ts
      shared/
        .gitignore
        bun.lock
        index.ts
        package.json
        tsconfig.json
        src/
          constants.ts
          index.ts
          types.ts
```

## 🚀 Getting Started

```bash
git clone https://github.com/arpan-1010/Ludo-King.git
cd Ludo-King
bun install
```

Create environment files for backend/database (DATABASE_URL, JWT_SECRET, etc.), then:

```bash
bun run dev
```

Run Prisma migrations:

```bash
bunx prisma migrate deploy
```

## 🌐 Deployment

Frontend: Vercel

Backend: Railway

Database: PostgreSQL

## 🤝 Contributing

Fork the repository, create a feature branch, commit your changes, and open a pull request.

## 👤 Author

**Arpan Mondal**

GitHub: https://github.com/arpan-1010
