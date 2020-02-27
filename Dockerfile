# 1
# install this node things
FROM node:13.6.0

# 2
RUN mkdir -p /usr/app

# 3
WORKDIR /usr/app

# 4
# copy from our computer to the docker container
COPY build/contracts/ build/contracts/
COPY src/ src/
COPY bs-config.json .
COPY package.json .

# 5
RUN npm install

# 6
# access the port from outside the container rather than only inside the container
EXPOSE 3000
# check some of the container processes
EXPOSE 3001

# 7
CMD ["npm", "run", "dev"]