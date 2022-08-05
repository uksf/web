FROM node:latest as build
WORKDIR /app

RUN npm install -g @angular/cli

COPY package*.json /app/
RUN npm install

COPY ./ /app/
RUN ng build -c production --aot --build-optimizer --optimization

FROM nginx:latest as runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
