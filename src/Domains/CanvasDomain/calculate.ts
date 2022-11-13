/** 线性变化后的数值 */
import type { VectorType } from './api';
import type { ImgInterface, Coordinate } from '../MarkDomain/modal';

/** 图片宽度等比例缩放 */
export const CANVAS_IMG_WIDTH = (img: ImgInterface, vector: VectorType) =>
  img.width * vector.magnification;
/** 图片高度等比例缩放 */
export const CANVAS_IMG_HEIGHT = (img: ImgInterface, vector: VectorType) =>
  img.height * vector.magnification;
/** 拿到放大后的相对 offset 为了图片能够居中放大 */
export const OFFSET_AFTER_ZOOM = (
  origin: { x: number; y: number },
  offset: { x: number; y: number },
  magnification: number,
) => {
  // 看成两个图层，照片图层和固定不动的 canvas 相框
  // 拿到除了 offset 容器剩下的空间
  const rest = {
    x: origin.x - 2 * offset.x,
    y: origin.y - 2 * offset.y,
  };
  return {
    x: (origin.x - magnification * rest.x) / 2,
    y: (origin.y - magnification * rest.y) / 2,
  };
};
/** 线性变化后的方框坐标 */
export const CANVAS_RECT = (coord: Coordinate, vector: VectorType) =>
  [
    coord.minX * vector.magnification + vector.offset.x,
    coord.minY * vector.magnification + vector.offset.y,
    (coord.maxX - coord.minX) * vector.magnification,
    (coord.maxY - coord.minY) * vector.magnification,
  ] as const;
/** 判断点是否在方框中 */
export const IS_POINT_IN_RECT = (
  point: { x: number; y: number },
  coord: Coordinate,
  vector: VectorType,
  offset: VectorType['offset'],
) =>
  point.x > coord.minX * vector.magnification + vector.offset.x + offset.x &&
  point.x < coord.maxX * vector.magnification + vector.offset.x + offset.x &&
  point.y > coord.minY * vector.magnification + vector.offset.y + offset.y &&
  point.y < coord.maxY * vector.magnification + vector.offset.y + offset.y;
/** 判断方框是否在方框中,传的点已经逆变换过 */
export const IS_RECT_IN_RECT = (
  outside_rect_coord: Coordinate,
  inside_rect_coord: Coordinate,
) =>
  outside_rect_coord.minX < inside_rect_coord.minX &&
  outside_rect_coord.minY < inside_rect_coord.minY &&
  outside_rect_coord.maxX > inside_rect_coord.maxX &&
  outside_rect_coord.maxY > inside_rect_coord.maxY;

/** canvas 坐标逆变换成 img 上的坐标 */
export const REVERSE_IMG_COORD = (
  canvasCoord: { x: number; y: number },
  vector: VectorType,
  offset: { x: number; y: number },
) => ({
  x: (canvasCoord.x - offset.x - vector.offset.x) / vector.magnification,
  y: (canvasCoord.y - offset.y - vector.offset.y) / vector.magnification,
});
// export const REVERSE_ROTATE_IMG_COORD = (rotateDeg: number) => {
//     const COS_DEG = Math.round(Math.cos(rotateDeg * Math.PI / 180));
//     const SIN_DEG = Math.round(Math.sin(rotateDeg * Math.PI / 180));
//     return ({
//         x: COS_DEG / (COS_DEG ** 2 - SIN_DEG ** 2),
//         y: SIN_DEG / (COS_DEG ** 2 + SIN_DEG ** 2)
//     });
// }
