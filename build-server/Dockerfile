FROM ubuntu:20.04


# Update package list and install necessary packages
RUN apt-get update && \
    apt-get install -y curl gnupg git && \
    curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get update && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*



ARG ENDPOINT
ARG secretAccessKey
ARG bucket
ARG accessKeyId  
ARG REDIS_URL
ARG channel

ENV ENDPOINT=${ENDPOINT}
ENV accessKeyId=${accessKeyId}
ENV bucket=${bucket}
ENV secretAccessKey=${secretAccessKey}
ENV REDIS_URL=${REDIS_URL}
ENV channel=${channel}



WORKDIR /home/usr/app

# Copy necessary files to the working directory
COPY main.sh main.sh
COPY script.js script.js
# COPY connection.js connection.js
COPY package*.json ./



# Install npm dependencies
RUN npm install


# Set execute permissions for necessary scripts
RUN chmod +x main.sh script.js

# Define the entry point for the container
ENTRYPOINT [ "/home/usr/app/main.sh" ]