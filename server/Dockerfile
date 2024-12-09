FROM node:20.15.1

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install

COPY . .

RUN npm run build

EXPOSE ${EXPRESS_APP_PORT}

CMD ["npm", "start"]