defmodule AuthWeb.DeleteAccountController do
  use AuthWeb, :controller

  def delete_account(conn, _params) do
    user = conn.assigns.current_user

    case Auth.Accounts.delete_account(user) do
      {:ok, _} ->
        conn
        |> put_status(:ok)
        |> json(%{
          message: "Account Deleted Successfully"
        })

      {:error, error} ->
        conn
        |> put_status(500)
        |> json(%{
          message: "Error encountered",
          error: error
        })
    end
  end
end
