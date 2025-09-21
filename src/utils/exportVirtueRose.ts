interface VirtueData {
  virtue: string;
  score: number;
}

export function exportVirtueRoseAsSVG(data: VirtueData[], filename: string = 'virtue-rose.svg') {
  // Create a temporary container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  document.body.appendChild(container);

  // Create SVG element with proper dimensions for labels
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const chartSize = 600; // Chart area
  const labelPadding = 140; // Increased space for labels on all sides
  const totalSize = chartSize + (labelPadding * 2); // Total SVG size
  const center = totalSize / 2;
  const radius = chartSize / 2 - 60;

  svg.setAttribute('width', totalSize.toString());
  svg.setAttribute('height', totalSize.toString());
  svg.setAttribute('viewBox', `0 0 ${totalSize} ${totalSize}`);
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  // Sort data by score (lowest to highest)
  const sortedData = [...data].sort((a, b) => a.score - b.score);

  // Create background circles
  for (let i = 1; i <= 5; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', center.toString());
    circle.setAttribute('cy', center.toString());
    circle.setAttribute('r', (radius * (i / 5)).toString());
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#d6d3d1');
    circle.setAttribute('stroke-width', '1');
    circle.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(circle);

    // Add value labels
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (center - radius * (i / 5) - 5).toString());
    text.setAttribute('y', center.toString());
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#78716c');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-weight', '500');
    text.textContent = (i * 2).toString();
    svg.appendChild(text);
  }

  const anglePerSegment = (2 * Math.PI) / sortedData.length;
  const segmentPadding = anglePerSegment * 0.1;

  // Create radial lines
  sortedData.forEach((_, index) => {
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
    svg.appendChild(line);
  });

  // Color function
  const getColorByScore = (score: number): string => {
    const sanitizedScore = Math.max(0, Math.min(10, Number(score)));
    
    if (sanitizedScore <= 3.33) {
      return 'rgba(179, 82, 54, 0.8)'; // Earth Red
    } else if (sanitizedScore <= 6.67) {
      return 'rgba(204, 153, 51, 0.8)'; // Earth Amber
    } else {
      return 'rgba(101, 133, 76, 0.8)'; // Earth Green
    }
  };

  // Create virtue segments
  sortedData.forEach((item, index) => {
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
    svg.appendChild(path);
  });

  // Add virtue labels
  sortedData.forEach((item, index) => {
    const angle = index * anglePerSegment + anglePerSegment / 2;
    const labelRadius = radius + 60; // Closer to chart edge
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    
    let textAnchor = 'middle';
    let dx = 0;
    
    if (angle > Math.PI / 2 && angle < 3 * Math.PI / 2) {
      textAnchor = 'end';
      dx = -10;
    } else if (angle < Math.PI / 2 || angle > 3 * Math.PI / 2) {
      textAnchor = 'start';
      dx = 10;
    }
    
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', (x + dx).toString());
    text.setAttribute('y', y.toString());
    text.setAttribute('text-anchor', textAnchor);
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', '#44403c');
    text.setAttribute('font-size', '18'); // Larger, more readable font
    text.setAttribute('font-family', 'Arial, sans-serif');
    text.setAttribute('font-weight', '700');
    text.textContent = item.virtue;
    svg.appendChild(text);
  });

  // Add center circle
  const centerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  centerCircle.setAttribute('cx', center.toString());
  centerCircle.setAttribute('cy', center.toString());
  centerCircle.setAttribute('r', '12');
  centerCircle.setAttribute('fill', '#f5f5f4');
  centerCircle.setAttribute('stroke', '#d6d3d1');
  centerCircle.setAttribute('stroke-width', '1');
  svg.appendChild(centerCircle);

  container.appendChild(svg);

  // Get SVG content
  const svgContent = new XMLSerializer().serializeToString(svg);
  
  // Clean up
  document.body.removeChild(container);

  // Create and download file
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
