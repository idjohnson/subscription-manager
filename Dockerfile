# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

ENV REACT_APP_USERNAME=testuser
ENV REACT_APP_PASSWORD=testpass
ENV HOST=0.0.0.0

# Start the application using the dev script
CMD ["npm", "run", "dev"]