FROM node:22-alpine

WORKDIR /app

# Enable corepack for yarn 4
RUN corepack enable

# Copy dependency configuration files
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn

# Install dependencies
RUN yarn install --immutable

# Copy the rest of the application
COPY . .

# Run the API script
CMD ["node", "src/run-api.cjs"]
