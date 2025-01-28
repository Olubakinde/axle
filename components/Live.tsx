/* eslint-disable @typescript-eslint/no-explicit-any */
import { useBroadcastEvent, useEventListener, useMyPresence, useOthers } from "@liveblocks/react/suspense"
import LiveCursors from "./cursor/LiveCursors"
import React, { useCallback, useEffect, useState } from "react";
import CursorChat from "./cursor/CursorChat";
import { CursorMode, CursorState, Reaction, ReactionEvent } from "@/types/type";
import ReactionSelector from "./reaction/ReactionButton";
import FlyingReaction from "./reaction/FlyingReaction";
import useInterval from "@/hooks/useInterval";
import { v4 as uuidv4 } from 'uuid';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
  } from "@/components/ui/context-menu"
import { shortcuts } from "@/constants";
  

type Props = {
    canvasRef: React.RefObject<HTMLCanvasElement | null>
    undo: () => void;
    redo: () => void;
}


const Live = ({ canvasRef, undo, redo }: Props) => {
    const others = useOthers();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [{ cursor }, updateMyPresence] = useMyPresence() as any;

    const [cursorState, setCursorState] = useState<CursorState>({
        mode: CursorMode.Hidden,
    }) 

    const broadcast = useBroadcastEvent();

    useInterval(() => {
        setReaction(() => reaction.filter((r: { timeStamp: number; }) => r.timeStamp
        > Date.now() - 4000
        ))
    }, 1000)

    useInterval(() => {
        if (cursorState.mode === CursorMode.Reaction && 
            cursorState.isPressed && cursor) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setReaction((reactions: any[]) => reactions.concat([
                    {
                        id: uuidv4(),
                        point: { x: cursor.x, y: cursor.y},
                        value: cursorState.reaction,
                        timestamp: Date.now(),
                    }
                ]))
                broadcast({
                    x: cursor.x,
                    y: cursor.y,
                    value: cursorState.reaction,
                })
            }
    }, 100);

    useEventListener((eventData: { event: ReactionEvent; }) => {
        const event = eventData.event as ReactionEvent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setReaction((reactions: any[]) =>
          reactions.concat([
            {
              point: { x: event.x, y: event.y },
              value: event.value,
              timestamp: Date.now(),
            },
          ])
        );
      });
    

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [reaction, setReaction] = useState<Reaction[]>([]) as any

    const handlePointerMove = useCallback((event: React.PointerEvent) => {
        event.preventDefault();

        if(cursor === null || cursorState.mode !== CursorMode.ReactionSelector){
            const x = event.clientX -  event.currentTarget.getBoundingClientRect().x;
            const y = event.clientY -  event.currentTarget.getBoundingClientRect().y;
    
            updateMyPresence({ cursor: { x, y } });
        }
    }, [])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePointerLeave = useCallback((event: React.PointerEvent) => {
        setCursorState({ mode: CursorMode.Hidden})

        updateMyPresence({ cursor: null, message: null });
    }, [])


    const handlePointerDown = useCallback((event: React.PointerEvent) => {
        const x = event.clientX -  event.currentTarget.getBoundingClientRect().x;
        const y = event.clientY -  event.currentTarget.getBoundingClientRect().y;

        updateMyPresence({ cursor: { x, y } });

        setCursorState((state: CursorState) => 
            cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true}: state);
    }, [cursorState.mode, setCursorState])

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handlePointerUp = useCallback((event: React.PointerEvent) => {
        setCursorState((state: CursorState) => 
            cursorState.mode === CursorMode.Reaction ? {...state, isPressed: true}: state);
    }, [cursorState.mode, setCursorState])

    useEffect(() => {
        const onKeyUp = (e: KeyboardEvent) => {
            if (e.key === '/'){
                setCursorState({
                    mode: CursorMode.Chat,
                    previousMessage: null,
                    message: ''
                })
            } else if (e.key === 'Escape') {
                updateMyPresence({ message: ''})
                setCursorState({
                    mode: CursorMode.Hidden
                })
            } else if (e.key === 'e'){
                setCursorState({
                    mode: CursorMode.ReactionSelector,
                })
            }
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if(e.key === '/'){
                e.preventDefault();
            }
        }

        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('keydown', onKeyDown);
        }
    }, [updateMyPresence])

    const setReactionss = useCallback((reaction: string) => {
        {
            setCursorState({ mode: CursorMode.Reaction, reaction, isPressed: false})
        }
    }, [])

    const handleContextMenuClick = useCallback((key: string) => {
        switch (key) {
            case "Chat":
                setCursorState({
                  mode: CursorMode.Chat,
                  previousMessage: null,
                  message: "",
                });
                break;

                case "Reactions":
                    setCursorState({ mode: CursorMode.ReactionSelector });
                    break;
            
                  case "Undo":
                    undo();
                    break;
            
                  case "Redo":
                    redo();
                    break;
        
            default:
                break;
        }
    }, [])


  return (
    <ContextMenu>
    <ContextMenuTrigger
    id="canvas"
    onPointerMove={handlePointerMove}
    onPointerLeave={handlePointerLeave}
    onPointerDown={handlePointerDown}
    onPointerUp={handlePointerUp}
    className="h-[100vh] w-full flex justify-center items-center text-center"
    >
        <canvas ref={canvasRef} />

        {reaction.map((r: { timestamp: number; point: { x: number; y: number; }; value: string; }, index: any) => (
        <FlyingReaction
            key={`${r.timestamp}-${index}`} // Ensures uniqueness
            x={r.point.x}
            y={r.point.y}
            timestamp={r.timestamp}
            value={r.value}
        />
        ))}


        { cursor && (
            <CursorChat 
            cursor={cursor}
            cursorState={cursorState}
            setCursorState={setCursorState}
            updateMyPresence={updateMyPresence}
            />
        )}

        {cursorState.mode === CursorMode.ReactionSelector && (
            <ReactionSelector 
                setReaction={setReactionss}
            />
        )}

        <LiveCursors others={others}/> 

    </ContextMenuTrigger>      
    <ContextMenuContent className="right-menu-content">
        {shortcuts.map((item) => (
            <ContextMenuItem key={item.key} onClick={() => handleContextMenuClick(item.name)}
            className="right-menu-item">
                <p>{item.name}</p>
                <p className="text-xs text-primary-grey-300">
                    {item.shortcut}
                </p>
            </ContextMenuItem>
        ))}
    </ContextMenuContent>
    </ContextMenu>       
  )
}

export default Live

