import * as React from 'react';
import { motion, useAnimation } from 'motion/react';

function generateStars(count, starColor) {
  const shadows = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 4000) - 2000;
    const y = Math.floor(Math.random() * 4000) - 2000;
    shadows.push(`${x}px ${y}px ${starColor}`);
  }
  return shadows.join(', ');
}

function StarLayer({ count = 1000, size = 1, transition, starColor = '#fff' }) {
  const [boxShadow, setBoxShadow] = React.useState('');
  const controls = useAnimation();

  React.useEffect(() => {
    setBoxShadow(generateStars(count, starColor));
  }, [count, starColor]);

  React.useEffect(() => {
    controls.start({ y: [0, -2000] });
  }, []);

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        controls.stop();
      } else {
        controls.start({ y: [0, -2000] });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [controls]);

  return (
    <motion.div
      initial={false}
      animate={controls}
      transition={transition}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2000px', pointerEvents: 'none' }}
    >
      <div style={{ position: 'absolute', background: 'transparent', borderRadius: '50%', width: `${size}px`, height: `${size}px`, boxShadow }} />
      <div style={{ position: 'absolute', background: 'transparent', borderRadius: '50%', width: `${size}px`, height: `${size}px`, boxShadow, top: '2000px' }} />
    </motion.div>
  );
}

function CometCanvas() {
  const canvasRef = React.useRef(null);
  const cometsRef = React.useRef([]);
  const animationFrameRef = React.useRef(null);
  const lastCometTimeRef = React.useRef(0);
  const lastFrameTimeRef = React.useRef(0);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const spawnComet = () => {
      const side = Math.floor(Math.random() * 4);
      let startX, startY, angle;

      switch (side) {
        case 0:
          startX = Math.random() * canvas.width;
          startY = -20;
          angle = Math.random() * Math.PI / 3 + Math.PI / 3;
          break;
        case 1:
          startX = canvas.width + 20;
          startY = Math.random() * canvas.height;
          angle = Math.random() * Math.PI / 3 + 2 * Math.PI / 3;
          break;
        case 2:
          startX = Math.random() * canvas.width;
          startY = canvas.height + 20;
          angle = Math.random() * Math.PI / 3 + 4 * Math.PI / 3;
          break;
        default:
          startX = -20;
          startY = Math.random() * canvas.height;
          angle = Math.random() * Math.PI / 3 - Math.PI / 6;
          break;
      }

      cometsRef.current.push({
        x: startX,
        y: startY,
        angle,
        speed: Math.random() * 2.1 + 3.5,
        tailLength: Math.random() * 40 + 60,
        life: 1.0,
      });
    };

    const animate = (timestamp) => {
      animationFrameRef.current = requestAnimationFrame(animate);

      const delta = timestamp - lastFrameTimeRef.current;
      if (delta < 16) return;
      lastFrameTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastCometTimeRef.current > 10000) {
        const numComets = Math.random() < 0.5 ? 1 : 2;
        spawnComet();
        if (numComets === 2) {
          const delayStart = timestamp;
          const spawnSecond = (t) => {
            if (t - delayStart >= 500) { spawnComet(); return; }
            requestAnimationFrame(spawnSecond);
          };
          requestAnimationFrame(spawnSecond);
        }
        lastCometTimeRef.current = timestamp;
      }

      cometsRef.current = cometsRef.current.filter(comet => {
        comet.x += Math.cos(comet.angle) * comet.speed;
        comet.y += Math.sin(comet.angle) * comet.speed;
        comet.life -= 0.012;

        if (
          comet.life <= 0 ||
          comet.x < -100 || comet.x > canvas.width + 100 ||
          comet.y < -100 || comet.y > canvas.height + 100
        ) return false;

        const tailEndX = comet.x - Math.cos(comet.angle) * comet.tailLength;
        const tailEndY = comet.y - Math.sin(comet.angle) * comet.tailLength;

        // Tail — thin, smooth, more gradient stops for silky falloff
        const gradient = ctx.createLinearGradient(comet.x, comet.y, tailEndX, tailEndY);
        gradient.addColorStop(0,   `rgba(255,255,255,${comet.life * 0.9})`);
        gradient.addColorStop(0.2, `rgba(220,235,255,${comet.life * 0.6})`);
        gradient.addColorStop(0.5, `rgba(200,220,255,${comet.life * 0.3})`);
        gradient.addColorStop(0.8, `rgba(180,200,255,${comet.life * 0.1})`);
        gradient.addColorStop(1,   'rgba(150,180,255,0)');

        ctx.save();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(comet.x, comet.y);
        ctx.lineTo(tailEndX, tailEndY);
        ctx.stroke();
        ctx.restore();

        // Head — soft radial glow instead of flat circle
        const headGlow = ctx.createRadialGradient(
          comet.x, comet.y, 0,
          comet.x, comet.y, 3
        );
        headGlow.addColorStop(0,   `rgba(255,255,255,${comet.life})`);
        headGlow.addColorStop(0.4, `rgba(220,235,255,${comet.life * 0.6})`);
        headGlow.addColorStop(1,   'rgba(200,220,255,0)');

        ctx.save();
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(comet.x, comet.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        return true;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      } else {
        const now = performance.now();
        lastCometTimeRef.current = now;
        lastFrameTimeRef.current = now;
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    resize();
    animationFrameRef.current = requestAnimationFrame(animate);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2,
        pointerEvents: 'none',
        background: 'transparent',
      }}
    />
  );
}

function StarsBackground({
  children,
  speed = 90,
  starColor = '#fff',
}) {
  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at bottom, #0d0d0d 0%, #000 100%)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.6,
      }}>

        
        <StarLayer count={1000} size={1} transition={{ repeat: Infinity, duration: speed,     ease: 'linear' }} starColor={starColor} />
        <StarLayer count={400}  size={2} transition={{ repeat: Infinity, duration: speed * 2, ease: 'linear' }} starColor={starColor} />
        <StarLayer count={200}  size={3} transition={{ repeat: Infinity, duration: speed * 3, ease: 'linear' }} starColor={starColor} />
      </div>

      <CometCanvas />

      {children}
    </>
  );
}

export default StarsBackground;