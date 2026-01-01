# Auth

Microservice for storing user's login information along with giving out and verifying user's JSON Web Tokens

## Running

first create auth database `mix setup`

while being inside `auth` directory just type

`mix phx.server`

or if you want to use interactive elixir console

`iex -S mix phx.server`

## Interactive Console

Elixir's interactive console can help you with manualy invoking ecto database related changes

For example:
- Adding a test account:
```elixir
Auth.Accounts.register_user(%{email: "test.email@dev.com", password: "test_password_123"})
```

## Admin/Dev mode

Our app allows for the dev mode (this allows to access the admin panel to set some data without the need to access database directly). Next accounts can be set in frontend but initial account must be set using `iex`. 

The command is simple
1. Get user you want
2. Set him to be admin
```elixir
Auth.Accounts.get_user_by_email("email@example.com") |> Auth.Accounts.set_user_admin(true)
```

Replace email with your desired email and everything is done.

*Note:* Adding admins **WILL NOT** refresh session for them, so you have to log in again to get access to admin powers

## API

In dev mode the service is exposed @ `http://localhost:4000/` (tls soon).

### POST /api/v1/auth/google
Given
<!-- Fill in OAuth params received from Google -->
Returns
<!-- Fill in response -->


### POST /api/v1/users/register
#### Given
```json
{
  "email": "...",
  "password": "..."
}
```

#### Returns

##### On success:
```json
{
  "message": "User created successfully",
  "token": "<jwt_token>",
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

##### On validation error:
```json
{
  "errors": {
    // Database validations errors
  }
}
```

### POST /api/v1/users/login
#### Given
```json
{
  "email": "...",
  "password": "..."
}
```

#### Returns

##### On success:
```json
{
  "message": "Login successful",
  "token": "<jwt_token>",
  "user": {
    "id": "...",
    "email": "..."
  }
}
```

##### On failure:
```json
{
  "error": "Invalid email or password"
}
```

### DELETE /api/v1/users/logout
This is a dummy endpoint

#### Given

(no body required)

#### Returns
```json
{
  "message": "Logged out successfully. Discard your token client-side."
}
```

### GET /api/v1/token/verify
#### Given

Requires Authorization header with Bearer token
(No params)

#### Returns

##### If not authenticated:
```json
{ "valid": false }
```

##### If authenticated:
```json
{
  "valid": true,
  "user_id": "...",
  "email": "..."
}
```