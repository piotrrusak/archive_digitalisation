defmodule AuthWeb.AuthApiController do
  use AuthWeb, :controller

  alias Auth.Accounts

  @google_token_url "https://oauth2.googleapis.com/token"

  def google_auth(conn, %{
        "code" => code,
        "redirect_uri" => redirect_uri,
        "user_found_redirect" => user_found_redirect,
        "user_created_redirect" => user_created_redirect
      }) do
    client_id = Application.get_env(:auth, :google_oauth)[:client_id]
    client_secret = Application.get_env(:auth, :google_oauth)[:client_secret]

    body =
      URI.encode_query(%{
        code: code,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code"
      })

    headers = [{"Content-Type", "application/x-www-form-urlencoded"}]

    case Finch.build(:post, @google_token_url, headers, body)
         |> Auth.GoogleClient.Adapter.request() do
      {:ok, %Finch.Response{status: 200, body: response_body}} ->
        %{"id_token" => id_token} = Jason.decode!(response_body)
        verifier = Application.get_env(:auth, :google_verifier)

        case verifier.verify(id_token) do
          {:ok, google_data} ->
            {user, new_user?} = find_or_create_user(google_data)
            token = Auth.User.Auth.generate_jwt(user)

            redirect_path =
              determine_redirect_path(new_user?, user_created_redirect, user_found_redirect)

            json(conn, %{
              message: "Authenticated",
              token: token,
              user: %{id: user.id, email: user.email},
              redirect_path: redirect_path
            })

          {:error, reason} ->
            conn
            |> put_status(401)
            |> json(%{error: "Invalid Google token: #{inspect(reason)}"})
        end

      {:ok, %Finch.Response{status: status, body: body}} ->
        conn
        |> put_status(status)
        |> json(%{error: "Failed to exchange code", details: body})

      {:error, reason} ->
        conn
        |> put_status(500)
        |> json(%{error: "Finch request failed", reason: inspect(reason)})
    end
  end

  defp find_or_create_user(google_data) do
    email = google_data["email"]
    google_uid = google_data["sub"]

    case Accounts.get_user_by_email(email) do
      nil ->
        {:ok, user} =
          Auth.User.Register.register_user_oauth(%{
            email: email,
            name: google_data["name"],
            provider: "google",
            uid: google_uid
          })

        {user, true}

      user ->
        {user, false}
    end
  end

  defp determine_redirect_path(new_user?, user_created_redirect, user_found_redirect) do
    if new_user?, do: user_created_redirect, else: user_found_redirect
  end
end
