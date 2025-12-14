FROM elixir:latest AS build

WORKDIR /app

RUN apk add --no-cache build-base git

COPY auth/mix.exs auth/mix.lock ./
RUN mix local.hex --force && mix deps.get --only prod

COPY auth .
RUN MIX_ENV=prod mix compile

FROM elixir:1.16-alpine
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4000

CMD ["mix", "phx.server"]
