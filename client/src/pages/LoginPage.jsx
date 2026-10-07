import { useState } from "react";
import { login } from "../api/authApi.js";

import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const { user, setUser, setToken } = useAuth();

    console.log("EMAIL:", email);
    console.log("PASSWORD:", password);

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const data = await login(email, password);

            setUser(data.user);
            setToken(data.token);

            localStorage.setItem("user", JSON.stringify(data.user));
            localStorage.setItem("token", data.token);

            console.log("LOGIN SUCCESS:", data);
        } catch (error) {
            console.error("LOGIN ERROR:", error.message);
        }
    };

    return (
        <div>
            <h1>IT Service Desk</h1>
            <h2>Login</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button type="submit">
                    Login
                </button>
            </form>

            {user && (
                <div>
                    <h3>Welcome, {user.name}!</h3>
                    <p>Role: {user.role}</p>
                </div>
            )}
        </div>
    );
}

export default LoginPage;