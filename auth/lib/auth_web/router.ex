defmodule AuthWeb.Router do
  use AuthWeb, :router

  pipeline :api do
    plug(:accepts, ["json"])
  end

  pipeline :auth_api do
    plug(:accepts, ["json"])
    plug(AuthWeb.UserAuth, :fetch_api_user)
  end

  scope "/api/v1", AuthWeb do
    pipe_through(:api)

    post("/users/register", UserRegistrationController, :create)
    post("/users/login", UserSessionController, :create)
    delete("/users/logout", UserSessionController, :delete)
  end

  scope "/api/v1", AuthWeb do
    pipe_through(:auth_api)

    get("/me", UserController, :me)
  end
end
