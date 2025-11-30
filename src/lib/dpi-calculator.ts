export function calculateDPI(
  pixelWidth: number,
  pixelHeight: number,
  printWidthInches: number,
  printHeightInches: number
): { dpiX: number; dpiY: number; avgDPI: number } {
  const dpiX = pixelWidth / printWidthInches;
  const dpiY = pixelHeight / printHeightInches;
  const avgDPI = Math.round((dpiX + dpiY) / 2);
  return { dpiX, dpiY, avgDPI };
}

export function checkPrintQuality(
  pixelWidth: number,
  pixelHeight: number,
  printAreaWidthPx: number,
  printAreaHeightPx: number,
  targetDPI: number = 300
): { isAcceptable: boolean; warning: string | null; actualDPI: number } {
  const printWidthInches = printAreaWidthPx / 96;
  const printHeightInches = printAreaHeightPx / 96;
  const { avgDPI } = calculateDPI(pixelWidth, pixelHeight, printWidthInches, printHeightInches);

  let warning = null;
  let isAcceptable = true;

  if (avgDPI < 150) {
    warning = 'Risoluzione troppo bassa per la stampa.';
    isAcceptable = false;
  } else if (avgDPI < targetDPI) {
    warning = `DPI: ${avgDPI}, consigliato: ${targetDPI}`;
  }

  return { isAcceptable, warning, actualDPI: avgDPI };
}
