# syntax=docker/dockerfile:1.4

FROM node:lts AS development

ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

WORKDIR /usr/src/app

ARG PORT=80
ENV PORT $PORT
EXPOSE $PORT

COPY package.json /usr/src/app/package.json
COPY package-lock.json /usr/src/app/package-lock.json

RUN npm ci

# HEALTHCHECK --interval=30s \
#     CMD node healthcheck.js

COPY ["./src","./jest.config.mjs","/usr/src/app/"]

CMD [ "node", "src/index.js" ]

FROM development as dev-envs
RUN <<EOF
apt-get update
apt-get install -y --no-install-recommends git
EOF

RUN <<EOF
useradd -s /bin/bash -m vscode
groupadd docker
usermod -aG docker vscode
EOF
# install Docker tools (cli, buildx, compose)
COPY --from=gloursdocker/docker / /