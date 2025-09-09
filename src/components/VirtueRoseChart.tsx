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
  
  // Conditionally calculate dimensions to preserve web view and fix PDF view
  const baseSize = size === 'thumbnail' ? 200 : size === 'medium' ? 400 : 600;
  const labelPadding = forPdf ? 180 : 0; // Add padding only for the PDF version
  const dimensions = baseSize + labelPadding;
  const center = dimensions / 2;
  const radius = baseSize / 2 - 5; // Radius of the data part of the chart remains the same

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

  // Handle mouse events for tooltips
  const handleMouseOver = useCallback((event: MouseEvent, virtue: string, score: number) => {
    if (!showLabels && !forPdf) {
      setTooltip({
        virtue,
        score,
        x: event.clientX,
        y: event.clientY
      });
    }
  }, [showLabels, forPdf]);

  const handleMouseOut = useCallback(() => {
    setTooltip(null);
  }, []);

  // Label positioning configuration
  const getLabelPositioning = useCallback((angle: number, virtue: string) => {
    const baseConfig = {
      labelRadius: radius + (forPdf ? 55 : 45),
      fontSize: forPdf ? '12' : '14',
      fontFamily: 'Arial, sans-serif',
      fontWeight: '700'
    };

    let textAnchor = 'middle';
    let dx = 0;
    let dy = '0.35em';

    // QUADRANT-BASED POSITIONING
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
      textAnchor = 'end';
      dx = forPdf ? -6 : -4;
    } 
    else if (angle < Math.PI / 2 || angle > 3 * Math.PI / 2) {
      textAnchor = 'start';
      dx = forPdf ? 6 : 4;
    }

    // VIRTUE-SPECIFIC FINE-TUNING
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
      dy = Math.sin(angle) > 0 ? '0.7em' : '0.2em';
    }

    return {
      ...baseConfig,
      textAnchor,
      dx,
      dy
    };
  }, [forPdf, radius]);

  useEffect(() => {
    if (!svgRef.current) return;
    
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }
    
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
    
    for (let i = 1; i <= 5; i++) {
      createBackgroundCircle(radius * (i / 5), '#d6d3d1', showLabels ? i * 2 : undefined);
    }
    
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
      line.setAttribute('stroke', 'none');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '3,3');
      svgRef.current?.appendChild(line);
    });
    
    data.forEach((item, index) => {
      const startAngle = index * anglePerSegment + segmentPadding / 2;
      const endAngle = (index + 1) * anglePerSegment - segmentPadding / 2;
      
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
        path.addEventListener('mouseover', (e) => handleMouseOver(e as unknown as MouseEvent, item.virtue, item.score));
        path.addEventListener('mouseout', handleMouseOut);
      }
      
      svgRef.current?.appendChild(path);
    });
    
    // Create recovery journey arrow and text
    if (data.length > 0 && showLabels) {
      // Find min and max scores
      const scores = data.map(item => item.score);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      
      // Find indices of min and max scores
      const minScoreIndex = scores.findIndex(score => score === minScore);
      const maxScoreIndex = scores.findIndex(score => score === maxScore);
      
      const anglePerSegment = (2 * Math.PI) / data.length;
      
      // Calculate starting and ending angles
      const startAngle = minScoreIndex * anglePerSegment + anglePerSegment / 2;
      let endAngle = maxScoreIndex * anglePerSegment + anglePerSegment / 2;
      
      // Ensure we go clockwise
      if (endAngle < startAngle) {
        endAngle += 2 * Math.PI;
      }
      
      // Create arrow path
      const arrowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      // Calculate arrow points
      const arrowOffset = 30;
      const getArrowRadius = (score: number) => {
        const innerRadius = 10;
        return innerRadius + (radius - innerRadius) * (score / 10) + arrowOffset;
      };
      
      // Create points for the arrow
      const points = [];
      const steps = 20;
      
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const angle = startAngle + (endAngle - startAngle) * progress;
        const score = minScore + (maxScore - minScore) * progress;
        const arrowRadius = getArrowRadius(score);
        
        const x = center + arrowRadius * Math.cos(angle);
        const y = center + arrowRadius * Math.sin(angle);
        
        points.push(`${x},${y}`);
      }
      
      // Create path data
      const pathData = `M ${points.join(' L ')}`;
      
      arrowPath.setAttribute('d', pathData);
      arrowPath.setAttribute('fill', 'none');
      arrowPath.setAttribute('stroke', 'rgba(179, 82, 54, 0.5)');
      arrowPath.setAttribute('stroke-width', '3');
      arrowPath.setAttribute('stroke-linecap', 'round');
      arrowPath.setAttribute('id', 'recovery-arrow-path');
      
      svgRef.current.appendChild(arrowPath);
      
      // Create arrowhead marker
      const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', '10');
      marker.setAttribute('markerHeight', '7');
      marker.setAttribute('refX', '0');
      marker.setAttribute('refY', '3.5');
      marker.setAttribute('orient', 'auto');
      
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
      polygon.setAttribute('fill', 'rgba(179, 82, 54, 0.5)');
      
      marker.appendChild(polygon);
      defs.appendChild(marker);
      svgRef.current.appendChild(defs);
      
      // Add arrowhead to the path
      arrowPath.setAttribute('marker-end', 'url(#arrowhead)');
      
      // Add "Virtue Journey" text with proper separation using textPath
      const textPadding = 10; // 10pt padding above arrow
      
      // Create separate paths for each word
      const createTextPath = (word: string, angleOffset: number) => {
        const textPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate text path points (10pt above the arrow)
        const textPoints = [];
        
        // Create a shorter path segment for each word
        const segmentLength = 0.2; // Length of path segment for each word
        const startProgress = angleOffset;
        const endProgress = angleOffset + segmentLength;
        
        for (let i = 0; i <= steps; i++) {
          const progress = startProgress + (endProgress - startProgress) * (i / steps);
          if (progress > 1) break;
          
          const angle = startAngle + (endAngle - startAngle) * progress;
          const score = minScore + (maxScore - minScore) * progress;
          const textRadius = getArrowRadius(score) + textPadding;
          
          const x = center + textRadius * Math.cos(angle);
          const y = center + textRadius * Math.sin(angle);
          
          textPoints.push(`${x},${y}`);
        }
        
        if (textPoints.length > 1) {
          // Create text path data
          const textPathData = `M ${textPoints.join(' L ')}`;
          textPathElement.setAttribute('d', textPathData);
          textPathElement.setAttribute('id', `text-path-${word.toLowerCase()}`);
          textPathElement.setAttribute('fill', 'none');
          textPathElement.setAttribute('stroke', 'none');
          
          svgRef.current.appendChild(textPathElement);
          
          // Create text that follows the path
          const textPath = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          textPath.setAttribute('fill', 'rgba(179, 82, 54, 0.5)');
          textPath.setAttribute('font-size', '16');
          textPath.setAttribute('font-family', 'Arial, sans-serif');
          textPath.setAttribute('font-weight', 'bold');
          
          const textPathContent = document.createElementNS('http://www.w3.org/2000/svg', 'textPath');
          textPathContent.setAttribute('href', `#text-path-${word.toLowerCase()}`);
          textPathContent.setAttribute('startOffset', '50%');
          textPathContent.setAttribute('method', 'stretch');
          textPathContent.setAttribute('spacing', 'auto');
          textPathContent.textContent = word;
          
          textPath.appendChild(textPathContent);
          svgRef.current.appendChild(textPath);
        }
      };
      
      // Create text paths for each word with proper spacing
      createTextPath('VIRTUE', 0.3); // VIRTUE at 30% along the path
      createTextPath('JOURNEY', 0.6); // JOURNEY at 60% along the path (good spacing)
    }
    
    if (showLabels) {
      data.forEach((item, index) => {
        const angle = index * anglePerSegment + anglePerSegment / 2;
        
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
    
    const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    centerCircle.setAttribute('cx', center.toString());
    centerCircle.setAttribute('cy', center.toString());
    centerCircle.setAttribute('r', '12');
    centerCircle.setAttribute('fill', '#f5f5f4');
    centerCircle.setAttribute('stroke', 'none');
    svgRef.current?.appendChild(centerCircle);
  }, [data, dimensions, center, radius, showLabels, forPdf, getColorByScore, handleMouseOver, handleMouseOut, getLabelPositioning]);

  return (
    <div 
        // Use a different test-id for the PDF version
        data-testid={forPdf ? "virtue-chart-pdf" : "virtue-chart"}
        className={className} style={{ 
        width: '100%', 
        maxWidth: `${dimensions}px`, 
        height: `${dimensions}px`, 
        margin: '0 auto',
        position: 'relative',
        // Use 'hidden' for the web version as originally intended, but 'visible' for PDF to ensure capture
        overflow: forPdf ? 'visible' : 'visible' 
    }}>
      <svg
        ref={svgRef}
        width={dimensions}
        height={dimensions}
        viewBox={`0 0 ${dimensions} ${dimensions}`}
        style={{ display: 'block', overflow: 'visible' }}
      />
      
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