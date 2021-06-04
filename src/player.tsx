import React, { FC, useEffect, useRef, useState } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { Note } from '@tonejs/midi/dist/Note';

const genKeyNames = () => {
  const keyNames = [
    'C',
    'C#',
    'D',
    'D#',
    'E',
    'F',
    'F#',
    'G',
    'G#',
    'A',
    'A#',
    'B',
  ];

  const keys = [];
  for (let i = 1; i <= 7; i++) {
    for (const name of keyNames) {
      keys.push(`${name}${i}`);
    }
  }

  return keys;
};

const keyNames = genKeyNames();

const usePlayer = (file: string) => {
  const [input, setInput] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [duration, setDuration] = useState(0);
  const [keys, setKeys] = useState(
    keyNames.map((name) => ({ name, isActive: false }))
  );
  const [fallNotes, setFallNotes] = useState<Note[]>([]);

  const synthRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    let synth: Tone.PolySynth;
    const schedules: {
      [key: string]: {
        id: number;
        notes: Note[];
      };
    } = {};
    const clearNoteIds = new Set<NodeJS.Timeout>();

    const init = async () => {
      // read the file
      const midi = await Midi.fromUrl(file);

      // duration
      setDuration(midi.duration);
      schedules[midi.duration] = {
        id: Tone.Transport.schedule(() => {
          setIsPlaying(false);
          setIsDone(true);
        }, midi.duration),
        notes: [],
      };

      // setup
      Tone.Transport.pause();
      synth = new Tone.PolySynth(Tone.Synth).toDestination().sync();

      const notes: Note[] = [];
      const notesByTime: { [key: string]: Note[] } = {};
      for (const track of midi.tracks) {
        for (const note of track.notes) {
          notes.push(note);
          if (!notesByTime[note.time]) {
            notesByTime[note.time] = [];
          }
          notesByTime[note.time].push(note);

          synth.triggerAttackRelease(
            note.name,
            note.duration,
            note.time,
            note.velocity
          );
        }
      }

      for (const key in notesByTime) {
        const time = parseFloat(key);

        // schedule state update
        schedules[time] = {
          id: Tone.Transport.schedule(() => {
            // active notes
            const activeNotes = notes.filter(
              (note) => note.time <= time && note.time + note.duration > time
            );

            // falling notes
            setFallNotes((fallNotes) => {
              return [...fallNotes, ...notesByTime[key]];
            });
            const clearNoteId = setTimeout(() => {
              setFallNotes((fallNotes) => {
                const nextNotes = fallNotes.filter((note) => note.time > time);
                return nextNotes;
              });
              clearNoteIds.delete(clearNoteId);
            }, 2000);
            clearNoteIds.add(clearNoteId);

            // active keys
            setKeys((keys) => {
              const activeNotesSet = new Set(
                activeNotes.map(({ name }) => name)
              );
              return keys.map((key) => {
                if (activeNotesSet.has(key.name)) {
                  return {
                    ...key,
                    isActive: true,
                  };
                }
                return {
                  ...key,
                  isActive: false,
                };
              });
            });
          }, time),
          notes: [],
        };
      }

      synthRef.current = synth;
    };
    init();

    return () => {
      if (synth) {
        synth.releaseAll();
        synth.disconnect();
        synth.dispose();
        Tone.Transport.stop();
      }
      for (const { id } of Object.values(schedules)) {
        Tone.Transport.clear(id);
      }
      for (const id of Array.from(clearNoteIds)) {
        clearTimeout(id);
      }
    };
  }, [file]);

  const jump = () => {
    const time = parseFloat(input);
    if (synthRef.current && !isNaN(time)) {
      if (time < 0 || time >= duration) {
        return;
      }

      synthRef.current.releaseAll();
      Tone.Transport.pause();
      Tone.Transport.seconds = time;
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const togglePlay = () => {
    if (synthRef.current) {
      if (isPlaying) {
        Tone.Transport.pause();
        synthRef.current.releaseAll();
        setIsPlaying(false);
      } else {
        if (isDone) {
          Tone.Transport.pause();
          Tone.Transport.seconds = 0;
          setIsDone(false);
        }
        Tone.start();
        Tone.Transport.start();
        setIsPlaying(true);
      }
    }
  };

  return {
    input,
    setInput,
    isPlaying,
    isDone,
    duration,
    keys,
    fallNotes,
    jump,
    togglePlay,
    synthRef,
  };
};

interface PlayerProps {
  file: string;
}

export const Player: FC<PlayerProps> = ({ file }) => {
  const {
    input,
    setInput,
    duration,
    isPlaying,
    keys,
    fallNotes,
    jump,
    togglePlay,
  } = usePlayer(file);

  const fallNotesByKeyName: { [key: string]: Note[] } = {};
  for (const fallingNote of fallNotes) {
    if (!fallNotesByKeyName[fallingNote.name]) {
      fallNotesByKeyName[fallingNote.name] = [];
    }
    fallNotesByKeyName[fallingNote.name].push(fallingNote);
  }
  console.log(fallNotesByKeyName);

  return (
    <div className="App">
      <div>
        <input value={input} onChange={(e) => setInput(e.target.value)}></input>
        <button onClick={jump}>Jump</button>
      </div>
      <button onClick={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
      <div>
        <p>{Math.round(Tone.Transport.seconds)}</p>
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
