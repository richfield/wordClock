import React from 'react';
import { ClockComponentProps } from '../types';

const Advent: React.FC<ClockComponentProps> = () => {
    const holderStyles: React.CSSProperties[] = [
        {
            position: 'absolute',
            bottom: '10%',
            left: '10%',
        },
        {
            position: 'absolute',
            bottom: '10%',
            left: '30%',
        },
        {
            position: 'absolute',
            bottom: '10%',
            left: '50%',
        },
        {
            position: 'absolute',
            bottom: '10%',
            left: '70%',
        },
    ];

    const candleStyles: React.CSSProperties[] = [
        { width: '100px', height: '200px', position: 'relative' },
        { width: '100px', height: '300px', position: 'relative' },
        { width: '100px', height: '400px', position: 'relative' },
        { width: '100px', height: '500px', position: 'relative' },
    ];

    const flameStyles: React.CSSProperties[] = [
        {
            width: '24px',
            height: '120px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: 'translateX(-50%)',
            bottom: '100%',
            borderRadius: '50% 50% 20% 20%',
            background: 'linear-gradient(white 80%, transparent)',
            animation: 'moveFlame 6s linear infinite, enlargeFlame 5s linear infinite',
            position: 'absolute',
        },
        {
            width: '24px',
            height: '120px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: 'translateX(-50%)',
            bottom: '100%',
            borderRadius: '50% 50% 20% 20%',
            background: 'linear-gradient(white 80%, transparent)',
            animation: 'moveFlame 6s linear infinite, enlargeFlame 5s linear infinite',
            position: 'absolute',
        },
        {
            width: '24px',
            height: '120px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: 'translateX(-50%)',
            bottom: '100%',
            borderRadius: '50% 50% 20% 20%',
            background: 'linear-gradient(white 80%, transparent)',
            animation: 'moveFlame 6s linear infinite, enlargeFlame 5s linear infinite',
            position: 'absolute',
        },
        {
            width: '24px',
            height: '120px',
            left: '50%',
            transformOrigin: '50% 100%',
            transform: 'translateX(-50%)',
            bottom: '100%',
            borderRadius: '50% 50% 20% 20%',
            background: 'linear-gradient(white 80%, transparent)',
            animation: 'moveFlame 6s linear infinite, enlargeFlame 5s linear infinite',
            position: 'absolute',
        },
    ];

    const threadStyles: React.CSSProperties = {
        width: '6px',
        height: '36px',
        top: '-17px',
        left: '50%',
        zIndex: 1,
        borderRadius: '40% 40% 0 0',
        transform: 'translateX(-50%)',
        background: '#121212',
        position: 'absolute',
    };

    const glowStyles: React.CSSProperties = {
        width: '26px',
        height: '60px',
        borderRadius: '50% 50% 35% 35%',
        left: '50%',
        top: '-48px',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 133, 255, .7)',
        boxShadow: '0 -40px 30px 0 #dc8a0c, 0 40px 50px 0 #dc8a0c, inset 3px 0 2px 0 rgba(0, 133, 255, .6), inset -3px 0 2px 0 rgba(0, 133, 255, .6)',
        position: 'absolute',
    };

    const blinkGlowStyles: React.CSSProperties = {
        width: '100px',
        height: '180px',
        left: '50%',
        top: '-55%',
        transform: 'translateX(-50%)',
        borderRadius: '50%',
        background: '#ff6000',
        filter: 'blur(60px)',
        animation: 'blinkIt .1s infinite',
        position: 'absolute',
    };

    return (
        <div>
            <h1>Vier brandende kaarsen</h1>
            <div style={{ display: 'flex' }}>
                {holderStyles.map((holderStyle, index) => (
                    <div className="holder" style={holderStyle} key={index}>
                        <div className="candle" style={candleStyles[ index ]} key={index}>
                            <div className="blinking-glow" style={blinkGlowStyles} key={index}></div>
                            <div className="thread" style={threadStyles} key={index}></div>
                            <div className="glow" style={glowStyles} key={index}></div>
                            <div className="flame" style={flameStyles[ index ]} key={index}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Advent;
