FROM mhart/alpine-node:12
RUN addgroup -g 1000 -S node && \
    adduser -u 1000 -S node -G node
WORKDIR /services
COPY --chown=node:node registry registry
COPY --chown=node:node common common
WORKDIR /services/registry
RUN npm install --quiet
USER node
ENV NODE_ENV=production \
    TERM=linux \
    TERMINFO=/etc/terminfo \
    PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s \
    --timeout=2s \
    --retries=10 \
    CMD node /services/registry/healthcheck.js
CMD ["npm", "start"]

# vim:ft=Dockerfile
