import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import {
  generateAttestationOptions,
  generateAssertionOptions,
  verifyAssertionResponse,
  verifyAttestationResponse,
} from "./webauthn.mjs";

dotenv.config();
const app = express();

// Middleware
app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// MongoDB Connection
mongoose
  .connect("mongodb://localhost:27017/webauthn", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    minPoolSize: 10,
    maxPoolSize: 1000,
  })
  .then(() => {
    app.post("/api/webauthn/register/options", async (req, res) => {
      const { username } = req.body;

      try {
        const options = await generateAttestationOptions(username);
        res.json(options);
      } catch (error) {
        console.error("Error generating attestation options:", error);
        res
          .status(500)
          .json({ error: "Failed to generate attestation options" });
      }
    });

    app.post("/api/webauthn/register/verify", async (req, res) => {
      const { username, credential } = req.body;

      try {
        const data = await verifyAttestationResponse(username, credential);
        res.json(data);
      } catch (error) {
        console.error("Error verifying attestation response:", error);
        res
          .status(500)
          .json({ error: "Failed to verify attestation response" });
      }
    });

    app.post("/api/webauthn/login/options", async (req, res) => {
      const { username } = req.body;

      try {
        // Generate assertion options for WebAuthn login
        const options = await generateAssertionOptions(username);
        res.json(options);
      } catch (error) {
        console.error("Error generating assertion options:", error);
        res.status(500).json({ error: "Failed to generate assertion options" });
      }
    });

    app.post("/api/webauthn/login", async (req, res) => {
      const { username, credential } = req.body;
      try {
        // Verify assertion response during WebAuthn login
        const loginResponse = await verifyAssertionResponse(
          username,
          credential
        );
        res.json(loginResponse);
      } catch (error) {
        console.error("Error verifying assertion response:", error);
        res.status(500).json({ error: "Failed to verify assertion response" });
      }
    });
  })
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// Start server
const PORT = 8888;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
