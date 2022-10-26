import React, { ChangeEvent, useRef, useState, useEffect } from 'react';
import type { ReactNode } from "react";
import p5 from "p5";
import styles from '../styles/Home.module.css';
import p5Types from 'p5';
import { useRouter } from 'next/router';

const margeImdDraw = 5;

type colorType = {
    value: string;
    label: string;
    rgb: string;
};

function getRandomArbitraryInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min);
  }

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

const weightStroke: {value: number, label: number}[] = [];

for (let i = 1; i < 18; i++) {
    weightStroke.push({value: i, label: i});
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
  }




/**
 * A wrapper component for running P5 sketches. Handles rendering and cleanup.
 */
const P5Wrapper = ({ autoResizeToWindow = true, children}: P5WrapperProps): JSX.Element | null => {
    const router = useRouter();
    const canvasImgRef = useRef<HTMLDivElement>(null);
    const canvasDrawingRef = useRef<HTMLDivElement>(null);

    const [ bkgrdColor, setBkgrdColor ] = useState<string>(colors[6].rgb);

    const handleChangeBColor = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setBkgrdColor(value);
    };
    

    useEffect(() => {

        const sketchImg = (p: p5Types) => {
            let img: any;

            //See annotations in JS for more information
            p.preload = () => {
                img = p.loadImage('./p5images/zoe.jpg');
            };

            const initAngle = 0;
            const openness = 80;
            const strikeSize = 2;
            const distance = 10;

            p.setup = () => {
                p.pixelDensity(1);
                p.smooth();
                img.resize(0, canvasImgRef.current!.clientHeight);
                p.createCanvas(img.width * 2 , img.height * 2);

                p.image(img, 0, img.height/2);
                p.loadPixels();
            };
            

            // new Point not in the image ? -> new random point
            function toNeighbouringPoint(x: number, y: number, previousAngle: number, openness: number): any {

                const angle = randGauss(previousAngle-openness, previousAngle+openness);
                const rdmx = Math.floor(x + Math.cos(angle) * Math.random() * distance);
                const rdmy = Math.floor(y + Math.sin(angle) * Math.random() * distance);
            
                return [rdmx, rdmy, angle];
            };


            let nPoint: any;

            p.draw = () => {
                if (nPoint !== undefined) {
                    nPoint = toNeighbouringPoint(nPoint[0], nPoint[1],  nPoint[2], openness);

                    while (nPoint[0] < 0 || nPoint[0] > img.width || nPoint[1] > img.height || nPoint[1] < 0) {
                        console.log('entered while');
                        nPoint[2] += Math.random() * 180;
                        nPoint = toNeighbouringPoint(nPoint[0], nPoint[1],  nPoint[2], openness);
                    };

                }else{
                    nPoint = toNeighbouringPoint(img.width/2, img.height/2, initAngle, openness);
                };
                
                console.log('point', nPoint);
                const pixcolor = p.get(nPoint[0], nPoint[1]);
                console.log('color', pixcolor);
                for (let i = -strikeSize; i <= strikeSize; i++) {
                    for (let j = -strikeSize; j <= strikeSize; j++) {
                        p.set(nPoint[0]+i + img.width, nPoint[1]+j, pixcolor);
                    };
                };

                p.updatePixels();
            };
        };



        const canvasImg = new p5(sketchImg, canvasImgRef.current!);

        if (autoResizeToWindow) {
            canvasImg.windowResized = () => {
                canvasImg.resizeCanvas(canvasDrawingRef.current!.clientWidth, canvasDrawingRef.current!.clientHeight);
            };

        };

        return () => {
            canvasImg.remove();
        };

    }, [ autoResizeToWindow, router.events, bkgrdColor ]);


    return (
        <>
        <div ref={canvasImgRef} className={styles.moduleContainer} style={{height: '60vh', marginTop: '1rem'}}>
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
            </div>         
        </div>
        </>
    );


};

export default P5Wrapper;