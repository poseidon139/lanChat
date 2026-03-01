# Node Bridge Dockerfile
FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

# Wait-for-it equivalent is not strictly necessary natively if the 
# bridge handles connection errors (which it sort of does).
# But doing a simple retry wrapper or letting docker handle failure works. 

EXPOSE 44901
CMD ["node", "server.js"]
