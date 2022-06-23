# Production Deployment

FROM node:16-alpine

WORKDIR /app

COPY . .

RUN yarn install --production --frozen-lockfile

CMD yarn start