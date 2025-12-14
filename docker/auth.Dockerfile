FROM elixir:latest
RUN mkdir /app
COPY ../auth /app
WORKDIR /app

RUN mix local.hex --force

EXPOSE 4000

COPY ../auth/entrypoint.sh /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]

RUN mix deps.get --only prod
RUN MIX_ENV=prod 
