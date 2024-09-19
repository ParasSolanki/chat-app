# @chat/api

## Installation

Install Dependencies.

```bash
  pnpm install
```

## Run Locally

Start the dev server.

```bash
  pnpm dev
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file
Since this project uses Turso Sqlite you will need `DATABASE_URL` and `DATABASE_AUTH_TOKEN`.

| Name                    | Description                                                                 |
| ----------------------- | --------------------------------------------------------------------------- |
| PORT (optional)         | Port number (default 3000)                                                  |
| DATABASE_URL            | The database URL.                                                           |
| DATABASE_AUTH_TOKEN     | The database Auth token.                                                    |
| TOKEN_SECRET            | The token secret (should be the same as defined in @chat/www TOKEN_SECRET). |
| BASE_URL                | Base url of application.                                                    |
| VITE_PUBLIC_WEBSITE_URL | The website url.                                                            |
| VITE_PUBLIC_API_URL     | The api url.                                                                |
