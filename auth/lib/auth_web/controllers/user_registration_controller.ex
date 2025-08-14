defmodule AuthWeb.UserRegistrationController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias Auth.User.Auth

  def create(conn, user_params) do
    user_params
    |> register_user()
    |> handle_response(conn)
  end

  defp register_user(user_params) do
    Accounts.register_user(user_params)
  end

  defp handle_response({:ok, user}, conn) do
    token = Auth.generate_jwt(user)

    conn
    |> put_status(:created)
    |> json(%{
      message: "User created successfully",
      token: token,
      user: %{id: user.id, email: user.email}
    })
  end

  defp handle_response({:error, %Ecto.Changeset{} = changeset}, conn) do
    conn
    |> put_status(:unprocessable_entity)
    |> json(%{errors: format_errors(changeset)})
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", to_string(value))
      end)
    end)
  end
end
