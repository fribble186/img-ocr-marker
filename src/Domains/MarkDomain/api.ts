import type { Coordinate, MarkInterface, ProjectInterface } from './modal';
import { produce } from 'immer';
import BigNumber from 'bignumber.js';

/** 更改标注坐标 */
export const changeMarkCoordinate = (
  projectData: ProjectInterface,
  targetLabel: MarkInterface,
) =>
  produce(projectData, (draft) => {
    const targetInList = draft.labelList.find(
      (label) => label.id === targetLabel.id,
    );
    if (targetInList) {
      targetInList.coord = targetLabel.coord;
      targetInList.isEdit = true;
    }
    return draft;
  });

/** 更改标注内容 */
export const changeMarkContent = (
  projectData: ProjectInterface,
  targetLabel: MarkInterface,
) => {
  const afterChangedProjectData = produce(projectData, (draft) => {
    const targetInList = draft.labelList.find(
      (label) => label.id === targetLabel.id,
    );
    if (targetInList) {
      targetInList.content = targetLabel.content;
      targetInList.isEdit = true;
      targetInList.isFocus = false;
    }
    return draft;
  });
  return afterChangedProjectData;
};

/** 添加标注 */
export const addMark = (
  projectData: ProjectInterface,
  targetLabel: MarkInterface,
) => {
  const afterAddProjectData = produce(projectData, (draft) => {
    if (targetLabel.isFocus) {
      const curFocusLabelInList = draft.labelList.find(
        (label) => label.isFocus,
      );
      if (curFocusLabelInList) curFocusLabelInList.isFocus = false;
    }
    draft.labelList.unshift(targetLabel);
    return draft;
  });
  return afterAddProjectData;
};

/** 删除标注 */
export const deleteMark = (
  projectData: ProjectInterface,
  targetLabel: MarkInterface,
) =>
  produce(projectData, (draft) => {
    const targetIndex = draft.labelList.findIndex(
      (label) => label.id === targetLabel.id,
    );
    if (targetIndex !== -1) draft.labelList.splice(targetIndex, 1);
    return draft;
  });

/** 改变标注 focus 状态 */
export const focusMarkContent = (
  projectData: ProjectInterface,
  targetLabel: MarkInterface,
) =>
  produce(projectData, (draft) => {
    const targetInList = draft.labelList.find(
      (label) => label.id === targetLabel.id,
    );
    const curFocusLabelInList = draft.labelList.find((label) => label.isFocus);
    if (targetInList) targetInList.isFocus = true;
    if (curFocusLabelInList) curFocusLabelInList.isFocus = false;
    return draft;
  });

/** 合并 */
export const mergeMark = (
  projectData: ProjectInterface,
  mergeMarkList: MarkInterface[],
) =>
  produce(projectData, (draft) => {
    const _mergeMarkList = mergeMarkList.filter((mark) =>
      draft.labelList.find((d) => d.id === mark.id),
    );
    // 合并
    const mergedMark = _mergeMarkList.reduce((result, curMark, curIndex) => {
      if (curIndex === 0) {
        result.id = curMark.id;
        result.isFocus = false;
        result.isEdit = true;
        result.content = curMark.content;
        result.coord = { ...curMark.coord } as Coordinate;
      }
      if (curMark.coord.minX < result.coord.minX)
        result.coord.minX = curMark.coord.minX;
      if (curMark.coord.minY < result.coord.minY)
        result.coord.minY = curMark.coord.minY;
      if (curMark.coord.maxX > result.coord.maxX)
        result.coord.maxX = curMark.coord.maxX;
      if (curMark.coord.maxY > result.coord.maxY)
        result.coord.maxY = curMark.coord.maxY;

      return result;
    }, {} as MarkInterface);
    // 合并到第一个，删除剩余的
    const firstIndex = draft.labelList.findIndex(
      (l) => l.id === _mergeMarkList[0].id,
    );
    draft.labelList[firstIndex] = mergedMark;
    _mergeMarkList.shift();
    _mergeMarkList.forEach(({ id }) => {
      draft.labelList.splice(
        draft.labelList.findIndex((l) => l.id === id),
        1,
      );
    });

    return draft;
  });

/** 按照坐标进行排序 */
export const sortMarkByCoordinate = (projectData: ProjectInterface) =>
  produce(projectData, (draft) => {
    draft.labelList = draft.labelList.sort((a, b) =>
      new BigNumber(a.coord.minY * draft.img.width + a.coord.minX)
        .minus(new BigNumber(b.coord.minY * draft.img.width + b.coord.minX))
        .toNumber(),
    );
    return draft;
  });
