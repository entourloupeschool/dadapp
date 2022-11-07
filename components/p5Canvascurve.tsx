import React, { ChangeEvent, useRef, useState, useEffect } from 'react';
import type { ReactNode } from "react";
import p5 from "p5";
import styles from '../styles/Home.module.css';
import p5Types from 'p5';
import { useRouter } from 'next/router';

type colorType = {
    value: string;
    label: string;
    rgb: string;
};

const colors: colorType[] = [
    {value: 'red', label: 'Red', rgb: 'rgb(255, 0, 0)'},
    {value: 'green', label: 'Green', rgb: 'rgb(0, 204, 0)'},
    {value: 'blue', label: 'Blue', rgb: 'rgb(0, 0, 255)'},
    {value: 'yellow', label: 'Yellow', rgb: 'rgb(255, 204, 0)'},
    {value: 'orange', label: 'Orange', rgb: 'rgb(255, 102, 0)'},
    {value: 'purple', label: 'Purple', rgb: 'rgb(153, 0, 204)'},
    {value: 'black', label: 'Black', rgb: 'rgb(0, 0, 0)'},
    {value: 'white', label: 'White', rgb: 'rgb(255, 255, 255)'},
    {value: 'brown', label: 'Brown', rgb: 'rgb(139,69,19)'},
    {value: 'grey', label: 'Grey', rgb: 'rgb(128, 128, 128)'},
    {value: 'pink', label: 'Pink', rgb: 'rgb(255, 153, 204)'}
];

const shuffleOrderOptions: {key: number, value: number, label: string}[] = [];
const weightStroke: {value: number, label: number}[] = [];

for (let i = 1; i < 18; i++) {
    weightStroke.push({value: i, label: i});
};

for (let i = 1; i < 4; i++) {
    shuffleOrderOptions.push({key: i, value: i, label: i.toString()});
};

type Point = {
    x: number;
    y: number;
    angle: number;
    color: number[];
};

interface P5WrapperProps {
    /** If true, the canvas will resize to window whenever the window is resized */
    autoResizeToWindow?: boolean;
    children?: ReactNode | HTMLElement;
};

function randGauss(min:number, max:number, skew=1) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random() //Converting [0,1) to (0,1)
    while(v === 0) v = Math.random()
    let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
    
    num = num / 10.0 + 0.5 // Translate to 0 -> 1
    if (num > 1 || num < 0) 
      num = randGauss(min, max, skew) // resample between 0 and 1 if out of range
    
    else{
      num = Math.pow(num, skew) // Skew
      num *= max - min // Stretch to fill range
      num += min // offset to min
    }
    return num
};

type coords = {
    x: number;
    y: number;
};

function getRdmCoords(width: number, height: number): coords {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);

    return {x: x, y: y};
};

function greyAccepted(color: number[]): boolean {
    const grey = (color[0] + color[1] + color[2]) / 3;

    if (grey > 200) {
        return false;
    } else {
        return true;
    };
};

// new Point not in the image ? -> new random point
function toNeighbouringPoint(x: number, y: number, previousAngle: number, openness: number, distanceBetweenPoints: number): any{
    const nangle = randGauss(previousAngle-openness, previousAngle+openness);
    const angleRad = nangle * (Math.PI/180);
    const rdmx = Math.floor(x + Math.cos(angleRad) * Math.random() * distanceBetweenPoints);
    const rdmy = Math.floor(y + Math.sin(angleRad) * Math.random() * distanceBetweenPoints);

    return {x: rdmx, y: rdmy, angle: nangle};
};

const traceurs: any[]   = [];

/**
 * A wrapper component for running P5 sketches. Handles rendering and cleanup.
 */
const P5Wrapper = ({ autoResizeToWindow = true, children}: P5WrapperProps): JSX.Element | null => {
    const router = useRouter();
    const canvasImgRef = useRef<HTMLDivElement>(null);
    const canvasDrawingRef = useRef<HTMLDivElement>(null);

    // const [ last, setLast ] = useState<boolean>(true);
    // const [ bkgrdColor, setBkgrdColor ] = useState<string>(colors[6].rgb);
    // const [ strokeWeight, setStrokeWeight ] = useState<number>(4);
    // const [ timeBetweenDraw, setTimeBetweenDraw ] = useState<number>(100);
    // const [ distanceBetweenPoints, setDistanceBetweenPoints ] = useState<number>(50);
    // const [ openness, setOpenness ] = useState<number>(60);
    // const [ shuffleOrder, setShuffleOrder ] = useState<number>(1);

    // const handleChangeBColor = (e: ChangeEvent<HTMLSelectElement>) => {
    //     const value = e.target.value;
    //     setBkgrdColor(value);
    // };

    // const handleChangeSWeight = (e: ChangeEvent<HTMLSelectElement>) => {
    //     const value = e.target.value;
    //     setStrokeWeight(parseInt(value));
    // };

    // const handleChangeTimeBetweenDraw = () => {
    //     const value = parseFloat((document.getElementById('time') as HTMLInputElement).value);
    //     setTimeBetweenDraw(value * 1000);
    // };

    // const handleChangeDistanceBetweenPoints = () => {
    //     const value = parseFloat((document.getElementById('distance') as HTMLInputElement).value);
    //     setDistanceBetweenPoints(value);
    // };

    // const handleChangeOpenness = () => {
    //     const value = parseFloat((document.getElementById('openness') as HTMLInputElement).value);
    //     setOpenness(value);
    // };
    
    // const handleChangeShuffleOrder = () => {
    //     const value = parseFloat((document.getElementById('shuffle') as HTMLInputElement).value);
    //     setShuffleOrder(value);
    // };

    // const handleMode = () => {
    //     setLast(!last);
    // };

    // useEffect(() => {
    //     const sketchImg = (p: p5Types) => {
    //         let img: any;

    //         //See annotations in JS for more information
    //         p.preload = () => {
    //             img = p.loadImage('./p5images/zoe.jpg');
    //         };

    //         p.setup = () => {
    //             img.resize(0, canvasImgRef.current!.clientHeight);
    //             p.createCanvas(img.width, img.height);
    //             p.image(img, 0, 0);
    //             p.loadPixels();

    //             const x = img.width / 2;
    //             const y = img.height / 2;

                // // insert a first point in traceurs then base on it
                // const initPoint = greyEnough(x, y);
                // traceurs.push(
                //     {
                //         x: initPoint.x,
                //         y: initPoint.y,
                //         color: initPoint.color,
                //     }
                // );

                // setTimeout(() => {saveTraceurs();}, timeBetweenDraw);
            // };

            

            // function greyEnough(x: number, y: number): any {
            //     const nPoint = toNeighbouringPoint(x, y, 0, openness, distanceBetweenPoints);

            //     const color = p.get(x, y);

            //     console.log(color);

            //     if (greyAccepted(color)) {
            //         return {x: x, y: y, color: color};
            //     } else {
            //         return greyEnough(x, y);
            //     }
            // };
            
            // function saveTraceurs(): void {
            //     let nPoint: Point;
            //     if(last){
            //         const lastPoint = traceurs[traceurs.length - 1];
            //         nPoint = toNeighbouringPoint(lastPoint.x, lastPoint.y, lastPoint.angle, openness, distanceBetweenPoints);
            //         let threshold = 0;
            //         while (nPoint.x < 0 || nPoint.x > img.width || nPoint.y > img.height || nPoint.y < 0) {
            //             console.log('entered while');
            //             nPoint.angle += Math.random() * 360;
            //             nPoint = toNeighbouringPoint(nPoint.x, nPoint.y,  nPoint.angle, openness, distanceBetweenPoints);
                        
            //             if (threshold++ > 1000) {
            //                 nPoint = toNeighbouringPoint(img.width/2, img.height/2, nPoint.angle, openness, distanceBetweenPoints);
            //                 break;
            //             };
    
            //         };
            //     }else{
            //         nPoint = toNeighbouringPoint(Math.random() * img.width, Math.random() * img.height, Math.random() * 360, openness, distanceBetweenPoints);
            //     };

            //     traceurs.push(
            //         {
            //             x: nPoint.x,
            //             y: nPoint.y,
            //             color: nPoint.color,
            //         }
            //     );

            //     setTimeout(() => {saveTraceurs();}, timeBetweenDraw);
            // };

    //     };

    //     const canvasImg = new p5(sketchImg, canvasImgRef.current!);

    //     return () => {
    //         canvasImg.remove();
    //     };

    // }, [ router.events, timeBetweenDraw, distanceBetweenPoints, openness, strokeWeight, shuffleOrder, timeBetweenDraw, last ]);

    // useEffect(() => {
    //     const sketchDrawing = (p: p5Types) => {
    //         let img: any;
    //         let ctx : any;

    //         //See annotations in JS for more information
    //         p.preload = () => {
    //             img = p.loadImage('./p5images/zoe.jpg');
    //         };

    //         p.setup = () => {
    //             img.resize(0, canvasImgRef.current!.clientHeight);
    //             p.createCanvas(img.width, img.height);
    //             ctx = p.drawingContext;

    //             setTimeout(drawTraceurs, timeBetweenDraw);
    //         };

    //         function gradientLine(ctx: any, x1: number, y1: number, x2: number, y2: number, c1: number[], c2: number[]) {
    //             const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    //             const currentColor = p.color(c1);
    //             const nextColor = p.color(c2);

    //             gradient.addColorStop(0, currentColor);
    //             gradient.addColorStop(1, nextColor);
    //             ctx.strokeStyle = gradient;
    //             p.strokeWeight(strokeWeight);
    //             ctx.beginPath();
    //             ctx.moveTo(x1, y1);
    //             ctx.lineTo(x2, y2);
    //             ctx.stroke();
    //         };

    //         function drawPairwise(current: Point, next: Point): void {
    //             gradientLine(ctx, current.x, current.y, next.x, next.y, current.color, next.color);
    //         };

    //         function pairwise(arr: Array<Point>, func: Function, skips: number = 1): void{
    //             for(var i=0; i < arr.length - skips; i++){
    //                 func(arr[i], arr[i + skips])
    //             };
    //         };
            
    //         function drawTraceurs(): void {
    //             p.background(bkgrdColor);
    //             if ( traceurs[0] !== undefined ) {
    //                 pairwise(traceurs, drawPairwise, shuffleOrder);

    //                 setTimeout(drawTraceurs, timeBetweenDraw);
    //             };
    //         };

    //     };

    //     const canvasDrawing = new p5(sketchDrawing, canvasDrawingRef.current!);

    //     return () => {
    //         canvasDrawing.remove();
    //     };

    // }, [ router.events, bkgrdColor, strokeWeight, shuffleOrder, timeBetweenDraw, distanceBetweenPoints, last ]);

    return (
        <>
        <section>
            <div className={styles.gridedContainer}>
                {/* <div ref={canvasImgRef} className={styles.canvasContainer}>
                </div>
                <div ref={canvasDrawingRef} className={styles.canvasContainer}>
                </div> */}
            </div>
        </section>
        </>
    );


};

export default P5Wrapper;