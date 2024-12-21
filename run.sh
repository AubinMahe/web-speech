#!/usr/bin/env bash

readonly SCRIPT_DIR=$(dirname $(readlink --canonicalize $0))
readonly LOG="${HOME}/.aMule/NodeJS-aMule.log"
readonly ERR="${HOME}/.aMule/NodeJS-aMule.err"
readonly HOST=localhost
readonly PORT=8000

mkdir -p .videodb

if pgrep -xa node | grep -q "${SCRIPT_DIR}"; then
   echo "Node.js® tourne déjà, on ne le relance pas." >> "${LOG}"
else
   rm -f "${LOG}"
   rm -f "${ERR}"
   if cd ${SCRIPT_DIR} 2> "${ERR}"; then
      echo "Lancement de Node.js®" > "${LOG}"
      echo -n "Lancement de Node.js® "
      "${SCRIPT_DIR}/node_modules/.bin/ts-node" ./src/Back/main.ts >> "${LOG}" 2> "${ERR}" &
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

echo "On lance un navigateur sur http://${HOST}:${PORT}." >> "${LOG}"
xdg-open http://${HOST}:${PORT} >> "${LOG}" 2>> "${ERR}" &
exit 0
