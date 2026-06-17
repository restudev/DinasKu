import { useRef, useEffect, useImperativeHandle, forwardRef } from "react";

interface SignatureCanvasProps {
  width?: number;
  height?: number;
  penColor?: string;
  style?: React.CSSProperties;
}

export interface SignatureCanvasRef {
  clear: () => void;
  isEmpty: () => boolean;
  getTrimmedCanvas: () => HTMLCanvasElement | null;
}

const SignatureCanvas = forwardRef<SignatureCanvasRef, SignatureCanvasProps>(
  ({ width = 600, height = 200, penColor = "black", style = {} }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const hasStrokes = useRef(false);

    const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clientX = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
      const clientY = (e as TouchEvent).touches?.[0]?.clientY ?? (e as MouseEvent).clientY;

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.lineWidth = 2;
      ctx.strokeStyle = penColor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const onStart = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        drawing.current = true;
        const { x, y } = getPos(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
      };

      const onMove = (e: MouseEvent | TouchEvent) => {
        e.preventDefault();
        if (!drawing.current) return;
        hasStrokes.current = true;
        const { x, y } = getPos(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
      };

      const onEnd = () => {
        drawing.current = false;
      };

      // Event listeners dengan type assertion yang aman
      canvas.addEventListener("mousedown", onStart as EventListener);
      canvas.addEventListener("mousemove", onMove as EventListener);
      canvas.addEventListener("mouseup", onEnd as EventListener);
      canvas.addEventListener("mouseleave", onEnd as EventListener);

      canvas.addEventListener("touchstart", onStart as EventListener, { passive: false });
      canvas.addEventListener("touchmove", onMove as EventListener, { passive: false });
      canvas.addEventListener("touchend", onEnd as EventListener);

      return () => {
        canvas.removeEventListener("mousedown", onStart as EventListener);
        canvas.removeEventListener("mousemove", onMove as EventListener);
        canvas.removeEventListener("mouseup", onEnd as EventListener);
        canvas.removeEventListener("mouseleave", onEnd as EventListener);
        canvas.removeEventListener("touchstart", onStart as EventListener);
        canvas.removeEventListener("touchmove", onMove as EventListener);
        canvas.removeEventListener("touchend", onEnd as EventListener);
      };
    }, [penColor]);

    useImperativeHandle(ref, () => ({
      clear() {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        hasStrokes.current = false;
      },
      isEmpty() {
        return !hasStrokes.current;
      },
      getTrimmedCanvas() {
        return canvasRef.current;
      },
    }));

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          background: "#fff",
          width: "100%",
          display: "block",
          touchAction: "none",
          ...style,
        }}
      />
    );
  }
);

export default SignatureCanvas;