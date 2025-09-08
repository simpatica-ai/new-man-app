// src/utils/chartToImage.ts

/**
 * Waits for the chart to be fully rendered by polling for its core elements and then waiting for the
 * browser's next paint cycle using requestAnimationFrame. This is the most robust way to avoid race conditions.
 * @param element The chart's root HTML element.
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves when the chart is painted, or rejects on timeout.
 */
const waitForChartToRender = (element: HTMLElement, timeout: number = 5000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const labels = element.querySelectorAll('text');
      const wedges = element.querySelectorAll('path');

      // Check for a reasonable number of core elements. Based on your data, we expect at least 11 of each.
      // Assuming 11 virtue labels + 5 numeric axis labels = 16 text elements total.
      if (labels.length >= 16 && wedges.length >= 11) {
        clearInterval(interval);
        
        // Use requestAnimationFrame to wait for the browser to actually paint the elements to the screen.
        // Waiting for two frames is a standard practice to ensure rendering is complete.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
        
      } else if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        console.error(`Chart rendering timed out. Found ${labels.length} labels and ${wedges.length} wedges.`);
        reject(new Error('Chart rendering timed out.'));
      }
    }, 100); // Check every 100ms
  });
};

export const convertChartToImage = async (context?: string): Promise<string | null> => {
  try {
    console.log('Starting chart conversion...', context ? `Context: ${context}` : '');
    
    // Target the hidden chart specifically prepared for PDF export.
    let chartElement = document.querySelector('[data-testid="virtue-chart-pdf"]') as HTMLElement;
    console.log('Chart element found for PDF capture:', !!chartElement);
    
    if (!chartElement) {
      console.warn('No suitable chart element found for PDF export.');
      // Fallback to the visible chart if the PDF one isn't found
      chartElement = document.querySelector('[data-testid="virtue-chart"]') as HTMLElement;
      console.log('Falling back to visible chart element:', !!chartElement);
    }
    
    if (!chartElement) {
      console.error('No chart element could be found for capture.');
      return null;
    }
    
    console.log('Using chart element:', chartElement.tagName);

    // Wait for the chart to be fully and reliably painted before capturing.
    await waitForChartToRender(chartElement);
    console.log('Chart has been painted, proceeding with capture.');
    
    // Use html-to-image to convert the chart to an image
    const { toPng } = await import('html-to-image');
    
    const options = {
      backgroundColor: '#FAFAF9', // Corrected: Match the PDF container background color
      quality: 1.0,
      pixelRatio: 2.5, // Increased pixel ratio for better PDF quality
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