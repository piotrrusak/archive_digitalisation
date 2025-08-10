defmodule AuthWeb.UserAuth do
  @moduledoc """
  Handles JWT issuing and authentication for API requests.
  """
  import Phoenix.Controller

  import Plug.Conn
  alias Auth.Accounts
  alias Joken.Signer

  @secret_key Application.compile_env!(:auth, :jwt_secret)
  # 7 days in seconds
  @token_ttl 60 * 60 * 24 * 7

  ## Plug to authenticate API requests
  def fetch_api_user(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- verify_jwt(token),
         %{"sub" => user_id} <- claims,
         user when not is_nil(user) <- Accounts.get_user!(user_id) do
      assign(conn, :current_user, user)
    else
      _ ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Unauthorized"})
        |> halt()
    end
  end

  ## Create a JWT for the given user
  def generate_jwt(%Accounts.User{id: id}) do
    IO.inspect(id)

    signer = Signer.create("HS256", @secret_key)

    IO.inspect(signer)

    claims = %{
      "sub" => to_string(id),
      "exp" => DateTime.utc_now() |> DateTime.add(@token_ttl, :second) |> DateTime.to_unix()
    }

    Joken.generate_and_sign!(claims, signer)
    |> IO.inspect()
    |> elem(0)
  end

  ## Verify a JWT and return claims
  def verify_jwt(token) do
    signer = Signer.create("HS256", @secret_key)
    Joken.verify_and_validate(token, signer)
  end
end
