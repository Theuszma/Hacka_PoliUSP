#!/usr/bin/env bash
# Monta index.html (página completa) a partir de src/elo.html
set -e
cd "$(dirname "$0")"
{
  printf '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n<style>[hidden]{display:none!important} body{margin:0} img{max-width:100%%}</style>\n'
  sed -n '1,/<\/style>/p' src/elo.html
  printf '</head>\n<body>\n'
  sed -n '/<\/style>/,$p' src/elo.html | tail -n +2
  printf '</body>\n</html>\n'
} > index.html
echo "index.html gerado"
