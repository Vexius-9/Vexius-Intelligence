import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';

export interface VexiusPdfCanvasOverlayProps {
  width: number;
  height: number;
  tool: 'select' | 'draw' | 'rectangle' | 'ellipse' | 'arrow' | 'note' | 'sign' | 'highlight' | 'underline' | 'strikethrough';
  color: string;
}

export function VexiusPdfCanvasOverlay({ width, height, tool, color }: VexiusPdfCanvasOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: tool === 'draw',
      width,
      height,
      selection: true,
    });
    
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
    else if (tool === 'draw' || tool === 'highlight') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = tool === 'highlight' ? `${color}80` : color;
      canvas.freeDrawingBrush.width = tool === 'highlight' ? 15 : 2;
    }
    else if (tool === 'rectangle' || tool === 'ellipse') {
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
