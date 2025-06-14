import React, { useEffect, useRef } from 'react';
import './Charts.css';

const LineChart = ({ 
  data, 
  title, 
  xLabel = '', 
  yLabel = '', 
  width = '100%', 
  height = 300,
  color = 'var(--primary-color)',
  showGrid = true,
  showDots = true,
  animated = true 
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !data || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    
    // Set canvas size
    canvas.width = rect.width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate dimensions
    const padding = { top: 40, right: 20, bottom: 60, left: 60 };
    const chartWidth = canvas.width - padding.left - padding.right;
    const chartHeight = canvas.height - padding.top - padding.bottom;

    // Find data range
    const values = data.map(d => d.value);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    // Scale functions
    const xScale = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
    const yScale = (value) => padding.top + (1 - (value - minValue) / range) * chartHeight;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'var(--border-secondary)';
      ctx.lineWidth = 0.5;
      
      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + chartWidth, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i < data.length; i++) {
        const x = xScale(i);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + chartHeight);
        ctx.stroke();
      }
    }

    // Draw axes
    ctx.strokeStyle = 'var(--text-secondary)';
    ctx.lineWidth = 2;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, padding.top + chartHeight);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartHeight);
    ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'var(--text-secondary)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    
    // X-axis labels
    data.forEach((point, index) => {
      const x = xScale(index);
      ctx.fillText(point.label, x, padding.top + chartHeight + 20);
    });
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * (5 - i);
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 4);
    }

    // Draw axis labels
    if (xLabel) {
      ctx.textAlign = 'center';
      ctx.fillText(xLabel, canvas.width / 2, canvas.height - 10);
    }
    
    if (yLabel) {
      ctx.save();
      ctx.translate(15, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();
    }

    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    if (animated) {
      let progress = 0;
      const animationDuration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / animationDuration, 1);

        ctx.clearRect(padding.left + 1, 0, chartWidth - 2, padding.top + chartHeight);
        
        // Redraw grid if needed
        if (showGrid) {
          ctx.strokeStyle = 'var(--border-secondary)';
          ctx.lineWidth = 0.5;
          
          for (let i = 0; i <= 5; i++) {
            const y = padding.top + (chartHeight / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
          }

          for (let i = 0; i < data.length; i++) {
            const x = xScale(i);
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();
          }
        }

        // Draw line with progress
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const pointsToShow = Math.floor(data.length * progress);
        for (let i = 0; i < pointsToShow; i++) {
          const x = xScale(i);
          const y = yScale(data[i].value);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();

        // Draw dots
        if (showDots) {
          for (let i = 0; i < pointsToShow; i++) {
            const x = xScale(i);
            const y = yScale(data[i].value);
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    } else {
      // Draw without animation
      ctx.beginPath();
      data.forEach((point, index) => {
        const x = xScale(index);
        const y = yScale(point.value);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Draw dots
      if (showDots) {
        data.forEach((point, index) => {
          const x = xScale(index);
          const y = yScale(point.value);
          
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.fillStyle = 'white';
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    // Draw title
    if (title) {
      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 25);
    }

  }, [data, title, xLabel, yLabel, height, color, showGrid, showDots, animated]);

  return (
    <div ref={containerRef} className="chart-container" style={{ width, height }}>
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
};

export default LineChart;