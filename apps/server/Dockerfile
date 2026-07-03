FROM oven/bun:1.1

WORKDIR /app

COPY package.json ./
COPY tsconfig.json ./

COPY packages/shared ./packages/shared
COPY packages/db ./packages/db

COPY apps/server ./apps/server

RUN bun install --frozen-lockfile

RUN cd packages/db && bunx prisma generate --schema=prisma/schema.prisma

EXPOSE 3000

CMD sh -c "cd packages/db && bunx prisma migrate deploy --schema=prisma/schema.prisma && cd /app && bun run apps/server/src/index.ts"
