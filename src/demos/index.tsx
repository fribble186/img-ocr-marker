import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { LabelJson } from './MockData';

import useImgMarker from '@tms/img-ocr-marker';
import type { ProjectInterface } from '@tms/img-ocr-marker/dist/Domains/MarkDomain/modal';
import type { AfterMarkCallbackType } from '@tms/img-ocr-marker/dist/Domains/CanvasDomain/api';

const styles: Record<string, React.HTMLAttributes<unknown>['style']> = {
  pageContainer: {
    display: 'flex',
    height: 'calc(100vh - 200px)',
    marginTop: 12,
  },
  pageContainerWithScroll: {
    display: 'flex',
    height: 'calc(100vh + 200px)',
    width: 'calc(100vw + 200px)',
    marginTop: 12,
    padding: 20,
  },
  canvasAreaContainer: { flex: 1, height: '100%', display: 'flex' },
  canvasAreaContainerWithScroll: {
    display: 'flex',
    width: 300,
    height: 500,
    overflow: 'auto',
    margin: 50,
  },
  canvasContainer: { width: '100%', height: '100%' },
  canvasContainerWithScroll: { width: 500, height: 800, top: 30, left: 300 },
  dataAreaContainer: { flex: 1, height: '100%' },
  toolbarContainer: { display: 'flex', flexDirection: 'column' },
  marksContainer: { overflowY: 'auto' },
  mark: {
    border: '1px solid black',
    marginBottom: 8,
    padding: '4px 8px',
    cursor: 'pointer',
  },
  markFocused: {
    border: '1px solid blue',
    marginBottom: 8,
    padding: '4px 8px',
    color: 'blue',
    cursor: 'pointer',
  },
  buttonStyle: { marginBottom: 8, width: 80 },
  disableButton: { background: 'gray' },
  ableButton: { background: 'green', color: 'white' },
  modal: {
    position: 'absolute',
    background: 'white',
    padding: '12px',
    top: 0,
    left: 0,
    borderRadius: 4,
  },
  mr_8: { marginRight: 8 },
};

const Label = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<ProjectInterface | undefined>();
  const [tempMark, setTempMark] = useState<
    Parameters<AfterMarkCallbackType>[0] | undefined
  >();
  const [addMarkContent, setAddMarkContent] = useState<string>('');
  const [isScroll, setIsScroll] = useState<boolean>(false);

  const {
    zoomInImg2x,
    zoomOutImgHalf,
    startDrag,
    endOperate,
    startSelect,
    startMark,
    startMarkWithCallback,
    clearRect,

    focusMark,
    editMarkContent,
    deleteMarkFn,
    addMarkFn,
    sortMarks,
    operate,
    __INSIDE__INIT,
  } = useImgMarker({
    data,
    containerRef: containerRef.current,
    setData,
    settings: {
      needCalculateScroll: true,
    },
  });

  useEffect(() => {
    if (containerRef.current) {
      const img = new Image();
      img.src = LabelJson.imgurl;
      img.onload = () => {
        const projectData: ProjectInterface = {
          img: {
            image: img,
            width: img.width,
            height: img.height,
          },
          labelList: LabelJson.labelList.map((label, index) => ({
            ...label,
            id: String(index),
            isEdit: false,
            isFocus: false,
          })),
          settings: {
            borderColor: 'black',
          },
        };
        setData(projectData);
      };
    }
  }, [setData]);

  const handleAfterMark: AfterMarkCallbackType = useCallback(
    ({ coord, position }) => {
      setTempMark({
        coord,
        position,
      });
    },
    [],
  );

  const addMark = () => {
    if (tempMark?.coord) {
      addMarkFn({
        id: Math.random().toString(),
        content: addMarkContent,
        coord: tempMark.coord,
        isEdit: true,
        isFocus: true,
      });
      setAddMarkContent('');
      setTempMark(undefined);
    }
  };

  const cancelAddMark = () => {
    setTempMark(undefined);
    clearRect();
  };

  const editMark = (label: ProjectInterface['labelList'][number]) => {
    editMarkContent({ ...label, content: document.forms[0]['content'].value });
  };

  const cancelEditMark = (label: ProjectInterface['labelList'][number]) => {
    focusMark(label);
  };

  const clear = () => {
    setData(
      (data) =>
        data && { ...data, labelList: [] as ProjectInterface['labelList'] },
    );
  };

  const ToolsBar: React.FC = () => (
    <div style={styles.toolbarContainer}>
      <button style={styles.buttonStyle} onClick={() => sortMarks()}>
        排序
      </button>
      <button style={styles.buttonStyle} onClick={() => deleteMarkFn()}>
        删除
      </button>
      <button style={styles.buttonStyle} onClick={zoomInImg2x}>
        放大
      </button>
      <button style={styles.buttonStyle} onClick={zoomOutImgHalf}>
        缩小
      </button>
      <button style={styles.buttonStyle} onClick={clear}>
        清空
      </button>
      <button
        style={{
          ...styles.buttonStyle,
          ...(operate.isDraging ? styles.ableButton : styles.disableButton),
        }}
        onClick={() => {
          if (operate.isDraging) {
            endOperate();
          } else {
            startDrag();
          }
        }}
      >
        拖拽
      </button>
      <button
        style={{
          ...styles.buttonStyle,
          ...(operate.isMarking ? styles.ableButton : styles.disableButton),
        }}
        onClick={() => {
          if (operate.isMarking) {
            endOperate();
          } else {
            startMark();
          }
        }}
      >
        编辑标注
      </button>
      <button
        style={{
          ...styles.buttonStyle,
          ...(operate.isSelecting ? styles.ableButton : styles.disableButton),
        }}
        onClick={() => {
          if (operate.isSelecting) {
            endOperate();
          } else {
            startSelect();
          }
        }}
      >
        选择标注
      </button>
      <button
        style={{
          ...styles.buttonStyle,
          ...(operate.isMarkCallback
            ? styles.ableButton
            : styles.disableButton),
        }}
        onClick={() => {
          if (operate.isMarkCallback) {
            endOperate();
            setTempMark(undefined);
          } else {
            startMarkWithCallback(handleAfterMark);
          }
        }}
      >
        新增标注
      </button>
      <div style={{ fontSize: 12 }}>*点击启用相应功能</div>
    </div>
  );

  useLayoutEffect(() => {
    __INSIDE__INIT();
  }, [isScroll]);

  return (
    <div>
      <span>
        图片标注的显示和编辑 demo
        <button
          onClick={() => {
            setIsScroll((v) => !v);
          }}
        >
          {`测试${isScroll ? '没' : ''}有滚轮的页面布局`}
        </button>
      </span>
      <div
        style={isScroll ? styles.pageContainerWithScroll : styles.pageContainer}
      >
        <div
          style={
            isScroll
              ? styles.canvasAreaContainerWithScroll
              : styles.canvasAreaContainer
          }
        >
          <ToolsBar />
          <div
            ref={containerRef}
            style={
              isScroll
                ? styles.canvasContainerWithScroll
                : styles.canvasContainer
            }
          />
        </div>
        <div style={styles.dataAreaContainer}>
          <div style={styles.marksContainer}>
            {data?.labelList.map((label) => (
              <div
                key={label.id}
                style={label.isFocus ? styles.markFocused : styles.mark}
                onClick={() => {
                  focusMark(label);
                }}
              >
                {label.isFocus ? (
                  <form name="form">
                    <input
                      name="content"
                      style={{ ...styles.mr_8, width: 180 }}
                      defaultValue={label.content}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      style={styles.mr_8}
                      type="submit"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        editMark(label);
                      }}
                    >
                      确认
                    </button>
                    <button onClick={() => cancelEditMark(label)}>取消</button>
                  </form>
                ) : (
                  <span>
                    {label.content}
                    {label.isEdit ? '（已修改）' : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      {tempMark && tempMark?.coord && tempMark?.position ? (
        <div
          style={{
            ...styles.modal,
            top: tempMark.position.minY,
            left: tempMark.position.maxX + 12,
          }}
        >
          <input
            style={styles.mr_8}
            value={addMarkContent}
            onChange={(e) => setAddMarkContent(e.currentTarget.value)}
          />
          <button style={styles.mr_8} onClick={addMark}>
            确认
          </button>
          <button onClick={cancelAddMark}>取消</button>
        </div>
      ) : null}
    </div>
  );
};

export default Label;
