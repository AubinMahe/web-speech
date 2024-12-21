#!/usr/bin/env bash

readonly SCRIPT_DIR=$(dirname $(readlink --canonicalize $0))
readonly LOG="${HOME}/.aMule/NodeJS-aMule.log"
readonly ERR="${HOME}/.aMule/NodeJS-aMule.err"

if pgrep -x node; then
   echo "Node tourne déjà, on ne le relance pas." >> "${LOG}"
else
   rm -f "${LOG}"
   rm -f "${ERR}"
   if cd ${SCRIPT_DIR} 2> "${ERR}"; then
      echo "Lancement de Node.js®" > "${LOG}"
      echo -n "Lancement de Node.js® "
      ./node_modules/.bin/ts-node ./src/Back/main.ts >> "${LOG}" 2> "${ERR}" &
      while ! grep 'Server is running on http' "${LOG}" 2>/dev/null; do
         sleep 0.25s
         # cat ${LOG}
         echo -n "."
      done
      echo
      if ( ! [ -s "${ERR}" ] ) && ( grep -v -i warning "${ERR}" ); then
         cat "${ERR}"
         pkill -x node
         exit 1
      fi
   else
      echo "Erreur(s) de configuration :"
      cat "${ERR}"
      exit 1
   fi
fi

echo "On lance les tests."
npm test
# npm run test:status
# npm run test:as-is
# npm run test:batch
# npm run test:episode
