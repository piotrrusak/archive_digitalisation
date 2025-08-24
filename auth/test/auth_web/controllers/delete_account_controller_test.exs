defmodule AuthWeb.DeleteAccountControllerTest do
  use AuthWeb.ConnCase, async: true

  alias Auth.Accounts.User
  alias Auth.Repo

  describe "DELETE /users/delete_account (authenticated)" do
    setup %{conn: conn} do
      {:ok, user} =
        %User{}
        |> User.registration_changeset(%{email: "test@example.com", password: "supersecret123"})
        |> Repo.insert()

      token = Auth.User.Auth.generate_jwt(user)

      conn =
        conn
        |> put_req_header("authorization", "Bearer #{token}")

      %{conn: conn, user: user}
    end

    test "successfully deletes account when authenticated", %{conn: conn, user: user} do
      conn = delete(conn, ~p"/api/v1/users/delete_account")

      assert json_response(conn, 200)["message"] == "Account Deleted Successfully"

      db_user = Repo.get(User, user.id)
      assert db_user.deleted == true
      assert String.contains?(db_user.email, "+deleted-")
    end

    test "rejects unauthenticated request", %{user: _user} do
      conn = build_conn() |> delete(~p"/api/v1/users/delete_account")
      assert json_response(conn, 401)["error"] == "Unauthorized"
    end
  end
end
