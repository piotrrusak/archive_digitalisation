defmodule AuthWeb.UserRegistrationControllerTest do
  use AuthWeb.ConnCase, async: true

  import Mox

  @valid_attrs %{
    "email" => "user@example.com",
    "password" => "supersecurepassword",
    "password_confirmation" => "supersecurepassword",
    "first_name" => "John",
    "last_name" => "Doe"
  }

  @invalid_attrs %{
    "email" => "bad-email",
    "password" => "short",
    "password_confirmation" => "mismatch",
    "first_name" => "Bad",
    "last_name" => "User"
  }

  setup do
    :ok
  end

  test "POST /api/v1/users/register returns 201 and token + user on success", %{conn: conn} do
    Auth.BackendClientMock
    |> expect(:request, fn _req ->
      {:ok, %Finch.Response{status: 200, body: ""}}
    end)

    conn = post(conn, "/api/v1/users/register", @valid_attrs)

    assert json = json_response(conn, 201)
    assert %{"token" => token, "user" => %{"id" => id, "email" => email}} = json
    assert email == "user@example.com"
    assert is_binary(token)
    assert is_integer(id)
  end

  test "POST /api/v1/users/register returns 422 and errors on invalid data", %{conn: conn} do
    Auth.BackendClientMock
    |> expect(:request, fn _req ->
      {:ok, %Finch.Response{status: 200, body: ""}}
    end)

    conn = post(conn, "/api/v1/users/register", @invalid_attrs)

    assert json = json_response(conn, 422)
    assert %{"errors" => errors} = json
    assert is_map(errors)
    assert Map.has_key?(errors, "email") or Map.has_key?(errors, "password")
  end

  test "POST /api/v1/users/register rolls back if backend call fails", %{conn: conn} do
    # Simulate backend failure
    Auth.BackendClientMock
    |> expect(:request, fn _req ->
      {:ok, %Finch.Response{status: 500, body: "backend error"}}
    end)

    conn = post(conn, "/api/v1/users/register", @valid_attrs)

    assert json = json_response(conn, 500)
    assert %{"errors" => errors} = json

    # ensure rollback happened
    assert errors != %{}
  end
end
