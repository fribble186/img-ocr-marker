import { useState, useEffect } from 'react';
import useImgMarker from '.';
import type {
  ProjectInterface,
  Coordinate,
} from '../../Domains/MarkDomain/modal';
import type { ImgMarkerHookParams } from '.';

export interface ImgPerviewerHookParams {
  img: ProjectInterface['img'] | undefined;
  containerRef: HTMLDivElement | null;
  coords: Coordinate[];
  settings?: ImgMarkerHookParams['settings'];
  projectDataSettings?: ProjectInterface['settings'];
}
const useImgPreviewer = ({
  img,
  containerRef,
  coords,
  settings,
  projectDataSettings,
}: ImgPerviewerHookParams) => {
  const [labelList, setLabelList] = useState<ProjectInterface['labelList']>([]);
  const [isDrag, setIsDrag] = useState<boolean>(false);
  const { zoomInImg2x, zoomOutImgHalf, startDrag, endOperate } = useImgMarker({
    data: img ? { img, labelList, settings: projectDataSettings } : undefined,
    containerRef,
    setData: () => {},
    settings,
  });
  useEffect(
    () =>
      setLabelList((old) => {
        if (
          JSON.stringify(old.map((l) => l.coord)) === JSON.stringify(coords)
        ) {
          return old;
        } else {
          return coords.map((coord, coordIndex) => ({
            id: String(coordIndex),
            coord,
            content: '',
            isFocus: false,
            isEdit: false,
          }));
        }
      }),
    [coords],
  );

  const handleDrag = () => {
    if (!isDrag) startDrag();
    else endOperate();
    setIsDrag((d) => !d);
  };

  return {
    zoomInImg2x,
    zoomOutImgHalf,
    startDrag: handleDrag,
  };
};

export default useImgPreviewer;
