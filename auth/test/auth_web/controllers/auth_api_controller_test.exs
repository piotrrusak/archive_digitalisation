defmodule AuthWeb.AuthApiControllerTest do
  use AuthWeb.ConnCase, async: true

  import Mox

  alias AuthWeb.AuthApiController

  describe "#{AuthApiController}" do
    test "returns JWT on valid token", %{conn: conn} do
      Auth.GoogleVerifierMock
      |> expect(:verify, fn "valid" ->
        {:ok, %{"email" => "test@example.com", "sub" => "uid123"}}
      end)

      conn =
        post(conn, "/api/v1/auth/google", %{
          "id_token" => "valid",
          "client_id" => "testtest.apps.googleusercontent.com"
        })

      response = json_response(conn, 200)
      assert response["token"]
      assert response["message"] == "Authenticated"
      assert %{"email" => "test@example.com"} = response["user"]
    end

    test "fails on invalid token", %{conn: conn} do
      Auth.GoogleVerifierMock
      |> expect(:verify, fn _ -> {:error, "invalid"} end)

      conn =
        post(conn, "/api/v1/auth/google", %{
          "id_token" => "whatever",
          "client_id" => "testtest.apps.googleusercontent.com"
        })

      response = json_response(conn, 401)

      assert response["error"] =~ "Invalid Google token:"
    end

    test "fails on invalid client_id", %{conn: conn} do
      conn =
        post(conn, "/api/v1/auth/google", %{
          "id_token" => "irrelevant",
          "client_id" => "clearlywrongclientid.apps.googleurescontent.com"
        })

      response = json_response(conn, 401)
      assert response["error"] == "Invalid client_id"
    end
  end
end
