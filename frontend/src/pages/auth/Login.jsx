import { useDispatch } from "react-redux";
import { useState } from "react";
import axios from "../../api/axiosInstance";
import { loginSuccess } from "../../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import HelpDeskImage from "../../assets/HelpDeskImage.png";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      dispatch(loginSuccess({ user: data, token: data.token }));
      if (data.role === "admin") {
        navigate("/admin/dashboard");
      } else if (data.role === "agent") {
        navigate("/agent/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      console.error(
        "Login failed:",
        err.response?.data?.message || err.message
      );
      alert("Login failed: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex flex-1 h-full w-full bg-gray-100">
      <div className="flex h-full w-[50%]">
        <img
          src={HelpDeskImage}
          alt="Help Desk"
          className="object-fit w-full h-full"
        />
      </div>
      <div className="flex h-full w-[50%] bg-white justify-center items-center">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white flex flex-col gap-4 p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            Login
          </h2>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
