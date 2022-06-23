# Production Deployment

FROM node:16-alpine

WORKDIR /app

COPY . .

RUN yarn install --production --frozen-lockfile

RUN yarn build

RUN rm -rf src

CMD yarn start