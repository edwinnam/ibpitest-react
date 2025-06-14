import React, { useEffect, useRef } from 'react';
import './Charts.css';

const PieChart = ({ 
  data, 
  title, 
  width = '100%', 
  height = 300,
  showLegend = true,
  showPercentages = true,
  animated = true,
  donut = false,
  donutWidth = 50
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
    const padding = 40;
    const legendWidth = showLegend ? 150 : 0;
    const chartSize = Math.min(
      canvas.width - padding * 2 - legendWidth, 
      canvas.height - padding * 2 - (title ? 30 : 0)
    );
    const radius = chartSize / 2;
    const centerX = padding + radius;
    const centerY = padding + radius + (title ? 30 : 0);

    // Calculate total
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return;

    // Calculate angles
    let currentAngle = -Math.PI / 2; // Start from top
    const segments = data.map(item => {
      const percentage = item.value / total;
      const angle = percentage * Math.PI * 2;
      const segment = {
        ...item,
        percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        midAngle: currentAngle + angle / 2
      };
      currentAngle += angle;
      return segment;
    });

    // Default colors if not provided
    const defaultColors = [
      '#007bff', '#28a745', '#ffc107', '#dc3545', 
      '#17a2b8', '#6c757d', '#6610f2', '#e83e8c'
    ];

    // Draw segments
    const drawSegments = (progress = 1) => {
      segments.forEach((segment, index) => {
        const endAngle = segment.startAngle + (segment.endAngle - segment.startAngle) * progress;
        
        // Draw segment
        ctx.fillStyle = segment.color || defaultColors[index % defaultColors.length];
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, segment.startAngle, endAngle);
        ctx.closePath();
        ctx.fill();

        // Draw border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw donut hole if needed
      if (donut) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - donutWidth, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
      }

      // Draw percentages
      if (showPercentages && progress === 1) {
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        segments.forEach((segment) => {
          if (segment.percentage > 0.05) { // Only show if > 5%
            const labelRadius = donut ? radius - donutWidth / 2 : radius * 0.7;
            const x = centerX + Math.cos(segment.midAngle) * labelRadius;
            const y = centerY + Math.sin(segment.midAngle) * labelRadius;
            
            const percentText = `${Math.round(segment.percentage * 100)}%`;
            
            // Add shadow for better readability
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 4;
            ctx.fillText(percentText, x, y);
            ctx.shadowBlur = 0;
          }
        });
      }
    };

    if (animated) {
      let progress = 0;
      const animationDuration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / animationDuration, 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawSegments(progress);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          drawLegendAndTitle();
        }
      };

      animate();
    } else {
      drawSegments(1);
      drawLegendAndTitle();
    }

    function drawLegendAndTitle() {
      // Draw title
      if (title) {
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, centerX, 25);
      }

      // Draw legend
      if (showLegend) {
        const legendX = padding * 2 + chartSize;
        let legendY = padding + (title ? 30 : 0);

        ctx.font = '12px sans-serif';
        ctx.textAlign = 'left';

        segments.forEach((segment, index) => {
          // Color box
          ctx.fillStyle = segment.color || defaultColors[index % defaultColors.length];
          ctx.fillRect(legendX, legendY, 12, 12);

          // Label
          ctx.fillStyle = 'var(--text-primary)';
          ctx.fillText(segment.label, legendX + 20, legendY + 10);

          // Value
          ctx.fillStyle = 'var(--text-secondary)';
          const valueText = `(${segment.value})`;
          ctx.fillText(valueText, legendX + 20, legendY + 25);

          legendY += 35;
        });
      }

      // Draw total in center for donut
      if (donut) {
        ctx.fillStyle = 'var(--text-primary)';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total.toString(), centerX, centerY - 10);
        
        ctx.font = '14px sans-serif';
        ctx.fillStyle = 'var(--text-secondary)';
        ctx.fillText('Total', centerX, centerY + 10);
      }
    }

  }, [data, title, height, showLegend, showPercentages, animated, donut, donutWidth]);

  return (
    <div ref={containerRef} className="chart-container" style={{ width, height }}>
      <canvas ref={canvasRef} className="chart-canvas" />
    </div>
  );
};

export default PieChart;