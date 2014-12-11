#!/bin/bash

case $CIRCLE_NODE_INDEX in
  0)  export API_URL=https://api-staging.anyfetch.com
      npm run-script coverage
      ;;
  1)  export API_URL=https://api.anyfetch.com
      npm run-script coverage
      ;;
  2)
      npm run-script lint
      ;;
esac

