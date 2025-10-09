FROM node:20-alpine

WORKDIR /app

COPY . .

ENV NEXT_SKIP_NATIVE_SWC_BINARY=1

EXPOSE 3000

CMD npm install && npm run dev
