FROM nginx:alpine

# Label metadata
LABEL maintainer="FOS Best Performer Award"

# Set working directory
WORKDIR /usr/share/nginx/html

# Clean default nginx assets
RUN rm -rf ./*

# Copy website files and assets
COPY index.html style.css script.js ./
COPY assets/ ./assets/

# Configure nginx for optimal static file serving & caching
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Audio & media caching for smooth projector playback
    location ~* \.(mp3|gif|jpg|jpeg|png|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # CSS & JS caching
    location ~* \.(css|js)$ {
        expires 7d;
        add_header Cache-Control "public, must-revalidate";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
