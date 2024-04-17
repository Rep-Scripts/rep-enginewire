import { FC, MouseEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchNui } from '../utils/fetchNui';
import style from './hotwire.module.scss';
interface IColors {
    [ key: number ]: {
        id: number;
        color: string[];
    };
}

enum Side {
    Left = 'left',
    Right = 'right'
}

interface ISize {
    width: number,
    height: number
}

interface IDrawPointXY {
    x: number; y: number
}
interface IDrawPoint {
    start: IDrawPointXY | null;
    end: IDrawPointXY | null;
    curveX: number;
    curveY: number;
    color: string;
    connectedPinId?: number;
}

export function HotWire () {
    const [ result, setResult ] = useState<{ [ key: number ]: IDrawPoint }>( {} );
    const [ leftLine, setLeftLine ] = useState<string[]>( [] );
    const [ rightLine, setRightLine ] = useState<string[]>( [] );
    const [ selectedPin, setSelectedPin ] = useState<number | null>( null );

    const [ drawing, setDrawing ] = useState<boolean>( false );
    const [ drawingPoints, setDrawingPoints ] = useState<IDrawPoint>( { start: null, end: null, curveX: 0.5, curveY: 0.3, color: '#808080' } )
    const [ curveFactorX, setCurveFactorX ] = useState<number>( 0.5 );
    const [ curveFactorY, setCurveFactorY ] = useState<number>( 0.3 );
    const [ lineWidth, setLineWidth ] = useState<number>( 5 );

    const [ canvasSize, setCanvasSize ] = useState<ISize>( { width: 0, height: 0 } );
    const [ prevCanvasSize, setPrevCanvasSize ] = useState<ISize>( { width: 0, height: 0 } );

    const drawingCanvasRef = useRef<HTMLCanvasElement | null>( null );
    const resultCanvasRef = useRef<HTMLCanvasElement | null>( null );
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>( null );

    const colors: IColors = useMemo( () => ( {
        1: { id: 1, color: [ '#7E9570', '#2C6907' ] },
        2: { id: 2, color: [ '#1FFF1B', '#138511' ] },
        3: { id: 3, color: [ '#FFF732', '#A6A00A' ] },
        4: { id: 4, color: [ '#FF440A', '#A03C1D' ] },
        5: { id: 5, color: [ '#002343', '#6CB9FF' ] },
        6: { id: 6, color: [ '#18005B', '#7747FF' ] },
        7: { id: 7, color: [ '#FF3636', '#881616' ] },
    } ), [] );

    const shuffleArray = ( colors: IColors ): string[] => {
        return Object.keys( colors ).sort( () => Math.random() - 0.5 );
    };

    const checkResult = useCallback( () => {
        const connectedCorrectCount = Object.entries( result ).reduce( ( count, [ key, { connectedPinId } ] ) => {
            if ( +key === connectedPinId ) {
                return count + 1;
            }
            return count;
        }, 0 );

        return connectedCorrectCount;
    }, [ result ] );

    const calculateControlPoints = ( start: IDrawPointXY, end: IDrawPointXY, curveX: number, curveY: number ) => {
        const controlPoints: IDrawPointXY[] = [];

        const midX = ( start.x + end.x ) / 2;
        const midY = ( start.y + end.y ) / 2;

        if ( end.y > start.y ) {
            controlPoints.push( {
                x: midX + ( end.y - start.y ) * curveX,
                y: midY - ( end.x - start.x ) * curveY,
            } );

            controlPoints.push( {
                x: midX - ( end.y - start.y ) * curveX,
                y: midY + ( end.x - start.x ) * curveY,
            } );
        } else {
            controlPoints.push( {
                x: midX - ( end.y - start.y ) * curveX,
                y: midY + ( end.x - start.x ) * curveY,
            } );

            controlPoints.push( {
                x: midX + ( end.y - start.y ) * curveX,
                y: midY - ( end.x - start.x ) * curveY,
            } );
        }

        return controlPoints;
    };

    const drawLine = useCallback( ( ctx: CanvasRenderingContext2D, start: IDrawPointXY, end: IDrawPointXY, color: string ) => {
        ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height );
        const controlPoints = calculateControlPoints( start, end, curveFactorX, curveFactorY );

        ctx.beginPath();
        ctx.moveTo( start.x, start.y );
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = color;

        for ( let i = 0; i < controlPoints.length; i += 2 ) {
            ctx.bezierCurveTo(
                controlPoints[ i ].x,
                controlPoints[ i ].y,
                controlPoints[ i + 1 ].x,
                controlPoints[ i + 1 ].y,
                end.x || 0,
                end.y || 0
            );
        }
        ctx.stroke();
        ctx.closePath();
    }, [ curveFactorX, curveFactorY, lineWidth ] );

    const drawLines = useCallback( ( ctx: CanvasRenderingContext2D, lines: any ) => {
        for ( const key in lines ) {
            const line = lines[ key ];
            const controlPoints = calculateControlPoints( line.start, line.end, line.curveX, line.curveY );

            ctx.beginPath();
            ctx.moveTo( line.start.x, line.start.y );
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = line.color;
            for ( let i = 0; i < controlPoints.length; i += 2 ) {
                ctx.bezierCurveTo(
                    controlPoints[ i ].x,
                    controlPoints[ i ].y,
                    controlPoints[ i + 1 ].x,
                    controlPoints[ i + 1 ].y,
                    line.end.x || 0,
                    line.end.y || 0
                );
            }
            ctx.stroke();
            ctx.closePath();
        }
    }, [ lineWidth ] );

    const handlePinClick = useCallback( ( event: any, pinId: number, side: Side ) => {
        const resultCanvas = resultCanvasRef.current;

        const handleLeftClick = () => {
            if ( selectedPin === pinId || drawing ) return;

            setSelectedPin( pinId );
            setDrawing( true );

            const isPinConnected = Object.keys( result ).some( ( item ) => +item === pinId );

            if ( isPinConnected ) {
                const updatedResult = { ...result };
                delete updatedResult[ pinId ];

                if ( resultCanvas ) {
                    const ctx = resultCanvas.getContext( '2d' );
                    if ( ctx ) {
                        ctx.clearRect( 0, 0, resultCanvas.width, resultCanvas.height );
                        drawLines( ctx, updatedResult );
                    }
                }
            }

            const curveX = Math.random() * ( 0.85 - 0.15 ) + 0.15;
            const curveY = Math.random() * ( 0.55 - 0.05 ) + 0.05;
            const position: IDrawPointXY = {
                x: event.target.offsetLeft + event.target.clientWidth - 1,
                y: event.target.offsetTop + ( event.target.clientHeight / 2 ),
            };

            setCurveFactorX( curveX );
            setCurveFactorY( curveY );
            setDrawing( true );
            setDrawingPoints( {
                ...drawingPoints,
                start: { x: position.x, y: position.y },
                curveX,
                curveY,
                color: '#808080',
            } );

            setResult( {
                ...result,
                [ pinId ]: {
                    ...result[ pinId ],
                    start: { x: position.x, y: position.y },
                    curveX,
                    curveY,
                    color: '#808080',
                    connectedPinId: -1,
                },
            } );
        };

        const handleRightClick = () => {
            const isPinConnected = Object.values( result ).some( ( item ) => item.connectedPinId === pinId );

            if ( isPinConnected || side !== Side.Right || selectedPin === null ) return;

            setDrawing( false );

            const position: IDrawPointXY = {
                x: event.target.offsetParent.offsetLeft + 1,
                y: event.target.offsetParent.offsetTop + ( event.target.offsetParent.clientHeight / 2 ),
            };

            if ( selectedPin === pinId ) {
                setResult( {
                    ...result, [ selectedPin ]: {
                        ...drawingPoints,
                        end: {
                            x: position.x,
                            y: position.y
                        },
                        color: colors[ selectedPin ].color[ 1 ],
                        connectedPinId: pinId,
                    }
                } );
            } else {
                setResult( {
                    ...result, [ selectedPin ]: {
                        ...drawingPoints,
                        end: { x: position.x, y: position.y },
                        connectedPinId: pinId,
                    }
                } );
            }
            setSelectedPin( null );
            setDrawingPoints( { start: null, end: null, curveX: 0.5, curveY: 0.3, color: '#808080' } );
        };

        const handleCancel = () => {
            setDrawing( false );
            setSelectedPin( null );
        };

        if ( side === Side.Left ) handleLeftClick();
        else if ( side === Side.Right ) handleRightClick();
        else handleCancel();
    }, [ colors, drawLines, drawing, drawingPoints, result, selectedPin ] );

    const handleMouseMove = useCallback( ( event: any ) => {
        const drawingCanvas = drawingCanvasRef.current;

        if ( !drawing || !drawingCanvas || !selectedPin ) return;

        const ctx = drawingCanvas.getContext( '2d' );

        if ( !ctx ) return;

        const rect = drawingCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        setDrawingPoints( {
            ...drawingPoints,
            end: { x: mouseX, y: mouseY },
        } );

        const lastLine = result[ selectedPin ];

        if ( lastLine && lastLine.start ) {
            drawLine(
                ctx,
                { x: lastLine.start.x, y: lastLine.start.y },
                { x: mouseX, y: mouseY },
                lastLine.color
            );
        }
    }, [ drawLine, drawing, drawingPoints, result, selectedPin ] );


    const resetWire: MouseEventHandler<HTMLDivElement> = useCallback( ( event ) => {
        event.preventDefault();

        if ( selectedPin && drawing ) {
            const updatedResult = { ...result };
            delete updatedResult[ selectedPin ];

            setDrawing( false );
            setSelectedPin( null )
            setResult( updatedResult )

            const drawingCanvas = drawingCanvasRef.current;
            if ( drawingCanvas ) {
                const drawingCtx = drawingCanvas.getContext( "2d" );
                if ( drawingCtx ) {
                    drawingCtx.clearRect( 0, 0, drawingCanvas.width, drawingCanvas.height );
                }
            }
        }
    }, [ drawing, result, selectedPin ] )


    const refreshGame = useCallback( () => {
        setResult( {} );
        setSelectedPin( null );
        setDrawing( false );
        setLeftLine( shuffleArray( colors ) );
        setRightLine( shuffleArray( colors ) );
    }, [] )// eslint-disable-line

    const resizeCanvas = useCallback( () => {
        const resultCanvas = resultCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;

        if ( !drawingCanvas || !resultCanvas ) return;

        if ( resizeTimeoutRef.current ) {
            clearTimeout( resizeTimeoutRef.current );
        }

        if ( window.innerWidth < 1030 ) {
            setLineWidth( 3 )
        } else if ( window.innerWidth > 3500 ) {
            setLineWidth( 10 )
        } else {
            setLineWidth( 5 )
        }

        setPrevCanvasSize( {
            width: drawingCanvas?.width,
            height: drawingCanvas?.height,
        } )

        const newWidth = ( 387 * window.innerHeight ) / 1080;
        const newHeight = ( 417 * window.innerHeight ) / 1080;

        drawingCanvas.width = newWidth;
        drawingCanvas.height = newHeight;
        resultCanvas.width = newWidth;
        resultCanvas.height = newHeight;

        setCanvasSize( { width: newWidth, height: newHeight } )
    }, [] );

    const scaleCoordinates = ( coordinates: IDrawPointXY, originalResolution: ISize, targetResolution: ISize ) => {
        const scaleX = targetResolution.width / originalResolution.width;
        const scaleY = targetResolution.height / originalResolution.height;

        const scaledX = coordinates.x * scaleX;
        const scaledY = coordinates.y * scaleY;

        return { x: Math.round( scaledX ), y: Math.round( scaledY ) };
    };

    const scalePointCoordinates = ( point: IDrawPoint, originalResolution: ISize, targetResolution: ISize ) => {
        return {
            start: point.start ? scaleCoordinates( point.start, originalResolution, targetResolution ) : null,
            end: point.end ? scaleCoordinates( point.end, originalResolution, targetResolution ) : null,
            curveX: point.curveX,
            curveY: point.curveY,
            color: point.color,
            connectedPinId: point.connectedPinId,
        };
    };

    const handleKeyUp = useCallback( ( e: any ) => {
        if ( e.keyCode === 27 ) {
            fetchNui('finish', {result:false});
        }
    }, [] )

    useEffect( () => {
        const onKeyUp = ( e: KeyboardEvent ) => handleKeyUp( e );
        document.addEventListener( 'keyup', onKeyUp );

        return () => {
            document.removeEventListener( 'keyup', onKeyUp );;
        }
    }, [ handleKeyUp ] );

    useEffect( () => {
        if ( prevCanvasSize.width !== canvasSize.width || prevCanvasSize.height !== canvasSize.height ) {
            const scaledResult: { [ key: number ]: IDrawPoint } = {};
            for ( const key in result ) {
                scaledResult[ key ] = scalePointCoordinates( result[ key ], prevCanvasSize, canvasSize );
            }
            setResult( scaledResult );
        }
    }, [ canvasSize, prevCanvasSize ] ) // eslint-disable-line

    useEffect( () => {
        window.addEventListener( 'resize', resizeCanvas );
        resizeCanvas();

        return () => {
            window.removeEventListener( 'resize', resizeCanvas );
        };
    }, [ resizeCanvas ] );


    useEffect( () => {
        const resultCanvas = resultCanvasRef.current;
        const drawingCanvas = drawingCanvasRef.current;

        if ( drawingCanvas && resultCanvas && !drawing && !selectedPin ) {
            const ctx = resultCanvas.getContext( '2d' );
            const drawingCtx = drawingCanvas.getContext( "2d" );
            if ( ctx && drawingCtx ) {
                ctx.clearRect( 0, 0, resultCanvas.width, resultCanvas.height );
                drawingCtx.clearRect( 0, 0, drawingCanvas.width, drawingCanvas.height );
                drawLines( ctx, result );
            }
        }
    }, [ drawLines, drawing, result, selectedPin ] );

    useEffect( () => {
        const drawingCanvas = drawingCanvasRef.current;
        if ( drawingCanvas ) {
            drawingCanvas.addEventListener( "mousemove", handleMouseMove );
            return () => {
                drawingCanvas.removeEventListener( "mousemove", handleMouseMove );
            };
        }
    }, [] )// eslint-disable-line

    useEffect( () => {
        setLeftLine( shuffleArray( colors ) );
        setRightLine( shuffleArray( colors ) );
    }, [] ); // eslint-disable-line

    const isGameFinished = checkResult() === 7;

    useEffect( () => {
        if ( isGameFinished ) {
            fetchNui('finish', {result:true});
        }
    }, [ isGameFinished ] )
    return (
        <div className={style.main}>
        <div className={style.game}>
            <div className={style.gamefield}
                onMouseMove={handleMouseMove}
                onContextMenu={resetWire}
            >
                <canvas
                    ref={resultCanvasRef}
                    className={style.canvas}
                ></canvas>
                <canvas
                    ref={drawingCanvasRef}
                    className={style.canvas}
                ></canvas>
                <div className={style.line}>
                    {leftLine.map( ( el, idx ) => {
                        return (
                            <div key={idx} className={style.box}>
                                <div className={style.pin}></div>
                                <div
                                    className={style.wire}
                                    style={{
                                        '--color1': colors[ +el ].color[ 0 ],
                                        '--color2': colors[ +el ].color[ 1 ],
                                    } as React.CSSProperties}
                                    onMouseDown={( e ) => handlePinClick( e, +el, Side.Left )}
                                ></div>
                            </div>
                        );
                    } )}
                </div>
                <div className={style.line}>
                    {rightLine.map( ( el, idx ) => {
                        return (
                            <div key={idx} className={style.box}>
                                <div className={style.pin}></div>
                                <div
                                    className={style.wire}
                                    style={{
                                        '--color1': colors[ +el ].color[ 0 ],
                                        '--color2': colors[ +el ].color[ 1 ],
                                    } as React.CSSProperties}
                                    onMouseDown={( e ) => handlePinClick( e, +el, Side.Right )}
                                ></div>
                            </div>
                        );
                    } )}
                </div>
            </div>
        </div>
    </div>
    )
}