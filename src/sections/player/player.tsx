import React, { FC } from 'react';
import { Note } from '@tonejs/midi/dist/Note';
import { Slider } from 'antd';
import { usePlayer } from './use-player';

interface PlayerProps {
  file: string;
}

export const Player: FC<PlayerProps> = ({ file }) => {
  const {
    input,
    setInput,
    volume,
    updateVolume,
    time,
    updateTime,
    duration,
    isPlaying,
    keys,
    fallNotes,
    jump,
    togglePlay,
    synthRef,
    start,
  } = usePlayer(file);

  const fallNotesByKeyName: { [key: string]: Note[] } = {};
  for (const fallingNote of fallNotes) {
    if (!fallNotesByKeyName[fallingNote.name]) {
      fallNotesByKeyName[fallingNote.name] = [];
    }
    fallNotesByKeyName[fallingNote.name].push(fallingNote);
  }

  return (
    <div className="App">
      <button onClick={() => console.log(synthRef.current)}>Click</button>
      <div>
        <input value={input} onChange={(e) => setInput(e.target.value)}></input>
        <button onClick={jump}>Jump</button>
        <Slider
          min={0}
          max={25}
          defaultValue={volume + 25}
          onChange={(val: number) => {
            updateVolume(val - 25);
          }}
        />
        <Slider
          min={0}
          max={duration}
          value={time}
          onChange={(val: number) => updateTime(val)}
          onAfterChange={() => {
            if (isPlaying) {
              setTimeout(start, 1000);
            }
          }}
        />
      </div>
      <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
      <div>
        <p>{Math.round(time)}</p>
        <p>length: {duration.toFixed(1)}</p>
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          backgroundColor: 'lightblue',
          padding: '1rem 2rem',
        }}
      >
        {keys.map((key) => (
          <div
            key={key.name}
            style={{
              padding: '3px',
              borderRadius: '2px',
              backgroundColor: key.isActive ? 'white' : 'lightblue',
              position: 'relative',
            }}
          >
            <p
              style={{
                color: key.isActive ? 'lightblue' : 'white',
                fontWeight: 'bold',
              }}
            >
              {key.name}
            </p>
            {fallNotesByKeyName[key.name]?.map((note) => (
              <div key={JSON.stringify(note)} className="falling-note">
                <p style={{ color: 'cyan', fontWeight: 'bold' }}>{note.name}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
