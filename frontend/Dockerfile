# stage 1: Build the React App
FROM node:18 AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . ./
RUN npm run build

# stage 2: Serve the App using NGINX
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# copy a custom nginx.conf to handle React routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]