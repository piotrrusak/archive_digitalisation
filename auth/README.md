# Auth

Microservice for storing user's login information along with giving out and verifying user's JSON Web Tokens

## Running

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