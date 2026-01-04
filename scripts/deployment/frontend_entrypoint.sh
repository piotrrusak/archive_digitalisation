#!/bin/sh

# This script runs EVERY time the container starts.
# It reads the current environment variables (from AWS) 
# and writes them to the config.js file that the browser loads.

echo "window._env_ = {" > /usr/share/nginx/html/config.js
echo "  VITE_GOOGLE_CLIENT_ID: \"$VITE_GOOGLE_CLIENT_ID\"," >> /usr/share/nginx/html/config.js
echo "  VITE_AUTH_API_BASE_URL: \"$VITE_AUTH_API_BASE_URL\"," >> /usr/share/nginx/html/config.js
echo "  VITE_BACKEND_API_BASE_URL: \"$VITE_BACKEND_API_BASE_URL\"," >> /usr/share/nginx/html/config.js
echo "};" >> /usr/share/nginx/html/config.js

# Finally, start Nginx
exec "$@"