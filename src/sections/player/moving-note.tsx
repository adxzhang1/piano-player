import React, { FC, useState } from "react";
import { Animate } from "react-move";
import styled from "styled-components";
import { easeQuadOut } from "d3-ease";

const MovingNoteBody = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 100;
`;

interface MovingNoteProps {
  mode?: "rain" | "random";
  children?: React.ReactNode;
}

export const MovingNote: FC<MovingNoteProps> = ({ children, mode }) => {
  let [top] = useState((Math.random() - 0.5) * 70);
  let [left] = useState((Math.random() - 0.5) * 70);

  if (top < left) {
    if (top > 0) {
      top = Math.min(top + 50, 100);
    } else {
      top = Math.max(top - 50, -100);
    }
  } else {
    if (left > 0) {
      left = Math.min(left + 50, 100);
    } else {
      left = Math.max(left - 50, -100);
    }
  }

  return (
    <Animate
      start={() => ({
        x: 0,
        y: 0,
      })}
      enter={() => ({
        x: [left],
        y: [mode === "rain" ? 70 : top],
        timing: { duration: 2000, ease: easeQuadOut },
      })}
    >
      {(state) => {
        const { x, y } = state;

        return (
          <MovingNoteBody
            style={{ top: `${y}vh`, left: mode === "rain" ? "" : `${x}vw` }}
          >
            {children}
          </MovingNoteBody>
        );
      }}
    </Animate>
  );
};
