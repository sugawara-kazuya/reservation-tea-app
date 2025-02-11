FROM node:20
WORKDIR /app
RUN npm i @aws-amplify/backend@latest @aws-amplify/backend-cli@latest