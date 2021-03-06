FROM gitpod/workspace-full:commit-c90b4a5ce44b8956cfd278f67422c739e07ff80e

USER root

# Install custom tools, runtime, etc. using apt-get
# For example, the command below would install "bastet" - a command line tetris clone:
# 
# RUN apt-get -q update && \
#     apt-get install -yq bastet && \
#     rm -rf /var/lib/apt/lists/*
# 
# More information: https://www.gitpod.io/docs/42_config_docker/

USER gitpod

RUN curl https://install.meteor.com/ | sh
ENV METEOR_PATH="$HOME/.meteor"
ENV PATH="$PATH:$METEOR_PATH"

# Switching users in the Dockerfile to gitpod requires switching back to USER root at the end of the Dockerfile, so that the IDE can start.
# Ignore warning from Hadolint: Last user should not be root.
# hadolint ignore=DL3002
USER root
