import { useCallback, useState, type RefObject } from 'react';

export function useResizableNode(
  containerRef: RefObject<HTMLElement>,
  initialWidth: string,
  onWidthChange: (width: string) => void,
  minWidth = 100,
) {
  const [width, setWidth] = useState(initialWidth);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();

      const parent = containerRef.current?.parentElement;
      if (!parent) {
        return;
      }

      const parentWidth = parent.getBoundingClientRect().width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const parentLeft = parent.getBoundingClientRect().left;
        const nextPixels = Math.max(minWidth, moveEvent.clientX - parentLeft);
        const nextPercent = Math.min(100, Math.max(10, (nextPixels / parentWidth) * 100));
        const nextWidth = `${Math.round(nextPercent)}%`;

        setWidth(nextWidth);
        onWidthChange(nextWidth);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [containerRef, minWidth, onWidthChange],
  );

  return { width, handleMouseDown };
}
