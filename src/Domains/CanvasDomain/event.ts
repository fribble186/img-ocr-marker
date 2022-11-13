export const unregisterAllListener = (element: HTMLCanvasElement) => {
  const oldCanvasElement = element;
  const canvasElement = oldCanvasElement.cloneNode(true) as HTMLCanvasElement;
  oldCanvasElement.parentNode?.replaceChild(canvasElement, oldCanvasElement);
  return canvasElement;
};

export const registerListener = (
  element: HTMLCanvasElement,
  events: {
    handleStartMouse?: (e: MouseEvent) => void;
    handleMoveMouse?: (e: MouseEvent) => void;
    handleEndMouse?: () => void;
    handleClick?: (e: MouseEvent) => void;
  },
) => {
  const { handleStartMouse, handleMoveMouse, handleEndMouse, handleClick } =
    events;
  if (handleStartMouse) element.addEventListener('mousedown', handleStartMouse);
  if (handleMoveMouse) element.addEventListener('mousemove', handleMoveMouse);
  if (handleEndMouse) element.addEventListener('mouseup', handleEndMouse);
  if (handleClick) element.addEventListener('click', handleClick);
};
