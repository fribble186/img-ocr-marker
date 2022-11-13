import React, { useRef, useState, useEffect } from 'react';
import { useImgPreviewer } from '@tms/img-ocr-marker';
import { LabelJson } from './MockData';
import type { ProjectInterface } from '@tms/img-ocr-marker/dist/Domains/MarkDomain/modal';

const PreviewerDemo = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [img, setImg] = useState<ProjectInterface['img'] | undefined>();
  const [rect, setRect] = useState<
    ProjectInterface['labelList'][number]['coord'] | undefined
  >();
  const { zoomInImg2x, zoomOutImgHalf, startDrag } = useImgPreviewer({
    containerRef: containerRef.current,
    img,
    coords: rect ? [rect] : [],
  });

  useEffect(() => {
    if (containerRef.current) {
      const img = new Image();
      img.src = LabelJson.imgurl;
      img.onload = () => {
        setImg({
          image: img,
          width: img.width,
          height: img.height,
        });
      };
    }
  }, [setImg]);

  return (
    <div>
      <span>preview 预览</span>
      <div onClick={zoomInImg2x}>zoomin</div>
      <div style={{ display: 'flex' }}>
        <div
          ref={containerRef}
          style={{
            width: 500,
            height: 500,
          }}
        />
        <div>
          {LabelJson.labelList.map((label) => (
            <div
              key={label.content}
              onClick={() => setRect(label.coord)}
              style={{ border: '1px solid black', cursor: 'pointer' }}
            >
              {label.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreviewerDemo;
