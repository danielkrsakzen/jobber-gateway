FROM node:21-alpine3.19 as builder

WORKDIR /app

COPY package.json tsconfig.json .npmrc ./

COPY src ./src
COPY tools ./tools

RUN npm install -g npm@latest
RUN npm ci && npm run build

FROM node:21-alpine3.19

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json tsconfig.json .npmrc ./

RUN npm install -g pm2 npm@latest
RUN npm ci --production

COPY --from=build /app/build ./build

EXPOSE 4000

CMD [ "npm", "run", "start"]