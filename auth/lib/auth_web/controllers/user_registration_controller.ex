defmodule AuthWeb.UserRegistrationController do
  use AuthWeb, :controller

  alias Auth.Accounts
  alias Auth.Accounts.User

  @backend_url Application.compile_env(:auth, :backend_url)

  def create(conn, user_params) do
    user_params
    |> register_user_and_sync()
    |> handle_response(conn)
  end

  defp register_user_and_sync(user_params) do
    Ecto.Multi.new()
    |> Ecto.Multi.run(:user, fn _repo, _changes ->
      Accounts.register_user(user_params)
    end)
    |> Ecto.Multi.run(:backend_sync, fn _repo, %{user: user} ->
      sync_user_with_backend(user, user_params)
    end)
    |> Auth.Repo.transaction()
    |> case do
      {:ok, %{user: user}} -> {:ok, user}
      {:error, _step, reason, _changes_so_far} -> {:error, reason}
    end
  end

  defp sync_user_with_backend(%User{} = user, %{
         "first_name" => first_name,
         "last_name" => last_name
       }) do
    body =
      %{
        id: user.id,
        mail: user.email,
        firstName: first_name,
        lastName: last_name
      }
      |> Jason.encode!()

    request =
      Finch.build(
        :post,
        "#{@backend_url}/api/v1/users",
        [
          {"content-type", "application/json"},
          {"authorization", "agsrgbbgadfaa"}
        ],
        body
      )

    case Auth.BackendClient.Adapter.request(request) do
      {:ok, %Finch.Response{status: 200}} ->
        {:ok, user}

      {:ok, %Finch.Response{status: status, body: resp_body}} ->
        {:error, %{status: status, body: resp_body}}

      {:error, reason} ->
        {:error, %{error: reason}}
    end
  end

  defp handle_response({:ok, user}, conn) do
    token = Auth.User.Auth.generate_jwt(user)

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

  defp handle_response({:error, %{status: status, body: body}}, conn) do
    conn
    |> put_status(status)
    |> json(%{errors: body})
  end

  defp format_errors(changeset) do
    Ecto.Changeset.traverse_errors(changeset, fn {msg, opts} ->
      Enum.reduce(opts, msg, fn {key, value}, acc ->
        String.replace(acc, "%{#{key}}", inspect(value))
      end)
    end)
  end
end
