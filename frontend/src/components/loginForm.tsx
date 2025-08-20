import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from "@react-oauth/google";
import type { FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";

interface Errors {
  email?: string;
  password?: string;
}

interface LoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
  token: string;
}
interface LoginErrorResponse {
  message?: string;
}

interface GoogleLoginResponse {
  message: string;
  user: {
    id: number;
    email: string;
  };
  token: string;
}

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<Errors>({});
  const navigate = useNavigate();
  const { login } = useAuth();

  const validate = (): Errors => {
    const newErrors: Errors = {};
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      newErrors.email = "Invalid email format";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    return newErrors;
  };

    const attemptToLogIn = async (
    email: string,
    password: string
    ): Promise<LoginResponse> => {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/users/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
        
        const data = (await response.json()) as LoginResponse | LoginErrorResponse;
        
        if (!response.ok) {
            throw new Error(data.message ?? "Login request failed");
        }
        
        console.log("Server response:", data);
        return data as LoginResponse;
    };
    
    const sendGoogleTokenToBackend = async (tokenId: string, clientId: string): Promise<void> => {
        try {
        const response = await fetch(`${import.meta.env.VITE_AUTH_API_BASE_URL}/auth/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({id_token : tokenId, client_id : clientId }),
        });

        if (!response.ok) {
        const data = (await response.json()) as { error: string };
        throw new Error(data.error);
        }

        const data = (await response.json()) as GoogleLoginResponse;
        console.log("Google Login Backend data:", data);

        login(data.token);
        alert("Logged in with Google!");
        void navigate("/")
    } catch (err) {
        const message =
        err instanceof Error ? err.message : "Google auth failed";
        console.error("Google auth error:", message);
        alert(message);
    }
    };


    const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
    } else {
        setErrors({});

        void attemptToLogIn(email, password)
        .then((data) => {
            login(data.token);
            alert(data.message);
            void navigate("/")
        })
        .catch((err: unknown) => {
            // Handle wrong credentials
            const message =
            err instanceof Error ? err.message : "Login failed";
            setErrors({ email: message }); // You can also add a separate field
        });
    }
    };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="email">Email:</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            style={{ width: "100%", padding: ".5rem" }}
          />
          {errors.email && (
            <span style={{ color: "red", fontSize: ".875rem" }}>
              {errors.email}
            </span>
          )}
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <label htmlFor="password">Password:</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            style={{ width: "100%", padding: ".5rem" }}
          />
          {errors.password && (
            <span style={{ color: "red", fontSize: ".875rem" }}>
              {errors.password}
            </span>
          )}
        </div>

        <button type="submit" style={{ padding: ".5rem 1rem" }}>
          Login
        </button>
      </form>
    <div style={{ marginTop: "1rem" }}>
        <GoogleLogin
            onSuccess={(credentialResponse) => {
            console.log(credentialResponse)
            const tokenId = credentialResponse.credential;
            const clientId = credentialResponse.clientId;
            if (tokenId && clientId) {
                void sendGoogleTokenToBackend(tokenId, clientId);
            }
            }}
            onError={() => {
            console.error("Google Login Failed");
            }}
            width="100%"
            useOneTap
        />
    </div>
    </div>
  );
};

export default LoginForm;
