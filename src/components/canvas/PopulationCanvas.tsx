import React, { useRef, useEffect, useState } from 'react';
import { CANVAS_CONSTANTS } from '../../constants/game';
import type { Person } from '../../store/types';
import './PopulationCanvas.css';

/**
 * PopulationCanvas Props - 展示组件接口
 */
export interface PopulationCanvasProps {
  // 数据
  people: Person[];
  livingCount: number;
  deadCount: number;

  // 交互回调
  onPersonSelect: (id: string | null) => void;
  onPersonHover: (person: Person | null) => void;

  // 悬停状态
  hoveredPerson: Person | null;
}

/**
 * PopulationCanvas - 展示组件
 * 纯UI组件，无Store依赖
 */
export const PopulationCanvas: React.FC<PopulationCanvasProps> = ({
  people,
  livingCount,
  deadCount,
  onPersonSelect,
  onPersonHover,
  hoveredPerson,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateDimensions = () => {
      const parent = canvas.parentElement;
      if (parent) {
        setDimensions({
          width: parent.clientWidth,
          height: parent.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清空画布
    ctx.fillStyle = CANVAS_CONSTANTS.BACKGROUND_COLOR;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // 绘制人口
    people.forEach((person, index) => {
      const x = (index % 50) * 15 + 20;
      const y = Math.floor(index / 50) * 15 + 20;

      const isChild = person.age < 18;
      const radius = isChild ? CANVAS_CONSTANTS.PERSON_RADIUS_CHILD : CANVAS_CONSTANTS.PERSON_RADIUS;

      // 选择颜色
      let color;
      if (person.gender === 'male') {
        if (person.age < 40) {
          color = CANVAS_CONSTANTS.COLOR_MALE_YOUNG;
        } else {
          color = CANVAS_CONSTANTS.COLOR_MALE_OLD;
        }
      } else {
        if (person.age < 40) {
          color = CANVAS_CONSTANTS.COLOR_FEMALE_YOUNG;
        } else {
          color = CANVAS_CONSTANTS.COLOR_FEMALE_OLD;
        }
      }

      // 绘制圆点
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.closePath();
    });
  }, [people, dimensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 查找鼠标下的人口
    let found: Person | undefined;

    for (let i = 0; i < people.length; i++) {
      const px = (i % 50) * 15 + 20;
      const py = Math.floor(i / 50) * 15 + 20;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

      if (distance <= 8) {
        found = people[i];
        break;
      }
    }

    if (found) {
      onPersonHover(found);
    } else {
      onPersonHover(null);
    }
  };

  const handleClick = () => {
    if (hoveredPerson) {
      onPersonSelect(hoveredPerson.id);
    } else {
      onPersonSelect(null);
    }
  };

  const handleMouseLeave = () => {
    onPersonHover(null);
  };

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />

      {/* 信息浮窗 */}
      {hoveredPerson && (
        <div className="person-tooltip">
          <div className="tooltip-row">
            <span className="label">性别:</span>
            <span className="value">{hoveredPerson.gender === 'male' ? '男' : '女'}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">年龄:</span>
            <span className="value">{Math.floor(hoveredPerson.age)}岁</span>
          </div>
          <div className="tooltip-row">
            <span className="label">健康:</span>
            <span className="value">{Math.floor(hoveredPerson.health)}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">教育:</span>
            <span className="value">{hoveredPerson.education}</span>
          </div>
          <div className="tooltip-row">
            <span className="label">职业:</span>
            <span className="value">{hoveredPerson.occupation}</span>
          </div>
        </div>
      )}

      {/* 统计信息 */}
      <div className="canvas-stats">
        <div className="stat-item">总人口: {livingCount + deadCount}</div>
        <div className="stat-item">存活: {livingCount}</div>
        <div className="stat-item">死亡: {deadCount}</div>
      </div>
    </div>
  );
};
