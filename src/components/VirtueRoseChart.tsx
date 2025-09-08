// src/components/VirtueRoseChart.tsx
"use client";

import { useEffect, useRef, useState } from 'react';

interface VirtueData {
  virtue: string;
  score: number;
}

interface VirtueRoseChartProps {
  data: VirtueData[];
  size?: 'thumbnail' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
  forPdf?: boolean; // New prop to indicate if this is for PDF export
}

export default function VirtueRoseChart({ 
  data, 
  size = 'large', 
  showLabels = true, 
  className = '',
  forPdf = false // Default to false
}: VirtueRoseChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{virtue: string; score: number; x: number; y: number} | null>(null);
  
  // Dimensions based on size
  const dimensions = size === 'thumbnail' ? 200 : size === 'medium' ? 400 : 600;
  const center = dimensions / 2;
  const radius = center - 5; // Removed all padding, chart will fill the container
  
  /**
   * Generates earthy colors based on score (red, amber, green with earth tones)
   * - 0 to 3.33: Earth Red (low score)
   * - 3.33 to 6.67: Earth Amber (medium score)
   * - 6.67 to 10: Earth Green (high score)
   */
  const getColorByScore = (score: number): string => {
    const sanitizedScore = Math.max(0, Math.min(10, Number(score)));
    
    if (sanitizedScore <= 3.33) {
      return 'rgba(179, 82, 54, 0.8)'; // Earth Red - Terra Cotta
    } else if (sanitizedScore <= 6.67) {
      return 'rgba(204, 153, 51, 0.8)'; // Earth Amber - Ochre
    } else {
      return 'rgba(101, 133, 76, 0.8)'; // Earth Green - Sage
    }
  };

  // Handle mouse events for tooltips
  const handleMouseOver = (event: MouseEvent, virtue: string, score: number) => {
    if (!showLabels && !forPdf) {
      setTooltip({
        virtue,
        score,
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };

  // Label positioning configuration - easily adjustable
  const getLabelPositioning = (angle: number, virtue: string) => {
    // BASE CONFIGURATION - Adjust these values to control overall positioning
    const baseConfig = {
      labelRadius: radius + 45, // Increased from 35 to 45 for more space (WEB)
      fontSize: '14',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    };

    // PDF-specific adjustments
    if (forPdf) {
      baseConfig.labelRadius = radius + 55; // Even more space for PDF (increased from 45 to 55)
      baseConfig.fontSize = '12';
    }

    // DEFAULT POSITIONING - Adjust these for general left/right positioning
    let textAnchor = 'middle';
    let dx = 0;
    let dy = '0.35em';

    // QUADRANT-BASED POSITIONING
    // Left side (angles between π/2 and 3π/2)
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
      textAnchor = 'end';
      dx = forPdf ? -6 : -4; // Reduced values for less extreme shifting
    } 
    // Right side (angles less than π/2 or greater than 3π/2)
    else if (angle < Math.PI / 2 || angle > 3 * Math.PI / 2) {
      textAnchor = 'start';
      dx = forPdf ? 6 : 4; // Reduced values for less extreme shifting
    }

    // VIRTUE-SPECIFIC FINE-TUNING - Adjust these for individual labels
    const virtueAdjustments: { [key: string]: { textAnchor: string; dx: number; dy?: string } } = {
      'Responsibility': { textAnchor: 'middle', dx: forPdf ? -15 : -12 },
      'Mindfulness': { textAnchor: 'middle', dx: forPdf ? 15 : 12 },
      'Compassion': { textAnchor: 'middle', dx: forPdf ? -12 : -10 },
      'Gratitude': { textAnchor: 'middle', dx: forPdf ? 12 : 10 },
      'Self-Control': { textAnchor: 'middle', dx: forPdf ? -14 : -11 },
      'Patience': { textAnchor: 'middle', dx: forPdf ? 14 : 11 },
      'Honesty': { textAnchor: 'middle', dx: forPdf ? -10 : -8 },
      'Integrity': { textAnchor: 'middle', dx: forPdf ? 10 : 8 },
      'Respect': { textAnchor: 'middle', dx: forPdf ? -13 : -10 },
      'Humility': { textAnchor: 'middle', dx: forPdf ? 13 : 10 },
      'Vulnerability': { textAnchor: 'middle', dx: forPdf ? -11 : -9 }
    };

    if (virtueAdjustments[virtue]) {
      textAnchor = virtueAdjustments[virtue].textAnchor;
      dx = virtueAdjustments[virtue].dx;
      if (virtueAdjustments[virtue].dy) {
        dy = virtueAdjustments[virtue].dy as string;
      }
    }

    // VERTICAL ALIGNMENT for top/bottom labels
    if (Math.abs(Math.sin(angle)) > 0.9) {
      dy = Math.sin(angle) > 0 ? '0.7em' : '0.2em'; // Adjusted for better vertical placement
    }

    return {
      ...baseConfig,
      textAnchor,
      dx,
      dy
    };
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
        text.setAttribute('font-family', 'Arial, sans-serif');
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
    const segmentPadding = anglePerSegment * 0.1;
    
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
      const innerRadius = 10;
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
      
      // Add mouse events for tooltips (only when labels are hidden and not for PDF)
      if (!showLabels && !forPdf) {
        path.style.cursor = 'pointer';
        path.addEventListener('mouseover', (e) => handleMouseOver(e as unknown as MouseEvent, item.virtue, item.score));
        path.addEventListener('mouseout', handleMouseOut);
      }
      
      svgRef.current?.appendChild(path);
    });
    
    // Only add virtue labels if showLabels is true
    if (showLabels) {
      data.forEach((item, index) => {
        const angle = index * anglePerSegment + anglePerSegment / 2;
        
        // Get positioning configuration
        const positioning = getLabelPositioning(angle, item.virtue);
        
        const x = center + positioning.labelRadius * Math.cos(angle);
        const y = center + positioning.labelRadius * Math.sin(angle);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', y.toString());
        text.setAttribute('dx', positioning.dx.toString());
        text.setAttribute('dy', positioning.dy);
        text.setAttribute('text-anchor', positioning.textAnchor);
        text.setAttribute('fill', '#44403c');
        text.setAttribute('font-size', positioning.fontSize);
        text.setAttribute('font-family', positioning.fontFamily);
        text.setAttribute('font-weight', positioning.fontWeight);
        
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
  }, [data, dimensions, center, radius, showLabels, forPdf]);

  return (
    <div className={className} style={{ 
      width: '100%', 
      maxWidth: `${dimensions}px`, 
      height: `${dimensions}px`, 
      margin: '0 auto',
      position: 'relative',
      overflow: 'visible'
    }}>
      <svg
        ref={svgRef}
        data-testid="virtue-chart"
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        style={{ display: 'block', overflow: 'visible' }}
      />
      
      {/* Tooltip for non-labeled version (not for PDF) */}
      {!showLabels && !forPdf && tooltip && (
        <div style={{
          position: 'fixed',
          left: `${tooltip.x + 10}px`,
          top: `${tooltip.y + 10}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '14px',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          <div><strong>{tooltip.virtue}</strong></div>
          <div>Score: {tooltip.score.toFixed(1)}/10</div>
        </div>
      )}
    </div>
  );
}