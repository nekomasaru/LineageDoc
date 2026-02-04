FROM node:18-slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# Install dependencies
# Using --omit=dev to keep image size small in production
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Start the application
CMD [ "npm", "start" ]
