// FILE: ./src/components/specific/DraggableRoom.jsx
import React, { useRef } from 'react';
// --- THIS IS THE FIX ---
// Draggable is a default export, so it must be imported without curly braces.
import Draggable from 'react-draggable'; 
// --- END OF FIX ---
import { ResizableBox } from 'react-resizable';
import { Users, Maximize } from 'lucide-react';

const DraggableRoom = ({ room, onUpdate, onClick }) => {
  const nodeRef = useRef(null);

  // This is called when the drag *stops*
  const onDragStop = (e, data) => {
    onUpdate(room.id, {
      x_coord: Math.round(data.x),
      y_coord: Math.round(data.y),
      // Pass width/height so parent's overlap check works
      width: room.width, 
      height: room.height,
    });
  };

  const onResizeStop = (e, data) => {
    onUpdate(room.id, {
      x_coord: room.x_coord, // <-- Preserve current X
      y_coord: room.y_coord, // <-- Preserve current Y
      width: Math.round(data.size.width),
      height: Math.round(data.size.height),
    });
  };

  return (
    <Draggable
      nodeRef={nodeRef}
      onStop={onDragStop}
      grid={[10, 10]}
      bounds="parent" // Constrain to the blue box
      // We make it a fully CONTROLLED component.
      // The position is set *exactly* from the parent state.
      position={{ x: room.x_coord, y: room.y_coord }}
    >
      <ResizableBox
        ref={nodeRef} // Draggable and ResizableBox share the ref
        width={room.width}
        height={room.height}
        onResizeStop={onResizeStop}
        minConstraints={[50, 50]}
        maxConstraints={[500, 500]}
        // We put the ResizableBox *inside* the Draggable.
        // Draggable passes down its styles (transform) to this box.
        className="absolute p-3 bg-white border-2 border-brand-primary rounded-lg shadow-lg cursor-move hover:shadow-xl flex flex-col justify-between"
        handle={<span className="react-resizable-handle" />} // The corner resize handle
      >
        <div className="flex flex-col h-full">
          {/* Make the content clickable for editing */}
          <div 
            className="flex-grow cursor-pointer"
            onClick={() => onClick(room)}
          >
            <h4 className="font-semibold text-brand-dark text-lg">{room.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-brand-gray">
              <Users className="w-4 h-4" />
              <span className="text-sm">{room.capacity} People</span>
            </div>
          </div>
          <div className="text-xs text-brand-gray flex items-center gap-1 mt-2">
            <Maximize className="w-3 h-3" />
            <span>{Math.round(room.width)}x{Math.round(room.height)}</span>
          </div>
        </div>
      </ResizableBox>
    </Draggable>
  );
};

export default DraggableRoom;