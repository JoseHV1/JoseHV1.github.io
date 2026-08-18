# syntax=docker/dockerfile:1

FROM nginx:alpine
COPY index.html robots.txt sitemap.xml /usr/share/nginx/html/
COPY css /usr/share/nginx/html/css
COPY images /usr/share/nginx/html/images
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
