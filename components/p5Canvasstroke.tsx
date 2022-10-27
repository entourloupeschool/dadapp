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

function pairwise(arr: Array<any>, func: Function, skips: any){
    skips = skips || 1;
    for(var i=0; i < arr.length - skips; i++){
        func(arr[i], arr[i + skips])
    }
}


/**
 * A wrapper component for running P5 sketches. Handles rendering and cleanup.
 */
const P5Wrapper = ({ autoResizeToWindow = true, children}: P5WrapperProps): JSX.Element | null => {
    const router = useRouter();
    const canvasImgRef = useRef<HTMLDivElement>(null);
    const canvasDrawingRef = useRef<HTMLDivElement>(null);

    const [ bkgrdColor, setBkgrdColor ] = useState<string>(colors[6].rgb);
    const [ strokeWeight, setStrokeWeight ] = useState<number>(4);
    const [ timeBetweenDraw, setTimeBetweenDraw ] = useState<number>(200);
    const [ distanceBetweenPoints, setDistanceBetweenPoints ] = useState<number>(30);
    const [ openness, setOpenness ] = useState<number>(20);
    const [ shuffleOrder, setShuffleOrder ] = useState<number>(1);

    const handleChangeBColor = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setBkgrdColor(value);
    };

    const handleChangeSWeight = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setStrokeWeight(parseInt(value));
    };

    const handleChangeTimeBetweenDraw = () => {
        const value = parseFloat((document.getElementById('time') as HTMLInputElement).value);
        setTimeBetweenDraw(value * 1000);
    };

    const handleChangeDistanceBetweenPoints = () => {
        const value = parseFloat((document.getElementById('distance') as HTMLInputElement).value);
        setDistanceBetweenPoints(value);
    };

    const handleChangeOpenness = () => {
        const value = parseFloat((document.getElementById('openness') as HTMLInputElement).value);
        setOpenness(value);
    };
    
    const handleChangeShuffleOrder = () => {
        const value = parseFloat((document.getElementById('shuffle') as HTMLInputElement).value);
        setShuffleOrder(value);
    };



    const traceurs: any[]   = [];
    
    useEffect(() => {
        const sketchImg = (p: p5Types) => {
            let img: any;

            //See annotations in JS for more information
            p.preload = () => {
                img = p.loadImage('./p5images/zoe.jpg');
            };

            const initAngle = 0;

            p.setup = () => {
                img.resize(0, canvasImgRef.current!.clientHeight);
                p.createCanvas(img.width, img.height);

                p.image(img, 0, 0);

                p.loadPixels();
                
                setTimeout(drawTraceurs, timeBetweenDraw);
            };
            

            // new Point not in the image ? -> new random point
            function toNeighbouringPoint(x: number, y: number, previousAngle: number, openness: number, distanceBetweenPoints: number): any {

                const angle = randGauss(previousAngle-openness, previousAngle+openness);
                const rdmx = Math.floor(x + Math.cos(angle) * Math.random() * distanceBetweenPoints);
                const rdmy = Math.floor(y + Math.sin(angle) * Math.random() * distanceBetweenPoints);
            
                return [rdmx, rdmy, angle];
            };

            let nPoint: any;

            function drawTraceurs(): void {
                if (nPoint !== undefined) {
                    nPoint = toNeighbouringPoint(nPoint[0], nPoint[1],  nPoint[2], openness, distanceBetweenPoints);

                    if (nPoint[0] < 0 || nPoint[0] > img.width || nPoint[1] > img.height || nPoint[1] < 0) {
                        console.log('entered while');
                        nPoint[2] += Math.random() * 360;
                        nPoint = toNeighbouringPoint(img.width/2, img.height/2,  nPoint[2], openness, distanceBetweenPoints);
                    };

                }else{
                    nPoint = toNeighbouringPoint(img.width/2, img.height/2, initAngle, openness, distanceBetweenPoints);
                };

                traceurs.push(
                    {
                        x: nPoint[0],
                        y: nPoint[1],
                        color: p.get(nPoint[0], nPoint[1])
                    }
                );

                setTimeout(drawTraceurs, timeBetweenDraw);
            };

        };

        const canvasImg = new p5(sketchImg, canvasImgRef.current!);

        return () => {
            canvasImg.remove();
        };

    }, [ autoResizeToWindow, router.events, bkgrdColor, strokeWeight, timeBetweenDraw, distanceBetweenPoints, openness, shuffleOrder ]);

    useEffect(() => {
        const sketchDrawing = (p: p5Types) => {
            let img: any;

            //See annotations in JS for more information
            p.preload = () => {
                img = p.loadImage('./p5images/zoe.jpg');
            };

            p.setup = () => {
                img.resize(0, canvasImgRef.current!.clientHeight);
                p.createCanvas(img.width, img.height);

            };
            
            p.draw = () => {
                p.background(bkgrdColor);
                // traceurs.forEach((traceur) => {
                //     p.stroke(traceur.color);
                //     p.strokeWeight(strokeWeight);
                //     p.point(traceur.x, traceur.y);
                // });

                function drawPairwise(current: any, next: any): void {
                    p.stroke(current.color);
                    p.strokeWeight(strokeWeight);
                    p.line(current.x, current.y, next.x, next.y);
                };


                pairwise(traceurs, drawPairwise, shuffleOrder);
            };

        };

        const canvasDrawing = new p5(sketchDrawing, canvasDrawingRef.current!);


        return () => {
            canvasDrawing.remove();
        };
    }, [ autoResizeToWindow, router.events, bkgrdColor, strokeWeight, shuffleOrder ]);

    return (
        <>
        <section>
            <div ref={canvasImgRef} style={{height: '60vh', marginTop: '1rem'}}>
            </div>
            <div ref={canvasDrawingRef} style={{height: '60vh', marginTop: '1rem'}}>
            </div>
            <div className={styles.setInfoContainerSub} style={{display: 'flex', marginTop: '1rem', justifyContent: 'space-around'}}>
                <div className={styles.card}>
                    <div>
                        <label htmlFor='backgroundcolor'>
                            background color :
                        <select name='backgroundcolor' id='backgroundcolor' value={bkgrdColor} onChange={handleChangeBColor} style={{marginLeft: '0.5rem'}}>
                            {colors.map((color: colorType): JSX.Element => {
                                return (
                                    <option key={color.value} value={color.rgb}>{color.label}</option>
                                );
                            })}
                        </select>
                        </label>
                    </div>
                    <div>
                        <label htmlFor='weight'>
                            stroke weight :
                        <select name='weight' id='weight' value={strokeWeight} onChange={handleChangeSWeight} style={{marginLeft: '0.5rem'}}>
                            {weightStroke.map((weight: {value: number, label: number}): JSX.Element => {
                                return (
                                    <option key={weight.value} value={weight.value}>{weight.label}</option>
                                );
                            })}
                        </select>
                        </label>
                    </div>
                    <div>
                        <label htmlFor='time'>
                            time between draw (s):
                            <input type='number' name='time' id='time' style={{marginLeft: '0.5rem'}}/>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full" onClick={() => handleChangeTimeBetweenDraw()}>set</button>
                        </label>
                    </div>
                    <div>
                        <label htmlFor='distance'>
                            max possible length between points :
                            <input type='number' name='distance' id='distance' style={{marginLeft: '0.5rem'}}/>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full" onClick={() => handleChangeDistanceBetweenPoints()}>set</button>
                        </label>
                    </div>
                    <div>
                        <label htmlFor='openness'>
                            openness (rad):
                            <input type='number' name='openness' id='openness' style={{marginLeft: '0.5rem'}}/>
                            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-full" onClick={() => handleChangeOpenness()}>set</button>
                        </label>
                    </div>
                    <div>
                        <label htmlFor='shuffle'>
                            shuffle order :
                        <select name='shuffle' id='shuffle' value={shuffleOrder} onChange={handleChangeShuffleOrder} style={{marginLeft: '0.5rem'}}>
                            {shuffleOrderOptions.map((option: {value: number, label: string}): JSX.Element => {
                                return (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                );
                            })}
                        </select>
                        </label>
                    </div>
                </div>         
            </div>
        </section>

        </>
    );


};

export default P5Wrapper;