// src/components/VirtueRoseChart.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface VirtueData {
  virtue: string;
  score: number;
}

interface VirtueRoseChartProps {
  data: VirtueData[];
  size?: 'thumbnail' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
  forPdf?: boolean; // Prop to indicate if this is for PDF export
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
  const [windowWidth, setWindowWidth] = useState(1024); // Default to desktop size for SSR
  
  // Handle window resize for responsive chart
  useEffect(() => {
    // Set initial window width on client side
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
    }
    
    const handleResize = () => {
      if (typeof window !== 'undefined') {
        setWindowWidth(window.innerWidth);
      }
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);
  
  // Responsive dimensions based on screen size and props
  const getResponsiveDimensions = () => {
    if (forPdf) {
      const baseSize = size === 'thumbnail' ? 200 : size === 'medium' ? 400 : 600;
      return { baseSize, dimensions: baseSize + 180, labelPadding: 180 };
    }
    
    // Mobile-first responsive sizing
    const isMobile = windowWidth < 768;
    const isTablet = windowWidth >= 768 && windowWidth < 1024;
    
    if (isMobile) {
      const baseSize = size === 'thumbnail' ? 160 : size === 'medium' ? 280 : 320;
      return { baseSize, dimensions: baseSize, labelPadding: 0 };
    } else if (isTablet) {
      const baseSize = size === 'thumbnail' ? 180 : size === 'medium' ? 350 : 450;
      return { baseSize, dimensions: baseSize, labelPadding: 0 };
    }
    
    // Desktop dimensions - no extra width for thumbnails
    const baseSize = size === 'thumbnail' ? 200 : size === 'medium' ? 400 : 600;
    return { baseSize, dimensions: baseSize, labelPadding: 0 };
  };

  const { baseSize, dimensions, labelPadding } = getResponsiveDimensions();
  const chartWidth = dimensions;
  const chartHeight = dimensions;
  
  // Expand viewBox to include label space
  const viewBoxPadding = showLabels ? 80 : (size === 'thumbnail' ? 10 : 20);
  const viewBoxWidth = chartWidth + (viewBoxPadding * 2);
  const viewBoxHeight = chartHeight + (viewBoxPadding * 2);
  
  const center = viewBoxWidth / 2;
  const centerY = viewBoxHeight / 2;
  const radius = baseSize / 2 - 5;

  /**
   * Generates earthy colors based on score (red, amber, green with earth tones)
   */
  const getColorByScore = useCallback((score: number): string => {
    const sanitizedScore = Math.max(0, Math.min(10, Number(score)));
    
    if (sanitizedScore <= 3.33) {
      return 'rgba(179, 82, 54, 0.8)'; // Earth Red - Terra Cotta
    } else if (sanitizedScore <= 6.67) {
      return 'rgba(204, 153, 51, 0.8)'; // Earth Amber - Ochre
    } else {
      return 'rgba(101, 133, 76, 0.8)'; // Earth Green - Sage
    }
  }, []);

  /**
   * Handle mouse over events for tooltip display
   */
  const handleMouseOver = useCallback((e: MouseEvent, virtue: string, score: number) => {
    console.log('Mouse over:', virtue, score); // Debug log
    const rect = (e.target as Element).closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        virtue,
        score,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  /**
   * Handle mouse out events to hide tooltip
   */
  const handleMouseOut = useCallback(() => {
    console.log('Mouse out'); // Debug log
    setTooltip(null);
  }, []);

  // Label positioning configuration
  const getLabelPositioning = useCallback((angle: number, virtue: string) => {
    const isMobile = windowWidth < 768;
    
    const baseConfig = {
      labelRadius: radius + (forPdf ? 55 : isMobile ? 35 : 45),
      fontSize: forPdf ? '14' : isMobile ? '12' : '16',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    };

    let textAnchor = 'middle';
    let dx = 0;
    let dy = '0.35em';

    // QUADRANT-BASED POSITIONING
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
      textAnchor = 'end';
      dx = forPdf ? -6 : isMobile ? -3 : -4;
    } 
    else if (angle < Math.PI / 2 || angle > 3 * Math.PI / 2) {
      textAnchor = 'start';
      dx = forPdf ? 6 : isMobile ? 3 : 4;
    }

    // VIRTUE-SPECIFIC FINE-TUNING with mobile adjustments
    const mobileMultiplier = isMobile ? 0.7 : 1;
    const virtueAdjustments: { [key: string]: { textAnchor: string; dx: number; dy?: string } } = {
      'Responsibility': { textAnchor: 'middle', dx: (forPdf ? -15 : -12) * mobileMultiplier },
      'Mindfulness': { textAnchor: 'middle', dx: (forPdf ? 15 : 12) * mobileMultiplier },
      'Compassion': { textAnchor: 'middle', dx: (forPdf ? -12 : -10) * mobileMultiplier },
      'Gratitude': { textAnchor: 'middle', dx: (forPdf ? 12 : 10) * mobileMultiplier },
      'Self-Control': { textAnchor: 'middle', dx: (forPdf ? -14 : -11) * mobileMultiplier },
      'Patience': { textAnchor: 'middle', dx: (forPdf ? 14 : 11) * mobileMultiplier },
      'Honesty': { textAnchor: 'middle', dx: (forPdf ? -10 : -8) * mobileMultiplier },
      'Integrity': { textAnchor: 'middle', dx: (forPdf ? 10 : 8) * mobileMultiplier },
      'Respect': { textAnchor: 'middle', dx: (forPdf ? -13 : -10) * mobileMultiplier },
      'Humility': { textAnchor: 'middle', dx: (forPdf ? 13 : 10) * mobileMultiplier },
      'Vulnerability': { textAnchor: 'middle', dx: (forPdf ? -11 : -9) * mobileMultiplier },
      'Healthy Boundaries': { textAnchor: 'middle', dx: (forPdf ? 1 : -2) * mobileMultiplier },
      'Boundaries': { textAnchor: 'middle', dx: (forPdf ? 1 : -2) * mobileMultiplier }
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
      dy = Math.sin(angle) > 0 ? '0.7em' : '0.2em';
    }

    return {
      ...baseConfig,
      textAnchor,
      dx,
      dy
    };
  }, [forPdf, radius, windowWidth]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;
    
    // Create a sorted copy of the data to implement the rotation
    const sortedData = [...data].sort((a, b) => a.score - b.score);
    
    const svg = svgRef.current;
    
    // Completely clear the SVG
    svg.innerHTML = '';
    
    const createBackgroundCircle = (r: number, stroke: string, value?: number) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', center.toString());
      circle.setAttribute('cy', centerY.toString());
      circle.setAttribute('r', r.toString());
      circle.setAttribute('fill', 'none');
      circle.setAttribute('stroke', stroke);
      circle.setAttribute('stroke-width', '1');
      circle.setAttribute('stroke-dasharray', '5,5');
      svg.appendChild(circle);
      
      if (showLabels && value !== undefined) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', (center - r - 5).toString());
        text.setAttribute('y', centerY.toString());
        text.setAttribute('text-anchor', 'end');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('fill', '#78716c');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('font-weight', '500');
        text.textContent = value.toString();
        svg.appendChild(text);
      }
    };
    
    for (let i = 1; i <= 5; i++) {
      createBackgroundCircle(radius * (i / 5), '#d6d3d1', showLabels ? i * 2 : undefined);
    }
    
    const anglePerSegment = (2 * Math.PI) / sortedData.length;
    const segmentPadding = anglePerSegment * 0.1;
    
    sortedData.forEach((_, index) => {
      const angle = index * anglePerSegment;
      const x = center + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', center.toString());
      line.setAttribute('y1', centerY.toString());
      line.setAttribute('x2', x.toString());
      line.setAttribute('y2', y.toString());
      line.setAttribute('stroke', '#d6d3d1');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3,3');
      svg.appendChild(line);
    });
    
    sortedData.forEach((item, index) => {
      const startAngle = index * anglePerSegment + segmentPadding / 2;
      const endAngle = (index + 1) * anglePerSegment - segmentPadding / 2;
      
      const innerRadius = 10;
      const outerRadius = innerRadius + (radius - innerRadius) * (item.score / 10);
      
      const startInnerX = center + innerRadius * Math.cos(startAngle);
      const startInnerY = centerY + innerRadius * Math.sin(startAngle);
      const startOuterX = center + outerRadius * Math.cos(startAngle);
      const startOuterY = centerY + outerRadius * Math.sin(startAngle);
      
      const endInnerX = center + innerRadius * Math.cos(endAngle);
      const endInnerY = centerY + innerRadius * Math.sin(endAngle);
      const endOuterX = center + outerRadius * Math.cos(endAngle);
      const endOuterY = centerY + outerRadius * Math.sin(endAngle);
      
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
      
      if (!showLabels && !forPdf) {
        path.style.cursor = 'pointer';
        path.addEventListener('mouseover', (e) => {
          const mouseEvent = e as MouseEvent;
          handleMouseOver(mouseEvent, item.virtue, item.score);
        });
        path.addEventListener('mouseout', () => {
          handleMouseOut();
        });
      }
      
      svg.appendChild(path);
    });
    
    if (showLabels) {
      sortedData.forEach((item, index) => {
        const angle = index * anglePerSegment + anglePerSegment / 2;
        const positioning = getLabelPositioning(angle, item.virtue);
        const x = center + positioning.labelRadius * Math.cos(angle);
        const y = centerY + positioning.labelRadius * Math.sin(angle);
        
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
        
        svg.appendChild(text);
      });
    }    
    
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', center.toString());
    centerCircle.setAttribute('cy', centerY.toString());
    centerCircle.setAttribute('r', '12');
    centerCircle.setAttribute('fill', '#f5f5f4');
    centerCircle.setAttribute('stroke', '#d6d3d1');
    centerCircle.setAttribute('stroke-width', '1');
    svg.appendChild(centerCircle);
    
  }, [data, dimensions, center, radius, showLabels, forPdf, windowWidth, getColorByScore, handleMouseOver, handleMouseOut, getLabelPositioning]);

  return (
    <div 
        data-testid={forPdf ? "virtue-chart-pdf" : "virtue-chart"}
        className={`${className} w-full flex justify-center`} 
        style={{ 
        maxWidth: `${chartWidth}px`, 
        height: `${chartHeight}px`, 
        margin: '0 auto',
        position: 'relative',
        overflow: 'visible' 
    }}>
      <svg
        ref={svgRef}
        width={chartWidth}
        height={chartHeight}
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        style={{ display: 'block', overflow: 'visible', maxWidth: '100%', height: 'auto' }}
      />
      
      {!showLabels && !forPdf && tooltip && (
        <div style={{
          position: 'absolute',
          left: `${Math.min(tooltip.x + 10, chartWidth - 120)}px`,
          top: `${Math.max(tooltip.y - 40, 10)}px`,
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '500',
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          whiteSpace: 'nowrap',
        }}>
          <div><strong>{tooltip.virtue}</strong></div>
          <div>Score: {tooltip.score.toFixed(1)}/10</div>
        </div>
      )}
    </div>
  );
}