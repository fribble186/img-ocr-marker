import type { ProjectInterface, Coordinate } from '../MarkDomain/modal';
import {
  focusMarkContent,
  changeMarkCoordinate,
  mergeMark,
} from '../MarkDomain/api';
import { registerListener, unregisterAllListener } from './event';
import {
  CANVAS_IMG_WIDTH,
  CANVAS_IMG_HEIGHT,
  CANVAS_RECT,
  IS_POINT_IN_RECT,
  REVERSE_IMG_COORD,
  IS_RECT_IN_RECT,
  OFFSET_AFTER_ZOOM,
} from './calculate';

/** 公共偏移向量 */
export type VectorType = {
  /** 放大倍率 */
  magnification: number;
  /** 偏移 */
  offset: { x: number; y: number };
  rotateDeg: number;
};

/** 标记后的回调函数 */
export type AfterMarkCallbackType = (params: {
  coord: Coordinate;
  position: Coordinate;
}) => void;

const CANVAS_ID = 'Mark_Canvas';
const DefaultFocusRectColor = '#2A6DE7';
const DefaultEditedRectColor = '#DA1E28';
const DefaultNormalRectColor = '#23A123';

/** 绘图 */
export const draw = async ({
  projectData,
  vector,
  containerRef,
  tempRect = undefined,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
  tempRect?: Coordinate | undefined;
}) => {
  const FocusRectColor =
    projectData.settings?.focusBorderColor || DefaultFocusRectColor;
  const EditedRectColor =
    projectData.settings?.editedBorderColor || DefaultEditedRectColor;
  const NormalRectColor =
    projectData.settings?.borderColor || DefaultNormalRectColor;
  let canvasElement: HTMLCanvasElement;
  if (containerRef.childNodes.length) {
    canvasElement = document.getElementById(CANVAS_ID) as HTMLCanvasElement;
  } else {
    // 生成 canvas element，并设置标识 id
    canvasElement = document.createElement('canvas');
    canvasElement.id = CANVAS_ID;
  }
  if (!canvasElement) return;
  // 设置 canvas 长宽
  const containerWidth = containerRef.clientWidth;
  const containerHeight = containerRef.clientHeight;
  canvasElement.width = containerWidth;
  canvasElement.height = containerHeight;
  // 开始画照片
  const imgCanvasCtx = canvasElement.getContext('2d');
  imgCanvasCtx?.clearRect(0, 0, containerWidth, containerHeight);
  if (imgCanvasCtx && (vector.rotateDeg / 90) % 4 !== 0) {
    imgCanvasCtx.rotate((vector.rotateDeg * Math.PI) / 180);
  }
  if (imgCanvasCtx && projectData.img.image) {
    imgCanvasCtx.drawImage(
      projectData.img.image,
      vector.offset.x,
      vector.offset.y,
      CANVAS_IMG_WIDTH(projectData.img, vector),
      CANVAS_IMG_HEIGHT(projectData.img, vector),
    );
  }
  // 开始画标注框
  if (imgCanvasCtx) {
    projectData.labelList.forEach((label) => {
      if (label.isFocus) {
        imgCanvasCtx.strokeStyle = FocusRectColor;
      } else if (label.isEdit) {
        imgCanvasCtx.strokeStyle = EditedRectColor;
      } else {
        imgCanvasCtx.strokeStyle = NormalRectColor;
      }
      imgCanvasCtx.strokeRect(...CANVAS_RECT(label.coord, vector));
    });
  }
  // 开始画临时标注框
  if (imgCanvasCtx && tempRect) {
    imgCanvasCtx.strokeStyle = EditedRectColor;
    imgCanvasCtx.strokeRect(...CANVAS_RECT(tempRect, vector));
  }
  containerRef.append(canvasElement);
};

/** 居中放缩图片 */
export const zoomImg = (
  containerRef: HTMLDivElement | null,
  vector: VectorType,
  magnification: number,
) => {
  if (containerRef) {
    return {
      ...vector,
      offset: OFFSET_AFTER_ZOOM(
        { x: containerRef.clientWidth, y: containerRef.clientHeight },
        vector.offset,
        magnification,
      ),
      magnification: vector.magnification * magnification,
    } as VectorType;
  } else vector;
};

/** 旋转图片 */
// export const rotateImg = (containerRef: HTMLDivElement, vector: VectorType, rotate: number) => {
//     const rotateDeg = vector.rotateDeg + rotate;
//     const { x, y } = REVERSE_ROTATE_IMG_COORD(rotateDeg)
//     return {
//         ...vector,
//         rotateDeg,
//         offset: {
//             x: containerRef.clientWidth * x + vector.offset.x,
//             y: -containerRef.clientWidth * y + vector.offset.y,
//         }
//     } as VectorType;
// }

/** 开始监听拖拽相关的事件 */
export const startDrag = ({
  projectData,
  vector,
  containerRef,
  setVector,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
  setVector: (v: VectorType) => void;
}) => {
  const oldCanvasElement = document.getElementById(
    CANVAS_ID,
  ) as HTMLCanvasElement;
  const canvasElement = unregisterAllListener(oldCanvasElement);
  draw({
    projectData,
    vector,
    containerRef,
  });
  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  let isMove = false;
  const handleStartMouse = (e: MouseEvent) => {
    startX = e.pageX;
    startY = e.pageY;
    isMove = true;
  };
  const handleMoveMouse = (e: MouseEvent) => {
    if (isMove) {
      moveX = e.pageX;
      moveY = e.pageY;
      const offset = {
        x: vector.offset.x + moveX - startX,
        y: vector.offset.y + moveY - startY,
      };
      draw({
        projectData,
        vector: { ...vector, offset },
        containerRef,
      });
    }
  };
  const handleEndMouse = () => {
    const offset = {
      x: vector.offset.x + moveX - startX,
      y: vector.offset.y + moveY - startY,
    };
    if (moveX > 0 && moveY > 0) setVector({ ...vector, offset });
    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    isMove = false;
  };

  if (canvasElement) {
    registerListener(canvasElement, {
      handleStartMouse,
      handleMoveMouse,
      handleEndMouse,
    });
  }
};

/** 开始监听点击选择相关的事件 */
export const startSelectMark = ({
  projectData,
  vector,
  containerRef,
  setProjectData,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
  setProjectData: (v: ProjectInterface) => void;
}) => {
  const oldCanvasElement = document.getElementById(
    CANVAS_ID,
  ) as HTMLCanvasElement;
  const canvasElement = oldCanvasElement.cloneNode(true) as HTMLCanvasElement;
  oldCanvasElement.parentNode?.replaceChild(canvasElement, oldCanvasElement);
  draw({
    projectData,
    vector,
    containerRef,
  });
  const handleClick = (e: MouseEvent) => {
    const { clientX: clickX, clientY: clickY } = e;
    const { top: elementBasicY, left: elementBasicX } =
      canvasElement.getBoundingClientRect();
    projectData.labelList.forEach((label) => {
      if (
        IS_POINT_IN_RECT({ x: clickX, y: clickY }, label.coord, vector, {
          x: elementBasicX,
          y: elementBasicY,
        })
      ) {
        setProjectData(focusMarkContent(projectData, label));
      }
    });
  };

  if (canvasElement) {
    canvasElement.addEventListener('click', handleClick);
  }
};

/** 开始监听框选标记相关的事件 */
export const startMarkImg = ({
  projectData,
  vector,
  containerRef,
  setProjectData,
  needCalculateScroll = false,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
  setProjectData: (v: ProjectInterface) => void;
  needCalculateScroll?: boolean;
}) => {
  const oldCanvasElement = document.getElementById(
    CANVAS_ID,
  ) as HTMLCanvasElement;
  const canvasElement = unregisterAllListener(oldCanvasElement);
  draw({
    projectData,
    vector,
    containerRef,
  });
  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  let isMark = false;
  const { offsetTop: elementBasicY, offsetLeft: elementBasicX } = canvasElement;

  const handleStartMouse = (e: MouseEvent) => {
    startX = e.pageX;
    startY = e.pageY;
    isMark = true;
  };
  const handleMoveMouse = (e: MouseEvent) => {
    // 循环寻找 parent 的 scrollTop scrollLeft，最多三层
    let scrollTop = 0,
      scrollLeft = 0;
    if (needCalculateScroll) {
      let childElement: HTMLElement = canvasElement;
      for (let depth = 0; depth < 3; depth++) {
        if (childElement.parentElement) {
          scrollTop += childElement.parentElement.scrollTop;
          scrollLeft += childElement.parentElement.scrollLeft;
          childElement = childElement.parentElement;
        }
      }
    }
    if (isMark) {
      moveX = e.pageX;
      moveY = e.pageY;
      const { x: minX, y: minY } = REVERSE_IMG_COORD(
        { x: startX, y: startY },
        vector,
        { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
      );
      const { x: maxX, y: maxY } = REVERSE_IMG_COORD(
        { x: moveX, y: moveY },
        vector,
        { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
      );
      const tempRect: Coordinate = { minX, minY, maxX, maxY };
      draw({
        projectData,
        vector,
        containerRef,
        tempRect,
      });
    }
  };
  const handleEndMouse = () => {
    // 循环寻找 parent 的 scrollTop scrollLeft，最多三层
    let scrollTop = 0,
      scrollLeft = 0;
    if (needCalculateScroll) {
      let childElement: HTMLElement = canvasElement;
      for (let depth = 0; depth < 3; depth++) {
        if (childElement.parentElement) {
          scrollTop += childElement.parentElement.scrollTop;
          scrollLeft += childElement.parentElement.scrollLeft;
          childElement = childElement.parentElement;
        }
      }
    }
    const { x: minX, y: minY } = REVERSE_IMG_COORD(
      { x: startX, y: startY },
      vector,
      { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
    );
    const { x: maxX, y: maxY } = REVERSE_IMG_COORD(
      { x: moveX, y: moveY },
      vector,
      { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
    );
    const tempRect: Coordinate = { minX, minY, maxX, maxY };
    const marksInTempRect = projectData.labelList.filter((label) =>
      IS_RECT_IN_RECT(tempRect, label.coord),
    );
    if (marksInTempRect.length >= 2) {
      // 合并
      setProjectData(mergeMark(projectData, marksInTempRect));
    } else {
      // 编辑，新坐标
      const focusMark = projectData.labelList.find((l) => l.isFocus);
      if (focusMark)
        setProjectData(
          changeMarkCoordinate(projectData, { ...focusMark, coord: tempRect }),
        );
    }
    draw({
      projectData,
      vector,
      containerRef,
    });

    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    isMark = false;
  };

  if (canvasElement) {
    registerListener(canvasElement, {
      handleStartMouse,
      handleMoveMouse,
      handleEndMouse,
    });
  }
};

/** 开始监听有回调的标记 */
export const startMarkWithCallback = ({
  projectData,
  vector,
  containerRef,
  afterMarkCallback,
  needCalculateScroll = false,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
  afterMarkCallback: AfterMarkCallbackType;
  needCalculateScroll?: boolean;
}) => {
  const oldCanvasElement = document.getElementById(
    CANVAS_ID,
  ) as HTMLCanvasElement;
  const canvasElement = unregisterAllListener(oldCanvasElement);
  draw({
    projectData,
    vector,
    containerRef,
  });
  let startX = 0;
  let startY = 0;
  let moveX = 0;
  let moveY = 0;
  let isMark = false;
  const { offsetTop: elementBasicY, offsetLeft: elementBasicX } = canvasElement;

  const handleStartMouse = (e: MouseEvent) => {
    startX = e.pageX;
    startY = e.pageY;
    isMark = true;
  };
  const handleMoveMouse = (e: MouseEvent) => {
    // 循环寻找 parent 的 scrollTop scrollLeft，最多三层
    let scrollTop = 0,
      scrollLeft = 0;
    if (needCalculateScroll) {
      let childElement: HTMLElement = canvasElement;
      for (let depth = 0; depth < 3; depth++) {
        if (childElement.parentElement) {
          scrollTop += childElement.parentElement.scrollTop;
          scrollLeft += childElement.parentElement.scrollLeft;
          childElement = childElement.parentElement;
        }
      }
    }
    if (isMark) {
      moveX = e.pageX;
      moveY = e.pageY;
      const { x: minX, y: minY } = REVERSE_IMG_COORD(
        { x: startX, y: startY },
        vector,
        { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
      );
      const { x: maxX, y: maxY } = REVERSE_IMG_COORD(
        { x: moveX, y: moveY },
        vector,
        { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
      );
      const tempRect: Coordinate = { minX, minY, maxX, maxY };
      draw({
        projectData,
        vector,
        containerRef,
        tempRect,
      });
    }
  };
  const handleEndMouse = () => {
    // 循环寻找 parent 的 scrollTop scrollLeft，最多三层
    let scrollTop = 0,
      scrollLeft = 0;
    if (needCalculateScroll) {
      let childElement: HTMLElement = canvasElement;
      for (let depth = 0; depth < 3; depth++) {
        if (childElement.parentElement) {
          scrollTop += childElement.parentElement.scrollTop;
          scrollLeft += childElement.parentElement.scrollLeft;
          childElement = childElement.parentElement;
        }
      }
    }
    const { x: minX, y: minY } = REVERSE_IMG_COORD(
      { x: startX, y: startY },
      vector,
      { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
    );
    const { x: maxX, y: maxY } = REVERSE_IMG_COORD(
      { x: moveX, y: moveY },
      vector,
      { x: elementBasicX - scrollLeft, y: elementBasicY - scrollTop },
    );
    const tempRect: Coordinate = { minX, minY, maxX, maxY };
    if (moveX > 0 && moveY > 0)
      afterMarkCallback({
        coord: tempRect,
        position: {
          minX: startX,
          minY: startY,
          maxX: moveX,
          maxY: moveY,
        },
      });
    startX = 0;
    startY = 0;
    moveX = 0;
    moveY = 0;
    isMark = false;
  };
  if (canvasElement) {
    registerListener(canvasElement, {
      handleStartMouse,
      handleMoveMouse,
      handleEndMouse,
    });
  }
};

/** 结束对 canvas 的操作 */
export const endOperate = ({
  projectData,
  vector,
  containerRef,
}: {
  projectData: ProjectInterface;
  vector: VectorType;
  containerRef: HTMLDivElement;
}) => {
  const oldCanvasElement = document.getElementById(
    CANVAS_ID,
  ) as HTMLCanvasElement;
  unregisterAllListener(oldCanvasElement);
  draw({
    projectData,
    vector,
    containerRef,
  });
};
