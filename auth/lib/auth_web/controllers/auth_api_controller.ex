defmodule AuthWeb.AuthApiController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias Auth.User.Auth

  def google_auth(conn, %{"id_token" => id_token}) do
    verifier = Application.get_env(:my_app, :google_verifier)
    case verifier.verify(id_token) do
      {:ok, google_data} ->
        # google_data contains "email", "sub" (Google user ID), etc.
        user = find_or_create_user(google_data)
        token = Auth.generate_jwt(user)

        json(conn, %{
          message: "Authenticated",
          token: token,
          user: %{id: user.id, email: user.email}
        })

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

      user -> user
    end
  end
end
