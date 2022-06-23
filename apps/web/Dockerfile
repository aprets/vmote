# Production Deployment

FROM node:16-alpine

WORKDIR /app

COPY . .

RUN yarn install

RUN yarn build

RUN yarn install --production --frozen-lockfile

RUN rm -rf src

CMD yarn start