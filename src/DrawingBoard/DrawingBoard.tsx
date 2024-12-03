import { ChangeEvent, useEffect, useState } from "react";
import styles from "./DrawingBoard.module.css";

interface Point {
    x: number;
    y: number;
}

const CANVAS_DATA_STORAGE_KEY = "canvasData";
const CANVAS_WIDTH_STORAGE_KEY = "canvasDimensionW";
const CANVAS_HEIGHT_STORAGE_KEY = "canvasDimensionH";

function DrawingBoard() {
    const [canvas, setCanvas] = useState<HTMLCanvasElement>();
    const [width, setWidth] = useState(400);
    const [height, setHeight] = useState(400);
    const ctx = canvas?.getContext("2d");
    const [isDrawing, setIsDrawing] = useState(false);
    const [prevXY, setPrevXY] = useState<Point | null>(null);
    const [resizingCanvasData, setResizingCanvasData] = useState("");

    useEffect(() => {
        loadBoardDimensions();
        setTimeout(loadBoard);
    }, [canvas]);

    useEffect(() => {
        if (resizingCanvasData) {
            const image = new Image();
            image.src = resizingCanvasData;
            ctx?.drawImage(image, 0, 0);
        }
    }, [width, height]);

    function handleRef(el: HTMLCanvasElement) {
        setCanvas(el);
    }

    function clearBoard() {
        if (ctx) {
            ctx.fillStyle = "rgb(255 255 255)";
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    function saveBoard() {
        const data = canvas!.toDataURL();
        localStorage.setItem(CANVAS_DATA_STORAGE_KEY, data);
        localStorage.setItem(CANVAS_WIDTH_STORAGE_KEY, `${width}`);
        localStorage.setItem(CANVAS_HEIGHT_STORAGE_KEY, `${height}`);
    }

    function loadBoardDimensions() {
        const localWidth = Number(localStorage.getItem(CANVAS_WIDTH_STORAGE_KEY));
        const localHeight = Number(localStorage.getItem(CANVAS_HEIGHT_STORAGE_KEY));
        if (localWidth && localHeight) {
            setWidth(localWidth);
            setHeight(localHeight);
        }
        setTimeout(clearBoard);
    }

    function loadBoard() {
        const data = localStorage.getItem(CANVAS_DATA_STORAGE_KEY);
        if (!data) {
            clearBoard();
            return;
        }
        if (data && ctx) {
            const image = new Image(width, height);
            image.src = data;
            ctx.drawImage(image, 0, 0);
        }
    }

    function download() {
        const data = canvas!.toDataURL();
        const anchor = document.createElement("a");
        anchor.href = data;
        anchor.download = "image.png";
        anchor.click();
        document.removeChild(anchor);
    }

    function handlePointerDown() {
        setIsDrawing(true);
    }

    function handlePointerUp() {
        setIsDrawing(false);
        setPrevXY(null);
    }

    function handleStartResize() {
        const data = canvas!.toDataURL();
        console.log(data);
        setResizingCanvasData(data);
        document.addEventListener("pointerup", handleEndResize);
        document.addEventListener("pointermove", handleResize);
    }

    function handleResize(ev: PointerEvent) {
        if (!canvas) {
            return;
        }

        const { clientX, clientY } = ev;
        const { x: rootX, y: rootY } = canvas.getBoundingClientRect();
        
        const minWidth = 300;
        const minHeight = 150;
        const maxWidth = document.body.clientWidth * 0.9;
        const maxHeight = document.body.clientHeight * 0.6;
        setWidth(
            Math.min(
                maxWidth,
                Math.max(minWidth, clientX - rootX)
            )
        );
        setHeight(
            Math.min(
                maxHeight,
                Math.max(minHeight, clientY - rootY)
            )
        );
    }

    function handleEndResize() {
        document.removeEventListener("pointerup", handleEndResize);
        document.removeEventListener("pointermove", handleResize);
        setResizingCanvasData("");
    }

    function handlePointerMove(ev: React.PointerEvent<HTMLCanvasElement>) {
        if (!isDrawing || !ctx || !canvas) {
            return;
        }

        const { clientX, clientY } = ev;
        const { x: rootX, y: rootY } = canvas.getBoundingClientRect();
        const canvasX = clientX - rootX;
        const canvasY = clientY - rootY;

        if (prevXY) {
            const { x: prevX, y: prevY } = prevXY;
            let startX = prevX;
            let startY = prevY;
            const endX = canvasX;
            const endY = canvasY;
            let stepCount = Math.max(
                Math.abs(endY - startY),
                Math.abs(endX - startX)
            );
            const stepX = (endX - startX) / stepCount;
            const stepY = (endY - startY) / stepCount;
            while (stepCount > 0) {
                ctx.fillStyle = "rgb(0 0 0)";
                ctx.fillRect(startX, startY, 2, 2);
                startX += stepX;
                startY += stepY;
                stepCount--;
            }
        }
        setPrevXY({ x: canvasX, y: canvasY });
    }

    function handleFileUpload(ev: ChangeEvent<HTMLInputElement>) {
        const file = ev.target.files![0];
        const image = new Image();
        const maxWidth = document.body.clientWidth * 0.9;
        const maxHeight = document.body.clientHeight * 0.6;
        image.src = URL.createObjectURL(file);
        image.onload = () => {
            const aspectRatio = image.width / image.height;
            let newWidth = Math.min(image.width, maxWidth);
            let newHeight = newWidth / aspectRatio;
            if (newHeight > maxHeight) {
                newWidth = maxHeight * aspectRatio;
                newHeight = maxHeight;
            }
            image.width = newWidth;
            image.height = newHeight;
            setWidth(newWidth);
            setHeight(newHeight);
            setTimeout(() => {
                ctx?.drawImage(image, 0, 0, newWidth, newHeight);
            });
        };
    }

    return (
        <div className={styles.drawingBoard}>
            <div className={styles.canvasContainer} style={{ width, height }}>
                <canvas
                    ref={handleRef}
                    width={width}
                    height={height}
                    onPointerDown={handlePointerDown}
                    onPointerUp={handlePointerUp}
                    onPointerOut={handlePointerUp}
                    onPointerMove={handlePointerMove}/>
                <div
                    className={styles.resizer}
                    onPointerDown={handleStartResize}/>
            </div>
            <div className={styles.controls}>
                <button onClick={clearBoard}>
                    Clear
                </button>
                <button onClick={saveBoard}>
                    Save
                </button>
                <button onClick={download}>
                    Download
                </button>
                <input type="file" accept="image/*" onChange={handleFileUpload}/>
            </div>
        </div>
    );
}

export default DrawingBoard;