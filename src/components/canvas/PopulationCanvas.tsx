import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useUIStore } from '../../store/uiStore';
import { CANVAS_CONSTANTS } from '../../constants/game';
import './PopulationCanvas.css';

export const PopulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { people, populationCount } = useGameStore();
  const { hoveredPerson, selectPerson, hoverPerson } = useUIStore();
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

    // 绘制活着的人口
    const livingPeople = Array.from(people.values()).filter(p => p.isAlive);

    livingPeople.forEach((person, index) => {
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

    // 绘制死亡人口（灰色，较小）
    const deadPeople = Array.from(people.values()).filter(p => !p.isAlive);
    const deadIndexStart = livingPeople.length;

    deadPeople.forEach((person, index) => {
      const x = ((deadIndexStart + index) % 50) * 15 + 20;
      const y = Math.floor((deadIndexStart + index) / 50) * 15 + 20;

      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = CANVAS_CONSTANTS.COLOR_DEAD;
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
    const livingPeople = Array.from(people.values()).filter(p => p.isAlive);
    let found: typeof livingPeople[0] | undefined;

    for (let i = 0; i < livingPeople.length; i++) {
      const px = (i % 50) * 15 + 20;
      const py = Math.floor(i / 50) * 15 + 20;
      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2);

      if (distance <= 8) {
        found = livingPeople[i];
        break;
      }
    }

    if (found) {
      hoverPerson(found);
    } else {
      hoverPerson(null);
    }
  };

  const handleClick = () => {
    if (hoveredPerson) {
      selectPerson(hoveredPerson.id);
    } else {
      selectPerson(null);
    }
  };

  const handleMouseLeave = () => {
    hoverPerson(null);
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
        <div className="stat-item">总人口: {populationCount}</div>
        <div className="stat-item">
          存活: {Array.from(people.values()).filter(p => p.isAlive).length}
        </div>
        <div className="stat-item">
          死亡: {Array.from(people.values()).filter(p => !p.isAlive).length}
        </div>
      </div>
    </div>
  );
};
