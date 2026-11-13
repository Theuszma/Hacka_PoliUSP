#!/bin/sh
# Aplica as migrações, carrega os dados de demonstração quando o banco está vazio e sobe o app.
set -e
npx prisma migrate deploy
if [ "$SEED_ON_START" = "true" ]; then
  npx prisma db seed
elif [ "$SEED_ON_START" != "false" ]; then
  COUNT=$(node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.company.count().then(c=>{console.log(c);return p.\$disconnect()})")
  if [ "$COUNT" = "0" ]; then npx prisma db seed; fi
fi
exec npx next start -p 3000
