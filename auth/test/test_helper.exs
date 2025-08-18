ExUnit.start()
Ecto.Adapters.SQL.Sandbox.mode(Auth.Repo, :manual)

Mox.defmock(Auth.GoogleVerifierMock, for: Auth.GoogleVerifier)
Application.put_env(:auth, :google_verifier, Auth.GoogleVerifierMock)
