import React from 'react';
import { CheckCircle2, Circle, GraduationCap } from 'lucide-react';
import { Lesson } from '../types';
import { motion } from 'motion/react';

interface LessonSidebarProps {
  lessons: Lesson[];
  activeLessonId: string;
  completedLessons: string[];
  onSelectLesson: (id: string) => void;
}

export default function LessonSidebar({
  lessons,
  activeLessonId,
  completedLessons,
  onSelectLesson
}: LessonSidebarProps) {
  return (
    <aside className="w-80 flex flex-col border-r border-slate-200 bg-white h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
      <div className="p-8 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
            物流
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 tracking-tight">SQL 实战营</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              国际物流与财务对账
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>学习进度</span>
            <span className="text-indigo-600">{Math.round((completedLessons.length / lessons.length) * 100)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-700 ease-out"
              style={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
        <div className="text-[11px] font-bold text-slate-400 uppercase mb-3 ml-3 tracking-widest">实战模块</div>
        {lessons.map((lesson, index) => {
          const isActive = lesson.id === activeLessonId;
          const isCompleted = completedLessons.includes(lesson.id);

          return (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left relative group border-2 ${
                isActive
                  ? 'bg-slate-50 border-indigo-500/50 shadow-sm'
                  : 'hover:bg-slate-50/80 border-transparent'
              }`}
            >
              <div className={`flex-shrink-0 transition-colors ${isCompleted ? 'text-indigo-500' : 'text-slate-200'}`}>
                {isCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium italic ${isActive ? 'text-slate-900' : 'text-slate-600'} group-hover:text-slate-900 transition-colors truncate`}>
                  {lesson.title}
                </h3>
              </div>
              {isActive && !isCompleted && (
                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6 border-t border-slate-100">
        <button className="w-full py-3 bg-slate-900 text-white text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-all active:scale-[0.98] tracking-widest uppercase shadow-lg shadow-slate-200">
          获取技术支持
        </button>
      </div>
    </aside>
  );
}
