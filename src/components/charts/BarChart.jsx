import React, { useEffect, useRef } from 'react';
import './Charts.css';

const BarChart = ({ 
  data, 
  title, 
  xLabel = '', 
  yLabel = '', 
  width = '100%', 
  height = 300,
  color = 'var(--primary-color)',
  showGrid = true,
  animated = true,
  horizontal = false,
  showValues = true
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
    const minValue = 0;

    // Calculate bar dimensions
    const barCount = data.length;
    const barSpacing = horizontal ? chartHeight / barCount : chartWidth / barCount;
    const barWidth = barSpacing * 0.7;
    const barGap = barSpacing * 0.3;

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'var(--border-secondary)';
      ctx.lineWidth = 0.5;
      
      if (horizontal) {
        // Vertical grid lines
        for (let i = 0; i <= 5; i++) {
          const x = padding.left + (chartWidth / 5) * i;
          ctx.beginPath();
          ctx.moveTo(x, padding.top);
          ctx.lineTo(x, padding.top + chartHeight);
          ctx.stroke();
        }
      } else {
        // Horizontal grid lines
        for (let i = 0; i <= 5; i++) {
          const y = padding.top + (chartHeight / 5) * i;
          ctx.beginPath();
          ctx.moveTo(padding.left, y);
          ctx.lineTo(padding.left + chartWidth, y);
          ctx.stroke();
        }
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
    
    if (horizontal) {
      // Y-axis labels (categories)
      ctx.textAlign = 'right';
      data.forEach((item, index) => {
        const y = padding.top + barSpacing * index + barSpacing / 2;
        ctx.fillText(item.label, padding.left - 10, y + 4);
      });
      
      // X-axis labels (values)
      ctx.textAlign = 'center';
      for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const x = padding.left + (chartWidth / 5) * i;
        ctx.fillText(Math.round(value).toString(), x, padding.top + chartHeight + 20);
      }
    } else {
      // X-axis labels (categories)
      ctx.textAlign = 'center';
      data.forEach((item, index) => {
        const x = padding.left + barSpacing * index + barSpacing / 2;
        ctx.save();
        ctx.translate(x, padding.top + chartHeight + 15);
        ctx.rotate(-Math.PI / 4);
        ctx.textAlign = 'right';
        ctx.fillText(item.label, 0, 0);
        ctx.restore();
      });
      
      // Y-axis labels (values)
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * (5 - i);
        const y = padding.top + (chartHeight / 5) * i;
        ctx.fillText(Math.round(value).toString(), padding.left - 10, y + 4);
      }
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

    // Draw bars
    const drawBars = (progress = 1) => {
      data.forEach((item, index) => {
        const value = item.value * progress;
        const barHeight = (value / maxValue) * (horizontal ? chartWidth : chartHeight);
        
        // Set color
        ctx.fillStyle = item.color || color;
        
        if (horizontal) {
          const y = padding.top + barSpacing * index + barGap / 2;
          ctx.fillRect(padding.left, y, barHeight, barWidth);
          
          // Draw value
          if (showValues && progress === 1) {
            ctx.fillStyle = 'var(--text-primary)';
            ctx.textAlign = 'left';
            ctx.fillText(item.value.toString(), padding.left + barHeight + 5, y + barWidth / 2 + 4);
          }
        } else {
          const x = padding.left + barSpacing * index + barGap / 2;
          const y = padding.top + chartHeight - barHeight;
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Draw value
          if (showValues && progress === 1) {
            ctx.fillStyle = 'var(--text-primary)';
            ctx.textAlign = 'center';
            ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
          }
        }
      });
    };

    if (animated) {
      let progress = 0;
      const animationDuration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / animationDuration, 1);

        // Clear chart area
        ctx.clearRect(
          padding.left + 1, 
          padding.top, 
          chartWidth - 1, 
          chartHeight - 1
        );

        // Redraw grid if needed
        if (showGrid) {
          ctx.strokeStyle = 'var(--border-secondary)';
          ctx.lineWidth = 0.5;
          
          if (horizontal) {
            for (let i = 0; i <= 5; i++) {
              const x = padding.left + (chartWidth / 5) * i;
              ctx.beginPath();
              ctx.moveTo(x, padding.top);
              ctx.lineTo(x, padding.top + chartHeight);
              ctx.stroke();
            }
          } else {
            for (let i = 0; i <= 5; i++) {
              const y = padding.top + (chartHeight / 5) * i;
              ctx.beginPath();
              ctx.moveTo(padding.left, y);
              ctx.lineTo(padding.left + chartWidth, y);
              ctx.stroke();
            }
          }
        }

        drawBars(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    } else {
      drawBars(1);
    }

    // Draw title
    if (title) {
      ctx.fillStyle = 'var(--text-primary)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, 25);
    }

  }, [data, title, xLabel, yLabel, height, color, showGrid, animated, horizontal, showValues]);

  return (
    <div ref={containerRef} className="chart-container" style={{ width, height }}>
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
};

export default BarChart;