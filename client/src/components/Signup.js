import React, { useState } from "react";
import axios from "axios";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");

  // Function to convert base64url to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const buffer = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      buffer[i] = rawData.charCodeAt(i);
    }

    return buffer;
  };

  // Function to handle registration process
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const response = await axios.post(
        "http://localhost:8888/api/webauthn/register/options",
        {
          username,
        }
      );

      // Decode challenge and user.id
      const challenge = urlBase64ToUint8Array(response.data.challenge);
      const userId = urlBase64ToUint8Array(response.data.user.id);

      const publicKeyOptions = {
        ...response.data,
        challenge,
        user: {
          ...response.data.user,
          id: userId,
        },
      };

      // Create credentials using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions,
      });

      // Extract the information from the credential
      const credentialData = {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type,
        response: {
          clientDataJSON: Array.from(
            new Uint8Array(credential.response.clientDataJSON)
          ),
          attestationObject: Array.from(
            new Uint8Array(credential.response.attestationObject)
          ),
        },
      };

      // Send the credential data to the server for registration
      try {
        const registrationResponse = await axios.post(
          "http://localhost:8888/api/webauthn/register/verify",
          {
            credential: credentialData,
            username,
          }
        );

        console.log("Registration response:", registrationResponse.data);

        setMessage(registrationResponse.data.message);
      } catch (error) {
        console.error("Registration error:", error);
        setMessage("Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Registration failed");
    }
  };

  return (
    <div className="signup">
      <form onSubmit={handleRegister}>
        <label htmlFor="chk" aria-hidden="true">
          Sign up
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => {
            setMessage("");
            setUsername(e.target.value);
          }}
          placeholder="Username"
          required
        />
        <button type="submit">Sign up</button>
        <p style={{ color: "#fff" }}>{message}</p>
      </form>
    </div>
  );
};

export default Signup;
