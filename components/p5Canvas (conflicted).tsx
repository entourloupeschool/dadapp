import React, { useRef, useEffect } from 'react';
import type { ReactNode } from "react";
import p5 from "p5";
import styles from '../styles/Home.module.css';
import p5Types from 'p5';
import { useRouter } from 'next/router';

const timeBetweenDrawings: number = Math.floor(Math.random() * 300) + 1;
const distanceBetweenPointsInit: number = Math.floor(Math.random() * 390) + 1;
const initAngle: number = Math.floor(Math.random() * 360);
const opennessInit: number = Math.floor(Math.random() * 350) + 1;
const weightStrokeInit: number = Math.floor(Math.random() * 16) + 1;
const colorInit: string = 'white';

const CPDposition = {
    x: 100,
    y: 100,
    spaceBetween: 55,
    widthSize: 120,
};

type Point = {
    x: number;
    y: number;
    a: number;
    c: number[];
    si: number;
    sh: string;
};

type nPoint = {
    x: number;
    y: number;
    angle: number;
};

interface P5WrapperProps {
    /** If true, the canvas will resize to window whenever the window is resized */
    autoResizeToWindow?: boolean;
    children?: ReactNode | HTMLElement;
};

function roundRdm(num: number, Gauss)

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
    while (angle < 0) {
        angle = angle + 360;
    };
    return angle;
};

function getRadFromAngle(angle: number): number {
    return angle * (Math.PI/180);
};

// new Point not in the image ? -> new random point
function toNeighbouringPoint(x: number, y: number, previousAngle: number, openness: number, distanceBetweenPoints: number): nPoint {
    let angle = Math.round(randGauss(previousAngle-openness, previousAngle+openness));
    if (angle > 360 || angle < 0) {
       angle = Math.round(getCorrectAngle(angle)); 
    };
    const angleRad = getRadFromAngle(angle);
    const rdmx = Math.floor(x + Math.cos(angleRad) * Math.random() * distanceBetweenPoints);
    const rdmy = Math.floor(y + Math.sin(angleRad) * Math.random() * distanceBetweenPoints);

    return {x: rdmx, y: rdmy, angle: angle};
};

let traceurs: any[]   = [];

/**
 * A wrapper component for running P5 sketches. Handles rendering and cleanup.
 */
const P5Wrapper = ({ autoResizeToWindow = true, children}: P5WrapperProps): JSX.Element | null => {
    const router = useRouter();
    const canvasImgRef = useRef<HTMLDivElement>(null);
    const canvasDrawingRef = useRef<HTMLDivElement>(null);
    
    let imageTimeout: ReturnType<typeof setTimeout>;

    const sketchImg = (p: p5Types) => {
        function objectFromPoint(nP: nPoint): Point {
            return {
                x: nP.x,
                y: nP.y, 
                a: nP.angle, 
                c: p.get(nP.x, nP.y), 
                si: parseInt(strokeWeightSelector.value()), 
                sh: modeSelector.value().charAt(0)
            };
        };

        function handleFile(file: any) {
            const img = p.loadImage(file.data, () => {
                img.resize(canvasImgRef.current!.clientWidth, 0);
                p.createCanvas(img.width, img.height);
                p.image(img, 0, 0);
                document.getElementById('imgDiv')!.style.height = img.height + 'px';
                document.getElementById('drawingDiv')!.style.height = img.height + 'px';
            });
            
            p.loadPixels();

            // insert a first point in traceurs then base on it
            const initPoint = toNeighbouringPoint(img.width/2, img.height/2, initAngle, opennessInput.value(), distanceBetweenPointsInput.value());
            traceurs.push(
                objectFromPoint(initPoint)
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
                    p.background(bColorPicker.value());
                    bChanged = true;
                };

                // background color Picker
                const bColorPicker: any = p.createColorPicker(colorInit);
                bColorPicker.parent('bColorCPD');
                bColorPicker.changed(() => {
                    handleChangeBColor();
                });

                // saver format selector
                const formatSelector: any = p.createSelect();
                formatSelector.parent('saveformatCPD');
                formatSelector.id('formatSelector');
                formatSelector.option('png');
                formatSelector.option('jpg');
                formatSelector.option('gif');
                formatSelector.option('svg');
                formatSelector.selected('png');


                // Clear button
                const clearButton: any = p.createButton('clear');
                clearButton.parent('clearCPD');
                clearButton.id('clear');
                clearButton.mousePressed(() => {
                    clearDrawing();
                });

                // Save button
                const saveButton: any = p.createButton('save');
                saveButton.parent('saveCPD');
                saveButton.id('save');
                saveButton.mousePressed(() => {
                    saveDrawing();
                });
        
                p.setup = () => {
                    img.resize(canvasDrawingRef.current!.clientWidth, 2 * canvasDrawingRef.current!.clientWidth);

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
        
                function drawFromPoint(currentTraceur: Point, currentIndex: number): void {
                    if (currentTraceur.sh === 'p') {
                        p.loadPixels();
                        for (let i = -currentTraceur.si; i <= currentTraceur.si; i++) {
                            for (let j = -currentTraceur.si; j <= currentTraceur.si; j++) {
                                p.set(currentTraceur.x + i, currentTraceur.y + j, currentTraceur.c);
                            };
                        }
                        p.updatePixels();
        
                    }else if (currentTraceur.sh === 'e') {
                        const nPoint = toNeighbouringPoint(currentTraceur.x, currentTraceur.y, currentTraceur.a, parseInt(opennessInput.value()), parseInt(distanceBetweenPointsInput.value()));
                        const nextTraceur = objectFromPoint(nPoint);

                        pairwise([currentTraceur, nextTraceur], drawLinePairwise);
        
                    }else if (currentTraceur.sh === 'l') {
                        // Programm line draw
                        const previousPoint = traceurs[currentIndex - 1];
                        if (previousPoint) {
                            drawLinePairwise(previousPoint, currentTraceur);
                        };
                    };
                }
        
                function saveSelfPixel(): void {
                    const nPoint = {
                        x: p.mouseX, 
                        y: p.mouseY, 
                        angle: traceurs[traceurs.length - 1].a
                    };

                    traceurs.push(
                        objectFromPoint(nPoint)
                    )
                };
        
                function gradientLine(ctx: any, x1: number, y1: number, x2: number, y2: number, c1: number[], c2: number[]): void {
                    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                    const currentColor = p.color(c1);
                    const nextColor = p.color(c2);
        
                    gradient.addColorStop(0, currentColor);
                    gradient.addColorStop(1, nextColor);
                    ctx.strokeStyle = gradient;
        
                    p.strokeWeight(traceurs[traceurs.length - 1].si);
                    ctx.beginPath();
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke(); 
                };
        
                function drawLinePairwise(current: Point, next: Point): void {
                    gradientLine(ctx, current.x, current.y, next.x, next.y, current.c, next.c);
                };
        
                function pairwise(arr: Array<Point>, func: Function, skips: number = 1): void{
                    for(var i=0; i < arr.length - skips; i++){
                        console.log(arr[i], arr[i+skips]);
                        func(arr[i], arr[i + skips])
                    };
                };

                function clearDrawing(): void {
                    p.background(bColorPicker.value());
                    // Cannot COMPLETLY CLEAR CANVAS
                    traceurs = [traceurs[0]];
                };

                function saveDrawing(): void {
                    const img = p.get();    
                    img.save('myDrawing', formatSelector.value());
                };
            };
        };
        
        let img: ReturnType<typeof p.loadImage>;

        // StrokeWeight selector
        const strokeWeightSelector: any = p.createSlider(1, 18, weightStrokeInit);
        strokeWeightSelector.parent('strokeWeightCPD');
        strokeWeightSelector.id('strokeWeightSelector');
        
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
        // opennessInput.addClass('inputNumberP5');
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

                let nPoint: nPoint;
                if( modeLastInput.checked() ) {
                    const lastPoint = traceurs[traceurs.length - 1];
                    nPoint = toNeighbouringPoint(lastPoint.x, lastPoint.y, lastPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                    let threshold = 0;
                    while (nPoint.x < 0 || nPoint.x > img.width || nPoint.y > img.height || nPoint.y < 0) {
                        console.log('entered while');
                        nPoint.angle += Math.random() * 360;
                        nPoint = toNeighbouringPoint(nPoint.x, nPoint.y,  nPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                        
                        if (threshold++ > 1000) {
                            console.log('entered threshold');
                            console.log(traceurs);
                            nPoint = toNeighbouringPoint(img.width/2, img.height/2, nPoint.angle, chosenOpenness, chosenDistanceBetweenPoints);
                            break;
                        };

                    };
                }else{
                    nPoint = toNeighbouringPoint(Math.round(Math.random() * img.width), Math.round(Math.random() * img.height), Math.random() * 360, chosenOpenness, chosenDistanceBetweenPoints);
                };

                // See if i should implement ckecking if the point is already in the array
                traceurs.push(
                    objectFromPoint(nPoint),
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
            <p>
                <a className="font-medium text-blue-600 dark:text-blue-500 hover:underline" href="https://p5js.org/">p5.js</a> - is a JS client-side library for creating graphic and interactive experiences, based on the core principles of Processing.
                <br></br>Changing the background with a lot of points can be slow, so be patient.
                <br></br>Click on the drawing canvas to set new points.
            </p>
            <div className={styles.gridedContainer}>
                <div ref={canvasImgRef} id="imgDiv" className={styles.canvasContainer}>
                </div>
                <div ref={canvasDrawingRef} id="drawingDiv" className={styles.canvasContainer}>
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
                </div> 
                <div className={styles.card}>
                    <div id="bColorCPD">set background color : </div>
                    <div id="clearCPD"></div>
                    <div id="saveformatCPD">save format : </div>
                    <div id="saveCPD"></div>
                </div>
            </div>
        </section>
        </>
    );
};

export default P5Wrapper;