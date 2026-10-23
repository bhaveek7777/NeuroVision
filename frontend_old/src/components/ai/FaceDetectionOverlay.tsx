import React, { useState } from 'react';
import { DetectedFace } from '../../types';

interface FaceDetectionOverlayProps {
  imageUrl: string;
  detectedFaces: DetectedFace[];
  onSelectFace?: (face: DetectedFace) => void;
  selectedFaceId?: string | null;
}

export const FaceDetectionOverlay: React.FC<FaceDetectionOverlayProps> = ({
  imageUrl,
  detectedFaces,
  onSelectFace,
  selectedFaceId,
}) => {
  const [hoveredFaceId, setHoveredFaceId] = useState<string | null>(null);

  const getBoxStyle = (face: DetectedFace) => {
    if (face.verification_status === 'Manually Modified') {
      return { border: 'border-blue-500', label: 'bg-blue-600', dot: 'bg-blue-500' };
    }
    if (face.verification_status === 'Teacher Verified') {
      return { border: 'border-teal-500', label: 'bg-teal-600', dot: 'bg-teal-500' };
    }
    if (face.confidence >= 90) {
      return { border: 'border-emerald-500', label: 'bg-emerald-600', dot: 'bg-emerald-500' };
    }
    if (face.confidence >= 75) {
      return { border: 'border-blue-400', label: 'bg-blue-500', dot: 'bg-blue-400' };
    }
    return { border: 'border-amber-500', label: 'bg-amber-500', dot: 'bg-amber-500' };
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 select-none">
      <div className="relative w-full">
        {/* Classroom image */}
        <img
          src={imageUrl}
          alt="Classroom"
          className="w-full h-auto max-h-[460px] object-cover block"
        />

        {/* Bounding boxes */}
        {detectedFaces.map((face) => {
          const [x, y, w, h] = face.bbox;
          const style       = getBoxStyle(face);
          const isSelected  = selectedFaceId === face.id;
          const isHovered   = hoveredFaceId === face.id;

          return (
            <div
              key={face.id}
              onClick={() => onSelectFace?.(face)}
              onMouseEnter={() => setHoveredFaceId(face.id)}
              onMouseLeave={() => setHoveredFaceId(null)}
              style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, height: `${h}%` }}
              className={`absolute border-2 rounded cursor-pointer transition-all duration-150 ${style.border} ${
                isSelected
                  ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 z-30'
                  : 'z-20'
              } hover:brightness-110`}
            >
              {/* Name label above box */}
              <div
                className={`absolute -top-6 left-0 whitespace-nowrap px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${style.label} pointer-events-none`}
              >
                {face.student_name} · {face.confidence}%
              </div>

              {/* Hover detail card */}
              {(isHovered || isSelected) && (
                <div className="absolute top-full left-0 mt-1.5 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2.5 z-50 pointer-events-none">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {face.student_name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Roll: {face.roll_no}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Confidence</span>
                    <span className={`font-semibold font-mono ${
                      face.confidence >= 90
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : face.confidence >= 75
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}>{face.confidence}%</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Status</span>
                    <span className={`font-semibold ${
                      face.status === 'Present'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>{face.status}</span>
                  </div>
                  {face.modification_reason && (
                    <p className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-blue-600 dark:text-blue-400">
                      {face.modification_reason}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary bar */}
      <div className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900">
        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          {detectedFaces.length} student{detectedFaces.length !== 1 ? 's' : ''} detected
        </span>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            High confidence
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            Needs review
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
            Modified
          </span>
        </div>
      </div>
    </div>
  );
};
