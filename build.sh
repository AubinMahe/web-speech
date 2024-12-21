#!/usr/bin/env bash

readonly BOLD_GREEN='\033[1;32m'
readonly BOLD_RED='\033[1;31m'
readonly RESET='\033[0m'
OK=""

echo "Compilation du back-end et des types pour vérifier la syntaxe uniquement..."
if node_modules/.bin/tsc; then
   rm -fr dist
   echo "Transpilation (ts --> js) du front-end src/Front/* et src/Types/* dans dist/..."
   if node_modules/.bin/tsc --project src/Front; then
      echo "Copie HTML et CSS dans dist..."
      if cp pages/* dist/; then
         OK=true
      fi
   fi
fi
if [ "${OK}" ]; then
   echo -e "${BOLD_GREEN}La production est OK.${RESET}"
else
   echo -e "${BOLD_RED}La production a echoué.${RESET}"
fi
