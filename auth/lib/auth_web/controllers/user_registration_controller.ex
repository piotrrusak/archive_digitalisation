defmodule AuthWeb.UserRegistrationController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias Auth.User.Auth

  def create(conn, user_params) do
    case Accounts.register_user(user_params) do
      {:ok, user} ->
        {:ok, _} =
          Accounts.deliver_user_confirmation_instructions(
            user,
            &url(~p"/users/confirm/#{&1}")
          )

        token = Auth.generate_jwt(user)

        conn
        |> put_status(:created)
        |> json(%{
          message: "User created successfully",
          token: token,
          user: %{id: user.id, email: user.email}
        })

      {:error, %Ecto.Changeset{} = changeset} ->
        errors =
          Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
            Enum.reduce(opts, msg, fn {key, value}, acc ->
              String.replace(acc, "%{#{key}}", to_string(value))
            end)
          end)

        conn
        |> put_status(:unprocessable_entity)
        |> json(%{errors: errors})
    end
  end
end
