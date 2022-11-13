import { useEffect, useState } from 'react';
import {
  draw,
  zoomImg,
  startDrag,
  endOperate,
  startSelectMark,
  startMarkImg,
  startMarkWithCallback,
} from '../../Domains/CanvasDomain/api';
import {
  focusMarkContent,
  deleteMark,
  addMark,
  changeMarkContent,
  sortMarkByCoordinate,
} from '../../Domains/MarkDomain/api';

import type {
  ProjectInterface,
  MarkInterface,
} from '../../Domains/MarkDomain/modal';
import type { VectorType } from '../../Domains/CanvasDomain/api';
import produce from 'immer';
import type { AfterMarkCallbackType } from '../../Domains/CanvasDomain/api';

export interface ImgMarkerHookParams {
  data: ProjectInterface | undefined;
  containerRef: HTMLDivElement | null;
  setData: (d: ProjectInterface) => void;
  settings?: {
    needCalculateScroll?: boolean;
  };
}

const initVector = (
  containerRef: HTMLDivElement,
  img: ProjectInterface['img'],
) => {
  const containerHeight = containerRef.clientHeight;
  const containerWidth = containerRef.clientWidth;
  const containerWHRate = containerWidth / containerHeight;
  const imgWHRate = img.width / img.height;
  // 照片宽度和容器一致
  if (imgWHRate > containerWHRate) {
    const basicMagnification = containerWidth / img.width;
    return {
      magnification: basicMagnification,
      offset: {
        x: 0,
        y: (containerHeight - img.height * basicMagnification) / 2,
      },
      rotateDeg: 0,
    };
  }
  // 照片高度和容器一致
  const basicMagnification = containerHeight / img.height;
  return {
    magnification: basicMagnification,
    offset: { x: (containerWidth - img.width * basicMagnification) / 2, y: 0 },
    rotateDeg: 0,
  };
};

const useImgMarker = ({
  data,
  containerRef,
  setData,
  settings,
}: ImgMarkerHookParams) => {
  const [curImg, setCurImg] = useState<ProjectInterface['img'] | undefined>();
  const [vector, setVector] = useState<VectorType | undefined>();
  const [afterMarkCallback, setAfterMarkCallback] = useState<
    AfterMarkCallbackType | undefined
  >();
  const [operate, setOperate] = useState<{
    isDraging: boolean;
    isSelecting: boolean;
    isMarking: boolean;
    isMarkCallback: boolean;
  }>({
    isDraging: false,
    isSelecting: false,
    isMarking: false,
    isMarkCallback: false,
  });
  const setOperateData = (obj: Partial<typeof operate>) =>
    setOperate({
      isDraging: !!obj?.isDraging,
      isSelecting: !!obj?.isSelecting,
      isMarking: !!obj?.isMarking,
      isMarkCallback: !!obj?.isMarkCallback,
    });

  /** 初始化向量 */
  useEffect(() => {
    setCurImg((img) => {
      if (containerRef && data && img !== data.img) {
        setVector(initVector(containerRef, data.img));
        return data.img;
      }
      return img;
    });
  }, [containerRef, data, vector]);

  /** 绘图 */
  useEffect(() => {
    if (containerRef && data && vector)
      draw({
        projectData: data,
        vector,
        containerRef,
      });
  }, [containerRef, data, vector]);

  /** 拖拽 */
  useEffect(() => {
    if (vector && data && containerRef && operate.isDraging)
      startDrag({
        projectData: data,
        vector,
        containerRef,
        setVector,
      });
  }, [containerRef, data, vector, operate.isDraging]);

  /** 选择 */
  useEffect(() => {
    if (vector && data && containerRef && operate.isSelecting)
      startSelectMark({
        projectData: data,
        vector,
        containerRef,
        setProjectData: setData,
      });
  }, [containerRef, data, setData, vector, operate.isSelecting]);

  /** 框选 */
  useEffect(() => {
    if (vector && data && containerRef && operate.isMarking)
      startMarkImg({
        projectData: data,
        vector,
        containerRef,
        setProjectData: setData,
        needCalculateScroll: settings?.needCalculateScroll,
      });
  }, [containerRef, data, operate.isMarking, setData, vector]);

  /** 回调框选 */
  useEffect(() => {
    if (
      vector &&
      data &&
      containerRef &&
      operate.isMarkCallback &&
      afterMarkCallback
    )
      startMarkWithCallback({
        projectData: data,
        vector,
        containerRef,
        afterMarkCallback,
        needCalculateScroll: settings?.needCalculateScroll,
      });
  }, [
    containerRef,
    data,
    operate.isMarkCallback,
    setData,
    vector,
    afterMarkCallback,
  ]);

  /** 放大 */
  const handleZoomIn = () => {
    if (vector) setVector(zoomImg(containerRef, vector, 2));
  };
  /** 缩小 */
  const handleZoomOut = () => {
    if (vector) setVector(zoomImg(containerRef, vector, 0.5));
  };
  /** 旋转90度 */
  // const handleRotate90 = () => {
  //     if (vector && containerRef)
  //         setVector(rotateImg(containerRef, vector, 90))
  // }
  /** 开始拖拽 */
  const handleDrag = () => setOperateData({ isDraging: true });
  /** 开始选择 */
  const handleSelect = () => setOperateData({ isSelecting: true });
  /** 开始标记 */
  const handleMark = () => setOperateData({ isMarking: true });
  /** 开始有副作用的添加标记 */
  const handleMarkCallback = (callback: AfterMarkCallbackType) => {
    setAfterMarkCallback(() => callback);
    setOperateData({ isMarkCallback: true });
  };
  const clearRect = () => {
    if (data && vector && containerRef)
      draw({
        projectData: data,
        vector,
        containerRef,
      });
  };
  const init = () => {
    if (containerRef && data) setVector(initVector(containerRef, data.img));
  };
  /** 清除所有canvas监听副作用 */
  const handleEndOperate = () => {
    if (vector && data && containerRef) {
      setOperateData({});
      setAfterMarkCallback(undefined);
      endOperate({
        projectData: data,
        vector,
        containerRef,
      });
    }
  };

  /** focus 标注 */
  const focusMark = (targetLabel: MarkInterface) => {
    if (data) setData(focusMarkContent(data, targetLabel));
  };

  /** 编辑标注文本 */
  const editMarkContent = (targetLabel: MarkInterface) => {
    if (data) setData(changeMarkContent(data, targetLabel));
  };

  /** 删除标注 */
  const deleteMarkFn = (targetLabel?: MarkInterface) => {
    if (!targetLabel && data) {
      const focusLabel = data.labelList.find((l) => l.isFocus);
      if (focusLabel) setData(deleteMark(data, focusLabel));
    }
    if (targetLabel && data) setData(deleteMark(data, targetLabel));
  };

  /** 添加标注 */
  const addMarkFn = (targetLabel: MarkInterface) => {
    if (data) setData(addMark(data, targetLabel));
  };

  /** 标注排序 */
  const sortMarks = (
    sorter?: (a: MarkInterface, b: MarkInterface) => number,
  ) => {
    if (data && sorter)
      setData(
        produce(data, (draft) => {
          draft.labelList = draft.labelList.sort(sorter);
          return draft;
        }),
      );
    if (data && !sorter) setData(sortMarkByCoordinate(data));
  };

  return {
    zoomInImg2x: handleZoomIn,
    zoomOutImgHalf: handleZoomOut,
    startDrag: handleDrag,
    endOperate: handleEndOperate,
    startSelect: handleSelect,
    startMark: handleMark,
    startMarkWithCallback: handleMarkCallback,
    clearRect,

    focusMark,
    editMarkContent,
    deleteMarkFn,
    addMarkFn,
    sortMarks,
    operate,

    __INSIDE__INIT: init,
  };
};

export default useImgMarker;
