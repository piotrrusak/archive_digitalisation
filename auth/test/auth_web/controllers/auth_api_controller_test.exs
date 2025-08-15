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

      conn = post(conn, "/api/v1/auth/google", %{"id_token" => "valid"})

      response = json_response(conn, 200)
      assert response["token"]
      assert response["message"] == "Authenticated"
      assert %{"email" => "test@example.com"} = response["user"]
    end

    test "fails on invalid token", %{conn: conn} do
      Auth.GoogleVerifierMock
      |> expect(:verify, fn _ -> {:error, "invalid"} end)

      conn = post(conn, "/api/v1/auth/google", %{"id_token" => "whatever"})
      assert json_response(conn, 401)
    end
  end
end
