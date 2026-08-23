import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export interface VexiusPdfCanvasOverlayProps {
  width: number;
  height: number;
  tool: 'select' | 'draw' | 'rectangle' | 'ellipse' | 'arrow' | 'note' | 'sign' | 'highlight' | 'underline' | 'strikethrough' | 'eraser';
  color: string;
  initialData?: any;
  onChange?: (data: any) => void;
}

export function VexiusPdfCanvasOverlay({ width, height, tool, color, initialData, onChange }: VexiusPdfCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const isLoadedRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: tool === 'draw',
      width,
      height,
      selection: true,
    });
    
    if (initialData) {
      canvas.loadFromJSON(initialData).then(() => {
        canvas.renderAll();
        isLoadedRef.current = true;
      });
    } else {
      isLoadedRef.current = true;
    }
    
    const notifyChange = () => {
      if (onChange && isLoadedRef.current) {
        onChange(canvas.toJSON());
      }
    };

    canvas.on('object:added', notifyChange);
    canvas.on('object:modified', notifyChange);
    canvas.on('object:removed', notifyChange);
    canvas.on('path:created', notifyChange);
    
    fabricRef.current = canvas;

    return () => {
      canvas.dispose();
    };
  }, []);

  // Update canvas size when dimensions change
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.setDimensions({ width, height });
    }
  }, [width, height]);

  // Handle tool changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Reset settings
    canvas.isDrawingMode = false;
    canvas.selection = false;
    canvas.defaultCursor = 'default';

    // Remove old event listeners
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');

    if (tool === 'select') {
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    } 
    else if (tool === 'eraser') {
      canvas.defaultCursor = 'crosshair';
      let isErasing = false;
      canvas.on('mouse:down', (o: any) => {
        isErasing = true;
        if (o.target) {
          canvas.remove(o.target);
        }
      });
      canvas.on('mouse:move', (o: any) => {
        if (isErasing && o.target) {
          canvas.remove(o.target);
        }
      });
      canvas.on('mouse:up', () => {
        isErasing = false;
      });
    }
    else if (tool === 'draw' || tool === 'highlight' || tool === 'sign') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = tool === 'highlight' ? `${color}80` : color;
      canvas.freeDrawingBrush.width = tool === 'highlight' ? 15 : tool === 'sign' ? 1 : 2;
    }
    else if (tool === 'note') {
      canvas.defaultCursor = 'text';
      canvas.on('mouse:down', (o: any) => {
        if (o.target) return; // Don't create new note if clicking on existing object
        const pointer = canvas.getScenePoint(o.e);
        const text = new fabric.IText('Note', {
          left: pointer.x,
          top: pointer.y,
          fill: color,
          fontSize: 16,
          fontFamily: 'Arial'
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
      });
    }
    else if (['rectangle', 'ellipse', 'underline', 'strikethrough', 'arrow'].includes(tool)) {
      canvas.defaultCursor = 'crosshair';
      let isDown = false;
      let startX = 0;
      let startY = 0;
      let activeShape: fabric.Object | null = null;

      canvas.on('mouse:down', (o: any) => {
        isDown = true;
        const pointer = canvas.getScenePoint(o.e);
        startX = pointer.x;
        startY = pointer.y;

        if (tool === 'rectangle') {
          activeShape = new fabric.Rect({
            left: startX,
            top: startY,
            width: 0,
            height: 0,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2,
            selectable: true,
          });
        } else if (tool === 'ellipse') {
          activeShape = new fabric.Ellipse({
            left: startX,
            top: startY,
            rx: 0,
            ry: 0,
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2,
            selectable: true,
          });
        } else if (['underline', 'strikethrough'].includes(tool)) {
          activeShape = new fabric.Line([startX, startY, startX, startY], {
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2,
            selectable: true,
          });
        } else if (tool === 'arrow') {
          activeShape = new fabric.Path(`M ${startX} ${startY} L ${startX} ${startY}`, {
            fill: 'transparent',
            stroke: color,
            strokeWidth: 2,
            selectable: true,
            objectCaching: false
          });
        }
        
        if (activeShape) canvas.add(activeShape);
      });

      canvas.on('mouse:move', (o: any) => {
        if (!isDown || !activeShape) return;
        const pointer = canvas.getScenePoint(o.e);
        
        if (tool === 'rectangle') {
          const rect = activeShape as fabric.Rect;
          rect.set({ width: Math.abs(startX - pointer.x) });
          rect.set({ height: Math.abs(startY - pointer.y) });
          rect.set({ left: Math.min(pointer.x, startX) });
          rect.set({ top: Math.min(pointer.y, startY) });
        } else if (tool === 'ellipse') {
          const ellipse = activeShape as fabric.Ellipse;
          ellipse.set({ rx: Math.abs(startX - pointer.x) / 2 });
          ellipse.set({ ry: Math.abs(startY - pointer.y) / 2 });
          ellipse.set({ left: Math.min(pointer.x, startX) });
          ellipse.set({ top: Math.min(pointer.y, startY) });
        } else if (['underline', 'strikethrough'].includes(tool)) {
          const line = activeShape as fabric.Line;
          line.set({ x2: pointer.x, y2: pointer.y });
        } else if (tool === 'arrow') {
          const path = activeShape as fabric.Path;
          const dx = pointer.x - startX;
          const dy = pointer.y - startY;
          const angle = Math.atan2(dy, dx);
          const headlen = 15; 
          const p1x = pointer.x - headlen * Math.cos(angle - Math.PI / 6);
          const p1y = pointer.y - headlen * Math.sin(angle - Math.PI / 6);
          const p2x = pointer.x - headlen * Math.cos(angle + Math.PI / 6);
          const p2y = pointer.y - headlen * Math.sin(angle + Math.PI / 6);
          const pathStr = `M ${startX} ${startY} L ${pointer.x} ${pointer.y} M ${pointer.x} ${pointer.y} L ${p1x} ${p1y} M ${pointer.x} ${pointer.y} L ${p2x} ${p2y}`;
          
          path.set({ path: new fabric.Path(pathStr).path });
        }
        canvas.renderAll();
      });

      canvas.on('mouse:up', () => {
        isDown = false;
        if (activeShape) {
          activeShape.setCoords();
          activeShape = null;
        }
      });
    }

  }, [tool, color]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
