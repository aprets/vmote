# Production Deployment

FROM node:16-alpine

WORKDIR /build

COPY . .

RUN yarn install

RUN yarn build

RUN cp -r ./apps/web /app

RUN rm -rf /build

WORKDIR /app

RUN yarn install --production --frozen-lockfile

RUN rm -rf src

CMD yarn start