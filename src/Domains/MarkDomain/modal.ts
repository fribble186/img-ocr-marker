/** 标注的图片 */
export interface ImgInterface {
  /** 标注图片的宽度 */
  width: number;
  /** 标注图片的高度 */
  height: number;
  /** 标注的图片 */
  image: HTMLImageElement;
}

/** 坐标 */
export type Coordinate = {
  /** 坐标框左上x值 */
  minX: number;
  /** 坐标框左上y值 */
  minY: number;
  /** 坐标框右下x值 */
  maxX: number;
  /** 坐标框右下y值 */
  maxY: number;
};

/** 单个标注 */
export interface MarkInterface {
  /** 前端生成的唯一 id */
  id: string;
  /** 标注坐标 */
  coord: Coordinate;
  /** 标注的文本 */
  content: string;
  /** 是否被选中 */
  isFocus: boolean;
  /** 是否被修改过 */
  isEdit: boolean;
}

export interface SettingsInterface {
  /** 自定义 选中后的边框颜色 */
  focusBorderColor?: string;
  /** 自定义 编辑后后的边框颜色 */
  editedBorderColor?: string;
  /** 自定义 正常情况的边框颜色 */
  borderColor?: string;
}

/** 标注项目 */
export interface ProjectInterface {
  /** 标注列表 */
  labelList: MarkInterface[];
  /** 标注的图片 */
  img: ImgInterface;
  /** 项目的自定义设置 */
  settings?: SettingsInterface;
}
