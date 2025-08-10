defmodule AuthWeb.UserSessionController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias AuthWeb.UserAuth

  def create(conn, %{"email" => email, "password" => password}) do
    case Accounts.get_user_by_email_and_password(email, password) do
      nil ->
        conn
        |> put_status(:unauthorized)
        |> json(%{error: "Invalid email or password"})

      user ->
        token = UserAuth.generate_jwt(user)

        conn
        |> put_status(:ok)
        |> json(%{
          message: "Login successful",
          token: token,
          user: %{id: user.id, email: user.email}
        })
    end
  end

  def delete(conn, _params) do
    # For JWT-based auth, logout is handled client-side by discarding the token
    # Optionally, you could implement a token blacklist here.
    conn
    |> put_status(:ok)
    |> json(%{message: "Logged out successfully. Discard your token client-side."})
  end
end
