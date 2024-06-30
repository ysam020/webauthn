// userModel.mjs
import mongoose from "mongoose";

const CredentialSchema = new mongoose.Schema({
  credentialID: String,
  publicKey: String,
  counter: Number,
  transports: [String],
  device: {
    type: String,
    default: "Unknown Device",
  },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  webAuthnCredentials: [CredentialSchema],
});

const UserModel = mongoose.model("User", UserSchema);
export default UserModel;
