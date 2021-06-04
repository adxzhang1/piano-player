import React, { useState } from "react";
import "./App.css";
import { Player } from "./sections/player";

const FILES = 3;

const App = () => {
  const [index, setIndex] = useState(0);

  const file = `s${index + 1}.mid`;
  return (
    <div>
      <div>
        <p>{file}</p>
        <button
          onClick={() => {
            setIndex((index + 1) % FILES);
          }}
        >
          Next
        </button>
      </div>
      <Player key={file} file={file} />
    </div>
  );
};

export default App;
