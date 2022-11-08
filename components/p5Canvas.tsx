import React, { useRef, useEffect } from 'react';
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
const weightStroke: {value: number, label: string}[] = [];

for (let i = 1; i < 18; i++) {
    weightStroke.push({value: i, label: i.toString()});
};

for (let i = 1; i < 4; i++) {
    shuffleOrderOptions.push({key: i, value: i, label: i.toString()});
};

const timeBetweenDrawings = Math.floor(Math.random() * 700) + 1;
const distanceBetweenPointsInit = Math.floor(Math.random() * 390)+1;
const initAngle = Math.floor(Math.random() * 360);
const opennessInit = Math.floor(Math.random() * 350) + 1;
const weightStrokeInit: number = Math.floor(Math.random() * 16) + 1;

const CPDposition = {
    x: 100,
    y: 100,
    spaceBetween: 55,
    widthSize: 120,
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

function getCorrectAngle(angle: number): number {
    while (angle > 360) {
        angle = angle - 360;
    };
    return angle;
};

function getRadFromAngle(angle: number): number {
    return angle * (Math.PI/180);
};

// new Point not in the image ? -> new random point
function toNeighbouringPoint(x: number, y: number, previousAngle: number, openness: number, distanceBetweenPoints: number): any {
    let angle = Math.floor(randGauss(previousAngle-openness, previousAngle+openness) * 100) / 100;
    if (angle > 360) {
       angle = getCorrectAngle(angle); 
    };
    const angleRad = getRadFromAngle(angle);
    const rdmx = Math.floor(x + Math.cos(angleRad) * Math.random() * distanceBetweenPoints);
    const rdmy = Math.floor(y + Math.sin(angleRad) * Math.random() * distanceBetweenPoints);

    return {x: rdmx, y: rdmy, angle: angle};
};

let traceurs: any[]   = [];

function thisButNotZero(x: number): number {
    if (x <= 0) {
        return 1;
    } else {
        return x;
    };
};

/**
 * A wrapper component for running P5 sketches. Handles rendering and cleanup.
 */
const P5Wrapper = ({ autoResizeToWindow = true, children}: P5WrapperProps): JSX.Element | null => {
    const router = useRouter();
    const canvasImgRef = useRef<HTMLDivElement>(null);
    const canvasDrawingRef = useRef<HTMLDivElement>(null);
    
    let canvasDrawing: p5Types | null = null;

    let drawingTimeout: ReturnType<typeof setTimeout>;
    let imageTimeout: ReturnType<typeof setTimeout>;


    const sketchImg = (p: p5Types) => {
        function handleFile(file: any) {
            const img = p.loadImage(file.data, () => {
                img.resize(canvasImgRef.current!.clientWidth, 0);
                p.createCanvas( img.width, img.height );
                p.image(img, 0, 0);
            });
            

            p.loadPixels();

            // insert a first point in traceurs then base on it
            const initPoint = toNeighbouringPoint(img.width/2, img.height/2, initAngle, opennessInput.value(), distanceBetweenPointsInput.value());
            traceurs.push(
                {
                    x: initPoint.x,
                    y: initPoint.y,
                    color: p.get(initPoint.x, initPoint.y),
                    angle: initPoint.angle,
                    size: parseInt(strokeWeightSelector.value()),
                    shape: modeSelector.value(),
                    openness: parseInt(opennessInput.value()),
                    distanceBetweenPoints: thisButNotZero(parseInt(distanceBetweenPointsInput.value())),
                }
            );
            
            imageTimeout = setTimeout(() => {
                    saveTraceurs(img);
            }, parseInt(timeBetweenDrawInput.value()));

            loadDrawingCanvas(img);
        };

        function loadDrawingCanvas(img: any) {
            const sketchDrawing = (p: p5Types) => {
                let bChanged = false;
                let ctx : ReturnType<typeof p.drawingContext>;
                // Background color selector
                const handleChangeBColor = () => {
                    p.background(bColorSelector.value());
                    bChanged = true;
                };
                const bColorSelector: any = p.createSelect();
                bColorSelector.parent('bColorCPD');
                colors.map((color) => {
                    bColorSelector.option(color.label);
                });
                bColorSelector.selected('white');
                bColorSelector.changed(() => {
                    handleChangeBColor();
                });


                // Clear button
                const clearButton: any = p.createButton('clear');
                clearButton.parent('clearCPD');
                clearButton.id('clear');
                clearButton.mousePressed(() => {
                    clearDrawing();
                });
        
                p.setup = () => {
                    img.resize(canvasImgRef.current!.clientWidth, canvasDrawingRef.current!.clientHeight);
                    const cnv = p.createCanvas(img.width, img.height);
                    cnv.mouseClicked(() => {
                        saveSelfPixel();
                    });
                    ctx = p.drawingContext;
                };
        
                p.draw = () => {
                    if (bChanged) {
        
                        // if background color changed, redraw all points
                        traceurs.map((currentTraceur, currentIndex) => {
                            drawFromPoint(currentTraceur, currentIndex);
                        });
                        bChanged = false;
                    }else{
                        // if background color didn't change, only draw the last point
                        drawFromPoint(traceurs[traceurs.length - 1], traceurs.length - 1);
                    };
                };
        
                function drawFromPoint(currentTraceur: any, currentIndex: any): void {
                    if (currentTraceur.shape === 'pixel') {
                        p.loadPixels();
                        for (let i = -currentTraceur.size; i <= currentTraceur.size; i++) {
                            for (let j = -currentTraceur.size; j <= currentTraceur.size; j++) {
                                p.set(currentTraceur.x + i, currentTraceur.y + j, currentTraceur.color);
                            };
                        }
                        p.updatePixels();
        
                    }else if (currentTraceur.shape === 'ear') {
                        const nPoint = toNeighbouringPoint(currentTraceur.x, currentTraceur.y, currentTraceur.angle, currentTraceur.openness, currentTraceur.distanceBetweenPoints);
                        const nextTraceur = {
                            x: nPoint.x,
                            y: nPoint.y,
                            color: p.get(nPoint.x, nPoint.y),
                            angle: nPoint.angle,
                            size: currentTraceur.size,
                            shape: currentTraceur.shape
                        };
                        pairwise([currentTraceur, nextTraceur], drawLinePairwise);
        
                    }else if (currentTraceur.shape === 'line') {
                        // Programm line draw
                        const previousPoint = traceurs[currentIndex - 1];
                        if (previousPoint) {
                            drawLinePairwise(previousPoint, currentTraceur);
                        };
                    };
                }
        
                function saveSelfPixel(): void {
                    traceurs.push(
                        {
                            x: p.mouseX,
                            y: p.mouseY,
                            color: p.get(p.mouseX, p.mouseY),
                            angle: traceurs[traceurs.length - 1].angle,
                            size: traceurs[traceurs.length - 1].size,
                            shape: 'pixel'
                        }
                    )
                };
        
                function gradientLine(ctx: any, x1: number, y1: number, x2: number, y2: number, c1: number[], c2: number[]) {
                    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                    const currentColor = p.color(c1);
                    const nextColor = p.color(c2);
        
                    gradient.addColorStop(0, currentColor);
                    gradient.addColorStop(1, nextColor);
                    ctx.strokeStyle = gradient;
        
                    p.strokeWeight(traceurs[traceurs.length - 1].size);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke(); 
                };
        
                function drawLinePairwise(current: Point, next: Point): void {
                    gradientLine(ctx, current.x, current.y, next.x, next.y, current.color, next.color);
                };
        
                function pairwise(arr: Array<Point>, func: Function, skips: number = 1): void{
                    console.log(arr)
                    for(var i=0; i < arr.length - skips; i++){
                        console.log(arr[i], arr[i+skips]);
                        func(arr[i], arr[i + skips])
                    };
                };

                function clearDrawing(): void {
                    p.background(bColorSelector.value());
                    traceurs = [traceurs[0]];
                };
            };

            canvasDrawing = new p5(sketchDrawing, canvasDrawingRef.current!);
        };
        
        let img: ReturnType<typeof p.loadImage>;

        // StrokeWeight selector
        const strokeWeightSelector: any = p.createSelect()
        strokeWeightSelector.parent('strokeWeightCPD');
        weightStroke.map((weight) => {
            strokeWeightSelector.option(weight.label);
        });
        strokeWeightSelector.selected(weightStrokeInit);

        // Timebetween draw input
        const timeBetweenDrawInput: any = p.createInput();
        timeBetweenDrawInput.parent('timeBetweenDrawCPD');
        timeBetweenDrawInput.addClass('inputNumberP5');
        timeBetweenDrawInput.size(CPDposition.widthSize);
        timeBetweenDrawInput.id('timeBetweenDraw');
        timeBetweenDrawInput.attribute('type', 'number');
        timeBetweenDrawInput.attribute('min', '0');
        timeBetweenDrawInput.value(timeBetweenDrawings.toString());

        // Distance between points input
        const distanceBetweenPointsInput: any = p.createSlider(1, 400, distanceBetweenPointsInit);
        distanceBetweenPointsInput.addClass('inputNumberP5');
        distanceBetweenPointsInput.parent('distanceBetweenPointsCPD');
        distanceBetweenPointsInput.size(CPDposition.widthSize);
        distanceBetweenPointsInput.id('distance');


        // Openness input
        const opennessInput: any = p.createSlider(1,360, opennessInit);
        opennessInput.addClass('inputNumberP5');
        opennessInput.parent('opennessCPD');
        opennessInput.size(CPDposition.widthSize);
        opennessInput.id('openness');


        // Mode last input
        const modeLastInput: any = p.createCheckbox('snake mode', true);
        modeLastInput.id('last');
        modeLastInput.parent('modeLastCPD');

        // pixel or Line mode selector
        const modeSelector: any = p.createSelect();
        modeSelector.parent('modeCPD');
        modeSelector.option('pixel');
        modeSelector.option('ear');
        modeSelector.option('line');
        modeSelector.selected('pixel');

        // Play button
        const playButton: any = p.createCheckbox('play', false);
        playButton.id('play');
        playButton.parent('playCPD');

        p.setup = () => {
            // Image upload input
            const fileInput = p.createFileInput(handleFile);
            fileInput.id('fileInput');
            fileInput.parent('fileInputCPD');
        };
        
        function saveTraceurs(img: any): void {
            if (playButton.checked()) {
                const chosenDistanceBetweenPoints = parseInt(distanceBetweenPointsInput.value());
                const chosenOpenness = parseInt(opennessInput.value());

                let nPoint: Point;
                if( modeLastInput.checked() ) {
                    const lastPoint = traceurs[traceurs.length - 1];
                    nPoint = toNeighbouringPoint(lastPoint.x, lastPoint.y, lastPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                    let threshold = 0;
                    while (nPoint.x < 0 || nPoint.x > img.width || nPoint.y > img.height || nPoint.y < 0) {
                        console.log('entered while');
                        nPoint.angle += Math.random() * 360;
                        nPoint = toNeighbouringPoint(nPoint.x, nPoint.y,  nPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                        
                        if (threshold++ > 1000) {
                            nPoint = toNeighbouringPoint(img.width/2, img.height/2, nPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                            break;
                        };

                    };
                }else{
                    nPoint = toNeighbouringPoint(Math.random() * img.width, Math.random() * img.height, Math.random() * 360, chosenOpenness, chosenDistanceBetweenPoints);
                };

                // See if i should implement ckecking if the point is already in the array
                traceurs.push(
                    {
                        x: nPoint.x,
                        y: nPoint.y,
                        color: p.get(nPoint.x, nPoint.y),
                        angle: nPoint.angle,
                        size: parseInt(strokeWeightSelector.value()),
                        shape: modeSelector.value(),
                        openness: parseInt(opennessInput.value()),
                        distanceBetweenPoints: thisButNotZero(parseInt(distanceBetweenPointsInput.value())),
                    }
                );
            };

            imageTimeout = setTimeout(() => {
                saveTraceurs(img);
            }, parseInt(timeBetweenDrawInput.value()));
        };
    };

    useEffect(() => {
        const canvasImg = new p5(sketchImg, canvasImgRef.current!);
        // canvasImg.resizeCanvas(canvasImgRef.current!.clientWidth, canvasImgRef.current!.clientHeight);
        // canvasDrawing?.resizeCanvas(canvasDrawingRef.current!.clientWidth, canvasDrawingRef.current!.clientHeight);

        if (autoResizeToWindow) {
            canvasImg.windowResized = () => {
                canvasImg.resizeCanvas(canvasImgRef.current!.clientWidth, canvasImgRef.current!.clientHeight);
            };
        };

        return () => {
            canvasImg.remove();
        };

    }, [ router.events, canvasImgRef ]);

    return (
        <>
        <section>
            <div className={styles.gridedContainer}>
                <div ref={canvasImgRef} className={styles.canvasContainer}>
                </div>
                <div ref={canvasDrawingRef} className={styles.canvasContainer}>
                </div>
                <div className={styles.card}>
                    <p>
                        <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://p5js.org/">p5.js</a> - is a JS client-side library for creating graphic and interactive experiences, based on the core principles of Processing.
                        Changing the background with a lot of points can be slow, so be patient. Click on the drawing canvas to set new points.
                    </p>
                </div> 
                <div className={styles.card}>
                    <div id="fileInputCPD"></div>
                    <div id="playCPD"></div>
                    <div id="strokeWeightCPD">set stroke weight : </div>
                    <div id="distanceBetweenPointsCPD">set max distance between points : </div>
                    <div id="timeBetweenDrawCPD">set time between draws (ms) : </div>
                    <div id="modeCPD">set mode : </div>
                    <div id="modeLastCPD"></div>
                    <div id="opennessCPD">set scale of randomness of new angle (0 - 360°): </div>
                    <div id="bColorCPD">set background color : </div>
                    <div id="clearCPD"></div>
                </div>
            </div>
        </section>
        </>
    );
};

export default P5Wrapper;