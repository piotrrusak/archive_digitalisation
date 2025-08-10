defmodule AuthWeb.TokenAndProtectedRoutesTest do
  use AuthWeb.ConnCase, async: true

  alias Auth.Acounts
  alias Auth.User.Auth

  setup do
    unique = System.unique_integer([:positive]) |> Integer.to_string()
    email = "verify_user_#{unique}@example.com"
    pwd = "verylongpassword123"

    {:ok, user} =
      Acounts.register_user(%{
        "email" => email,
        "password" => pwd,
        "password_confirmation" => pwd
      })

    token = Auth.generate_jwt(user)
    %{user: user, token: token}
  end

  test "GET /api/v1/token/verify returns valid=true + user info for a good token", %{
    conn: conn,
    token: token,
    user: user
  } do
    conn =
      conn
      |> put_req_header("authorization", "Bearer #{token}")
      |> get("/api/v1/token/verify")

    assert json = json_response(conn, 200)
    assert %{"valid" => true, "user_id" => user_id, "email" => email} = json
    assert to_string(user.id) == to_string(user_id)
    assert email == user.email
  end

  test "GET /api/v1/token/verify returns 401 for missing/invalid token", %{conn: conn} do
    conn = get(conn, "/api/v1/token/verify")
    assert response(conn, 401)

    conn2 =
      conn
      |> put_req_header("authorization", "Bearer invalid.token.here")
      |> get("/api/v1/token/verify")

    assert response(conn2, 401)
  end

  test "GET /api/v1/me returns current user when Authorization bearer is present", %{
    conn: conn,
    token: token,
    user: user
  } do
    conn =
      conn
      |> put_req_header("authorization", "Bearer #{token}")
      |> get("/api/v1/me")

    assert json = json_response(conn, 200)
    assert %{"id" => id, "email" => email} = json
    assert to_string(user.id) == to_string(id)
    assert email == user.email
  end

  test "GET /api/v1/me returns 401 without valid token", %{conn: conn} do
    conn = get(conn, "/api/v1/me")
    assert response(conn, 401)
  end
end
