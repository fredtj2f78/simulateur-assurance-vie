#!/bin/bash

DEST="/storage/emulated/0/Download/gemini/simuimmov_v5_code"

echo "⏳ Création du dossier d'export..."
mkdir -p "$DEST"

echo "⏳ Copie de tout le projet (hors node_modules et .next)..."
cd ~/simuimmov_v5

# Cette commande copie tout sauf les dossiers inutiles et trop lourds
find . -maxdepth 1 ! -name "node_modules" ! -name ".next" ! -name ".git" ! -name "." -exec cp -r {} "$DEST/" \;

echo "✅ Export complet terminé avec succès !"
echo "📁 Fichiers disponibles dans : Téléchargements > gemini > simuimmov_v5_code"
