import React, { useEffect } from 'react';

    const Ball: React.FC<{ left: number }> = ({ left }) => {
      return (
        <div
          className="absolute bg-blue-500 rounded-full"
          style={{ left: `${left}px`, width: '50px', height: '50px' }}
        />
      );
    };

    function App() {
      const ballsCount = 10;
      const balls: Array<number> = Array.from({ length: ballsCount }, (_, i) => i * 75);

      useEffect(() => {
        const animate = () => {
          balls.forEach((_, index) => {
            const ballElement = document.getElementById(`ball-${index}`);
            if (ballElement) {
              const left = (parseFloat(ballElement.style.left) + 5) % window.innerWidth;
              ballElement.style.left = `${left}px`;
            }
          });
          requestAnimationFrame(animate);
        };
        animate();
      }, [balls]);

      return (
        <div className="relative min-h-screen bg-gray-100">
          {balls.map((left, index) => (
            <Ball key={index} left={left} id={`ball-${index}`} />
          ))}
        </div>
      );
    }

    export default App;