#!/bin/sh
# Met la vitrine des faire-part en ligne sur GitHub Pages : https://edouardparnel-dotcom.github.io/faire-part/
# Première fois : crée le dépôt public « faire-part » et active Pages. Ensuite : publie les changements.
# Le dépôt ne contient que les pages et les images (_outils et _anciens restent sur le PC).
set -e
cd "$(dirname "$0")"
DEPOT=edouardparnel-dotcom/faire-part
if [ ! -d .git ]; then
  git init -q -b main
  git config user.name "Parnel Edouard"
  git config user.email "263601349+edouardparnel-dotcom@users.noreply.github.com"
fi
git add -A
git commit -q -m "Vitrine des faire-part : $(date +%d/%m/%Y)" || echo "Rien de nouveau à publier."
if ! gh repo view "$DEPOT" >/dev/null 2>&1; then
  gh repo create "$DEPOT" --public --description "Faire-part de mariage interactifs : vitrine de démonstration" --source . --push
  gh api -X POST "repos/$DEPOT/pages" -f "source[branch]=main" -f "source[path]=/" --jq .html_url
else
  git push -q
fi
echo "En ligne d'ici 1 à 2 minutes : https://edouardparnel-dotcom.github.io/faire-part/"
