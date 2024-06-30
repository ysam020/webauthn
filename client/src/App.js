import React from "react";
import "./App.css";
import ParticlesBackground from "./components/ParticlesBackground";
import Signup from "./components/Signup";
import Login from "./components/Login";

const App = () => {
  return (
    <div className="App">
      <ParticlesBackground />
      <div className="main">
        <input type="checkbox" id="chk" aria-hidden="true" />
        <Signup />
        <Login />
      </div>
    </div>
  );
};

export default App;
