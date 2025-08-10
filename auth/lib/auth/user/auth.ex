defmodule Auth.User.Auth do
  @moduledoc """
  Handles JWT issuing and authentication for API requests.
  """
  use Phoenix.Controller

  alias Auth.Token
  alias Auth.Accounts


  @secret_key Application.compile_env!(:auth, :jwt_secret)
  # 7 days in seconds
  @token_ttl 60 * 60 * 24 * 7

  ## Plug to authenticate API requests
  def fetch_api_user(conn, _opts) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, claims} <- verify_jwt(token),
         %{"sub" => user_id, "exp" => exp} <- claims,
         user when not is_nil(user) <- Accounts.get_user!(user_id) do
      #add datetime comparation
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

    Token.generate_and_sign!(claims, signer)
    |> IO.inspect()
  end

  ## Verify a JWT and return claims
  def verify_jwt(token) do
    Token.verify_and_validate(token)
  end
end
