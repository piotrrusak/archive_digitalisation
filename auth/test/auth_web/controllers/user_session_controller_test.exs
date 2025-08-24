defmodule AuthWeb.UserSessionControllerTest do
  use AuthWeb.ConnCase, async: true

  alias Auth.Accounts

  setup do
    # create a user fixture using register_user/1
    unique = System.unique_integer([:positive]) |> Integer.to_string()
    email = "login_user_#{unique}@example.com"

    params = %{
      "email" => email,
      "password" => "reallylongpassword123",
      "password_confirmation" => "reallylongpassword123"
    }

    {:ok, user} = Accounts.register_user(params)
    %{user: user, email: email, password: params["password"]}
  end

  test "POST /api/v1/users/login returns 200 with token + user on valid credentials", %{
    conn: conn,
    email: email,
    password: password
  } do
    conn = post(conn, "/api/v1/users/login", %{"email" => email, "password" => password})
    assert json = json_response(conn, 200)
    assert %{"token" => token, "user" => %{"id" => id, "email" => returned_email}} = json
    assert returned_email == email
    assert is_binary(token)
    assert is_integer(id)
  end

  test "POST /api/v1/users/login returns 401 on invalid credentials", %{conn: conn} do
    conn =
      post(conn, "/api/v1/users/login", %{
        "email" => "doesnotexist@example.com",
        "password" => "nope"
      })

    assert json = json_response(conn, 401)
    assert Map.has_key?(json, "error")
  end

  test "POST /api/v1/users/login returns 401 on deleted user", %{
    conn: conn,
    user: user,
    email: email,
    password: password
  } do
    Accounts.delete_account(user)

    conn =
      post(conn, "/api/v1/users/login", %{
        "email" => email,
        "password" => password
      })

    assert json = json_response(conn, 401)
    assert Map.has_key?(json, "error")
  end

  test "DELETE /api/v1/users/logout returns a friendly message", %{
    conn: conn,
    email: _email,
    password: _password
  } do
    conn = delete(conn, "/api/v1/users/logout", %{})
    # With JWT approach logout is typically client-side; ensure the endpoint responds 200
    assert json = json_response(conn, 200)
    assert %{"message" => _} = json
  end
end
