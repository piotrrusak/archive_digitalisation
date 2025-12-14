FROM elixir:latest AS build

WORKDIR /app

COPY auth/mix.exs auth/mix.lock ./
RUN mix local.hex --force && mix deps.get --only prod

COPY auth .
RUN MIX_ENV=prod mix compile

FROM elixir:latest
WORKDIR /app
COPY --from=build /app /app
EXPOSE 4000

ENV MIX_ENV=prod
CMD ["mix", "phx.server"]
