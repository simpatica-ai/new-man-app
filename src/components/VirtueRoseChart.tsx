// src/components/VirtueRoseChart.tsx
"use client";

import { useEffect, useRef } from 'react';

interface VirtueData {
  virtue: string;
  score: number;
}

interface VirtueRoseChartProps {
  data: VirtueData[];
  size?: 'thumbnail' | 'large';
  showLabels?: boolean;
}

export default function VirtueRoseChart({ data, size = 'large', showLabels = true }: VirtueRoseChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Dimensions based on size
  const dimensions = size === 'thumbnail' ? 300 : 600;
  const center = dimensions / 2;
  const radius = center - (showLabels ? 70 : 30); // Reduced padding when labels are hidden
  
  /**
   * Generates earthy colors based on score (red, orange, amber with stone quality)
   * - 0 to 3.33: Terra Cotta (reddish-brown)
   * - 3.33 to 6.67: Burnt Orange (earthy orange)
   * - 6.67 to 10: Sandstone (light stone)
   */
  const getColorByScore = (score: number): string => {
    const sanitizedScore = Math.max(0, Math.min(10, Number(score)));
    
    if (sanitizedScore <= 3.33) {
      return 'rgba(179, 82, 54, 0.8)'; // Terra Cotta
    } else if (sanitizedScore <= 6.67) {
      return 'rgba(204, 119, 34, 0.8)'; // Burnt Orange
    } else {
      return 'rgba(194, 178, 155, 0.8)'; // Sandstone
    }
  };

  useEffect(() => {
    if (!svgRef.current) return;
    
    // Clear previous content
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
    // Create background circles with numeric labels for Y-axis
    const createBackgroundCircle = (r: number, stroke: string, value?: number) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center.toString());
      circle.setAttribute('cy', center.toString());
      circle.setAttribute('r', r.toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', stroke);
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('stroke-dasharray', '5,5');
      svgRef.current?.appendChild(circle);
      
      // Add numeric labels for Y-axis (only for default view with labels)
      if (showLabels && value !== undefined) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (center - r - 5).toString());
        text.setAttribute('y', center.toString());
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#78716c');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-family', 'var(--font-geist-sans)');
        text.setAttribute('font-weight', '500');
        text.textContent = value.toString();
        svgRef.current?.appendChild(text);
      }
    };
    
    // Create background grid circles with numeric labels
    for (let i = 1; i <= 5; i++) {
      createBackgroundCircle(radius * (i / 5), '#d6d3d1', showLabels ? i * 2 : undefined);
    }
    
    // Add radial dotted lines from center to outer edge for each segment
    const anglePerSegment = (2 * Math.PI) / data.length;
    const segmentPadding = anglePerSegment * 0.1; // 10% padding between segments
    
    data.forEach((_, index) => {
      const angle = index * anglePerSegment;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', center.toString());
      line.setAttribute('y1', center.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#d6d3d1');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3,3');
      svgRef.current?.appendChild(line);
    });
    
    // Draw segments with increased padding
    data.forEach((item, index) => {
      const startAngle = index * anglePerSegment + segmentPadding / 2;
      const endAngle = (index + 1) * anglePerSegment - segmentPadding / 2;
      
      // Calculate points for the segment
      const innerRadius = 10; // Increased from 0 for better visual appearance
      const outerRadius = innerRadius + (radius - innerRadius) * (item.score / 10);
      
      const startInnerX = center + innerRadius * Math.cos(startAngle);
      const startInnerY = center + innerRadius * Math.sin(startAngle);
      const startOuterX = center + outerRadius * Math.cos(startAngle);
      const startOuterY = center + outerRadius * Math.sin(startAngle);
      
      const endInnerX = center + innerRadius * Math.cos(endAngle);
      const endInnerY = center + innerRadius * Math.sin(endAngle);
      const endOuterX = center + outerRadius * Math.cos(endAngle);
      const endOuterY = center + outerRadius * Math.sin(endAngle);
      
      // Create path for the segment
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      const largeArcFlag = (endAngle - startAngle) > Math.PI ? 1 : 0;
      
      const pathData = [
        `M ${startInnerX} ${startInnerY}`,
        `L ${startOuterX} ${startOuterY}`,
        `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${endOuterX} ${endOuterY}`,
        `L ${endInnerX} ${endInnerY}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInnerX} ${startInnerY}`,
        'Z'
      ].join(' ');
      
      path.setAttribute('d', pathData);
      path.setAttribute('fill', getColorByScore(item.score));
      path.setAttribute('stroke', 'rgba(255, 255, 255, 0.5)');
      path.setAttribute('stroke-width', '1');
      
      // Add tooltip
      path.setAttribute('data-tooltip', `${item.virtue}: ${item.score.toFixed(1)}`);
      
      svgRef.current?.appendChild(path);
    });
    
    // Only add virtue labels if showLabels is true
    if (showLabels) {
      data.forEach((item, index) => {
        const angle = index * anglePerSegment + anglePerSegment / 2;
        const labelRadius = radius + 40; // Increased to prevent clipping
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        
        // Adjust text anchor based on position to prevent clipping
        let textAnchor = 'middle';
        let dx = 0;
        
        // For left side (angles between π/2 and 3π/2)
        if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
          textAnchor = 'end';
          dx = -5;
        } 
        // For right side (angles less than π/2 or greater than 3π/2)
        else if (angle < Math.PI / 2 || angle > 3 * Math.PI / 2) {
          textAnchor = 'start';
          dx = 5;
        }
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', y.toString());
        text.setAttribute('dx', dx.toString());
        text.setAttribute('text-anchor', textAnchor);
        text.setAttribute('fill', '#44403c');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-family', 'var(--font-geist-sans)');
        text.setAttribute('font-weight', '700'); // Bold text
        text.setAttribute('letter-spacing', '0.5px'); // Added letter spacing for better readability
        
        // Adjust dy for vertical alignment
        if (Math.abs(Math.sin(angle)) > 0.9) {
          text.setAttribute('dy', Math.sin(angle) > 0 ? '1em' : '0.3em');
        } else {
          text.setAttribute('dy', '0.35em');
        }
        
        text.textContent = item.virtue;
        
        svgRef.current?.appendChild(text);
      });
    }
    
    // Add center circle
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', center.toString());
    centerCircle.setAttribute('cy', center.toString());
    centerCircle.setAttribute('r', '12');
    centerCircle.setAttribute('fill', '#f5f5f4');
    centerCircle.setAttribute('stroke', '#d6d3d1');
    centerCircle.setAttribute('stroke-width', '1');
    svgRef.current?.appendChild(centerCircle);
  }, [data, dimensions, center, radius, showLabels]);

  return (
    <div style={{ 
      width: '100%', 
      maxWidth: `${dimensions}px`, 
      height: `${dimensions}px`, 
      margin: '0 auto',
      position: 'relative',
      overflow: 'visible'
    }}>
      <svg
        ref={svgRef}
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        style={{ display: 'block', overflow: 'visible' }}
      />
    </div>
  );
}