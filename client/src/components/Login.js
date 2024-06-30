import React, { useState } from "react";
import axios from "axios";

const Login = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8888/api/webauthn/login/options",
        { username }
      );
      if (response.data.error) {
        setMessage(response.data.message);
        return;
      }

      const options = response.data;

      // Convert challenge to Uint8Array
      options.challenge = new Uint8Array(
        options.challenge.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
      );

      // Convert allowCredentials ID from Buffer to Uint8Array
      options.allowCredentials.forEach((cred) => {
        cred.id = new Uint8Array(cred.id.data);
      });

      const credential = await navigator.credentials.get({
        publicKey: options,
      });

      const serializedCredential = {
        id: credential.id,
        type: credential.type,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          authenticatorData: Array.from(
            new Uint8Array(credential.response.authenticatorData)
          ),
          clientDataJSON: Array.from(
            new Uint8Array(credential.response.clientDataJSON)
          ),
          signature: Array.from(new Uint8Array(credential.response.signature)),
          userHandle: credential.response.userHandle
            ? Array.from(new Uint8Array(credential.response.userHandle))
            : null,
        },
      };
      console.log(serializedCredential);

      const verificationResponse = await axios.post(
        "http://localhost:8888/api/webauthn/login",
        { username, credential: serializedCredential }
      );

      if (verificationResponse.data.success) {
        setMessage("Login successful");
      } else {
        setMessage("Failed to login");
      }
    } catch (error) {
      console.error("Failed to login");
      setMessage("Failed to login");
    }
  };

  return (
    <div className="login">
      <form onSubmit={handleLogin}>
        <label htmlFor="chk" aria-hidden="true">
          Login
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          required
        />
        <button type="submit">Login</button>
      </form>
      {message && <p style={{ color: "#01082A" }}>{message}</p>}
    </div>
  );
};

export default Login;
