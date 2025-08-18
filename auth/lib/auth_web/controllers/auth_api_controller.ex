defmodule AuthWeb.AuthApiController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias Auth.User.Auth

  def google_auth(conn, %{"id_token" => id_token, "client_id" => client_id_param}) do
    with true <- client_id_param == Application.get_env(:auth, :google_oauth)[:client_id],
         verifier <- Application.get_env(:auth, :google_verifier),
         {:ok, google_data} <- verifier.verify(id_token) do
      user = find_or_create_user(google_data)
      token = Auth.generate_jwt(user)

      json(conn, %{
        message: "Authenticated",
        token: token,
        user: %{id: user.id, email: user.email}
      })
    else
      false ->
        conn
        |> put_status(401)
        |> json(%{error: "Invalid client_id"})

      {:error, reason} ->
        conn
        |> put_status(401)
        |> json(%{error: "Invalid Google token: #{reason}"})
    end
  end

  defp find_or_create_user(google_data) do
    email = google_data["email"]
    google_uid = google_data["sub"]

    case Accounts.get_user_by_email(email) do
      nil ->
        {:ok, user} =
          Accounts.register_user_oauth(%{
            email: email,
            name: google_data["name"],
            provider: "google",
            uid: google_uid
          })

        user

      user ->
        user
    end
  end
end
