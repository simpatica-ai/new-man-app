// src/utils/chartToImage.ts
export const convertChartToImage = async (context?: string): Promise<string | null> => {
  try {
    console.log('Starting chart conversion...', context ? `Context: ${context}` : '');
    
    // Wait a bit longer to ensure the chart is fully rendered
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find the chart by data-testid first
    let chartElement = document.querySelector('[data-testid="virtue-chart"]') as HTMLElement;
    console.log('Chart element found by data-testid:', !!chartElement);
    
    // If not found by data-testid, try to find the SVG directly
    if (!chartElement) {
      console.log('Looking for SVG element...');
      const svgElement = document.querySelector('svg');
      if (svgElement) {
        chartElement = svgElement as HTMLElement;
        console.log('Found SVG element');
      }
    }
    
    if (!chartElement) {
      console.warn('No suitable chart element found');
      return null;
    }
    
    console.log('Using chart element:', chartElement.tagName);
    
    // Use html-to-image to convert the chart to an image
    const { toPng } = await import('html-to-image');
    
    // Set different options based on context - CAPTURE AT PROPER SIZE FOR PDF
    const options = {
      backgroundColor: '#FFFFFF',
      quality: 1.0,
      pixelRatio: context === 'pdf' ? 1.5 : 2,
      width: context === 'pdf' ? 350 : undefined,  // Capture at 350px for PDF
      height: context === 'pdf' ? 350 : undefined, // Capture at 350px for PDF
    };
    
    console.log('Conversion options:', options);
    
    const dataUrl = await toPng(chartElement, options);
    
    console.log('Chart converted successfully');
    return dataUrl;
  } catch (error) {
    console.error('Error converting chart to image:', error);
    return null;
  }
};