defmodule AuthWeb.Router do
  alias Auth.User

  use AuthWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :auth_api do
    plug(:accepts, ["json"])
    plug(User.Auth, :fetch_api_user)
  end

  scope "/api/v1", AuthWeb do
    pipe_through(:api)

    post "/auth/google", AuthApiController, :google_auth
    post "/users/register", UserRegistrationController, :create
    post "/users/login", UserSessionController, :create
    delete "/users/logout", UserSessionController, :delete
  end

  scope "/api/v1", AuthWeb do
    pipe_through(:auth_api)

    get "/token/verify", TokenController, :verify
    delete "/users/delete_account", DeleteAccountController, :delete_account
  end
end
