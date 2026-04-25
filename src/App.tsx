import React, { useState, useEffect, useMemo } from 'react';
import initSqlJs from 'sql.js';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, 
  CheckCircle, 
  Info, 
  Lightbulb, 
  Search,
  ChevronRight, 
  ChevronLeft,
  AlertCircle,
  Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

import { lessons } from './data/lessons';
import { seedData } from './data/db';
import { SqlEditor } from './components/SqlEditor';
import { Lesson, Task } from './types';

function App() {
  const [db, setDb] = useState<initSqlJs.Database | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeLessonId, setActiveLessonId] = useState(lessons[0].id);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<'none' | 'success' | 'error'>('none');
  const [showHint, setShowHint] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('sql_audit_progress');
    return saved ? JSON.parse(saved) : [];
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [showLessonComplete, setShowLessonComplete] = useState(false);
  const [dbPreviewData, setDbPreviewData] = useState<any[]>([]);
  const [previewTable, setPreviewTable] = useState<string>('shipments');

  const activeLesson = useMemo(() => 
    lessons.find(l => l.id === activeLessonId) || lessons[0], 
  [activeLessonId]);

  // Helper to check if multi-table support is needed
  const isMultiTableLesson = useMemo(() => {
    // Check if the lesson sequence number is 4 or greater
    const match = activeLessonId.match(/lesson-(\d+)/);
    const lessonNum = match ? parseInt(match[1]) : 1;
    return lessonNum >= 4;
  }, [activeLessonId]);
  
  const activeTask = activeLesson.tasks[activeTaskIndex];

  const [showStructuralHint, setShowStructuralHint] = useState(false);

  const [queryStatus, setQueryStatus] = useState<string>('');

  // Handle lesson navigation
  const handleNextLesson = () => {
    const currentIndex = lessons.findIndex(l => l.id === activeLessonId);
    if (currentIndex < lessons.length - 1) {
      setActiveLessonId(lessons[currentIndex + 1].id);
      setActiveTaskIndex(0);
      setResults([]);
      setShowHint(false);
      setShowStructuralHint(false);
      setShowLessonComplete(false);
      setValidationStatus('none');
      setQueryError(null);
    }
  };

  // SQL.js Initialization
  useEffect(() => {
    let isCancelled = false;
    const init = async () => {
      setQueryStatus('正在拉取离线审计引擎 (WASM)...');
      
      // Safety timeout to prevent infinite loading if CDN is blocked
      const timeoutId = setTimeout(() => {
        if (!isReady && !isCancelled) {
          setError('审计引擎拉取超时。这可能是由于网络环境限制了对 CDN 的访问。请检查您的网络设置或尝试刷新。');
          setQueryStatus('初始化超时');
          setIsReady(true);
        }
      }, 15000);

      try {
        const SQL = await initSqlJs({
          // Primary: unpkg (stable)
          locateFile: file => `https://unpkg.com/sql.js@1.14.1/dist/${file}`
        });
        
        clearTimeout(timeoutId);
        if (isCancelled) return;

        const database = new SQL.Database();
        database.exec(seedData);
        setDb(database);
        setIsReady(true);
        setQueryStatus('引擎就绪');
        
        // Initial preview fetch
        refreshPreview(database, 'shipments');
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (isCancelled) return;
        console.error('SQL.js Error:', err);
        setError(`SQL 引擎启动失败: ${err.message || 'WASM 文件拉取异常'}`);
        setQueryStatus('启动失败');
        setIsReady(true); // Allow UI to show error block
      }
    };
    init();
    return () => { isCancelled = true; };
  }, []);

  const refreshPreview = (database: initSqlJs.Database | null, tableName: string) => {
    if (!database || !tableName) return;
    try {
      // Validate table name to prevent SQL injection or bad queries from crashing the preview
      const validTables = ['shipments', 'invoices'];
      if (!validTables.includes(tableName.toLowerCase().trim())) {
        console.warn(`Attempted to preview invalid table: ${tableName}`);
        return;
      }
      
      const res = database.exec(`SELECT * FROM ${tableName} LIMIT 20`);
      if (res.length > 0) {
        const { columns, values } = res[0];
        const formatted = values.map(row => {
          const obj: any = {};
          columns.forEach((col, i) => obj[col.toLowerCase().trim()] = row[i]);
          return obj;
        });
        setDbPreviewData(formatted);
      } else {
        setDbPreviewData([]);
      }
    } catch (e) {
      console.error("Preview refresh failed", e);
    }
  };

  // Sync preview when lesson changes or previewTable changes
  useEffect(() => {
    if (db && isReady) {
      // If we're in a single-table lesson, force 'shipments'
      // If in multi-table, respect the user's manual selection
      const targetTable = isMultiTableLesson ? previewTable : 'shipments';
      refreshPreview(db, targetTable);
    }
  }, [db, isReady, activeLessonId, previewTable, isMultiTableLesson]);

  // Sync Progress
  useEffect(() => {
    localStorage.setItem('sql_audit_progress', JSON.stringify(completedLessons));
  }, [completedLessons]);

  const runQuery = (query: string) => {
    if (!db) {
      alert("数据库引擎尚未就绪，请稍候");
      return;
    }
    
    setQueryStatus('正在解析 SQL 指令...');
    setQueryError(null);
    setValidationStatus('none');
    setResults([]); 
    
    // Use a small timeout to let the UI update "status" before blocking execution
    setTimeout(() => {
      try {
        if (!query || !query.trim()) {
          setQueryStatus('输入为空');
          setQueryError("请输入 SQL 查询语句");
          return;
        }

        // Pre-processing query: Trim and remove trailing semicolon for cleaner logs
        const cleanQuery = query.trim().replace(/;+$/, '');
        
        setQueryStatus('正在查询数据库...');
        const res = db.exec(query); 

        let formatted: any[] = [];
        
        if (res.length > 0) {
          const { columns, values } = res[0];
          if (values.length === 0) {
            setResults([{ _system_message: '查询成功，但未找到匹配记录' }]);
          } else {
            formatted = values.map(row => {
              const obj: any = {};
              columns.forEach((col, i) => obj[col.toLowerCase().trim()] = row[i]);
              return obj;
            });
            setResults(formatted);
          }
        } else {
          setResults([{ _system_message: '指令已执行（无数据返回）' }]);
        }
        
        setQueryStatus('查询完成');
        
        // Refresh preview data to stay in sync
        refreshPreview(db, activeLesson.tableToQuery);

        // Scroll workstation to results top automatically
        setTimeout(() => {
          const workstationContainer = document.getElementById('workbench-container');
          const resultsElement = document.getElementById('query-results-anchor');
          if (workstationContainer && resultsElement) {
             const topOffset = resultsElement.offsetTop - 32; // 32px padding offset
             workstationContainer.scrollTo({ top: topOffset, behavior: 'smooth' });
          }
        }, 100);

        // Verify Task
        if (!activeTask) return;
        
        // Normalize query for broader pattern matching if needed, though here we just want to ignore semicolon
        // Actually, we don't need to normalize the query string itself for the dynamic SQL execution 
        // since SQL.js handles semicolons, but we might want to log it normalized or something.
        // The user specifically asked to "allow user not to write semicolon", which SQL.js already supports.
        // If they meant for text-based pattern matching (not current), we'd need it.
        // But let's add it just to be safe if we ever compare the raw query.

        // 1. Get Reference Data (Dynamic or Static)
        let referenceData = activeTask.expectedResult || [];
        if (activeTask.expectedSql) {
          try {
            const refResult = db.exec(activeTask.expectedSql);
            if (refResult.length > 0) {
              const refCols = refResult[0].columns;
              const refRows = refResult[0].values;
              referenceData = refRows.map(row => {
                const obj: any = {};
                refCols.forEach((col, i) => {
                  obj[col] = row[i];
                });
                return obj;
              });
            }
          } catch (refErr) {
            console.error('Error running expectedSql Reference:', refErr);
          }
        }

        const checkResult = () => {
          if (formatted.length !== referenceData.length) return false;
          
          const getValArray = (data: any[]) => data.map(row => 
            Object.values(row).map(v => {
              if (v === null) return null;
              if (typeof v === 'number') {
                // Round to handle floating point variations in AVG/SUM
                return Math.round(v * 100) / 100;
              }
              if (typeof v === 'string') return v.trim();
              return v;
            })
          );

          const actualVals = getValArray(formatted);
          const expectedVals = getValArray(referenceData);
          
          const isOrderingLesson = activeLesson.title.includes('排序') || 
                                   activeLesson.title.includes('ROW_NUMBER') ||
                                   activeTask.title.includes('排行');

          if (!isOrderingLesson) {
            actualVals.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
            expectedVals.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
          }
          
          const valuesMatch = JSON.stringify(actualVals) === JSON.stringify(expectedVals);
          
          // If task explicitly requires aliases (strict keys)
          if (activeTask.requireStrictKeys) {
            const actualKeys = Object.keys(formatted[0] || {}).map(k => k.toLowerCase().trim());
            const expectedKeys = Object.keys(referenceData[0] || {}).map(k => k.toLowerCase().trim());
            const keysMatch = JSON.stringify(actualKeys) === JSON.stringify(expectedKeys);
            return valuesMatch && keysMatch;
          }
          
          return valuesMatch;
        };

        const isCorrect = formatted.length > 0 && checkResult();
        
        if (isCorrect) {
          setQueryStatus('🎉 校验通过！逻辑正确');
          setValidationStatus('success');
          
          if (activeTaskIndex < activeLesson.tasks.length - 1) {
            confetti({ particleCount: 50, spread: 30, origin: { y: 0.8 } });
          } else {
             // All tasks in this lesson done
            if (!completedLessons.includes(activeLesson.id)) {
              setCompletedLessons(prev => [...prev, activeLesson.id]);
            }
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
            });
            setShowLessonComplete(true);
          }
        } else if (formatted.length > 0) {
          setValidationStatus('error');
          setQueryStatus('❌ 结果不符，请检查筛选条件或列名');
          
          console.group('🔍 Audit Comparison FAILURE');
          console.log('Actual Data (Cleaned):', formatted.slice(0, 3));
          console.log('Expected Data (Cleaned):', activeTask.expectedResult.slice(0, 3));
          console.log('Wait, why it failed? Row count user:', formatted.length, ' expected:', activeTask.expectedResult.length);
          console.groupEnd();
        }
      } catch (err: any) {
        console.error('Query Error:', err);
        setQueryError(err.message || '未知 SQL 错误');
        setQueryStatus('执行异常');
        setResults([]);
      }
    }, 10);
  };

  const nextLesson = () => {
    handleNextLesson();
  };

  if (!isReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 flex-col gap-6">
        {error ? (
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-rose-100 text-center max-w-md">
            <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-800 mb-2">审计系统核心挂起</h2>
            <p className="text-sm text-slate-500 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-indigo-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-indigo-500 transition-all"
            >
              尝试重新连接
            </button>
          </div>
        ) : (
          <>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
            />
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">正在从 CDN 加载 SQL WASM 引擎 v1.14...</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
      <aside className="w-80 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-8 border-b border-slate-800/50">
          <h2 className="text-white font-serif italic text-2xl flex items-center gap-3">
            <Database className="text-indigo-400" size={24} />
            SQL 报表审计
          </h2>
          <p className="text-slate-500 text-[9px] mt-2 font-bold uppercase tracking-[0.2em]">Logistics Intelligence v3.0</p>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-3">
          {lessons.map((lesson, lIdx) => (
            <button
              key={`${lesson.id}-${lIdx}`}
              onClick={() => {
                setActiveLessonId(lesson.id);
                setActiveTaskIndex(0);
                setResults([]);
                setShowHint(false);
                setShowStructuralHint(false);
              }}
              className={`w-full text-left p-4 rounded-xl transition-all group flex items-start justify-between border ${
                activeLessonId === lesson.id 
                  ? 'bg-indigo-600 border-indigo-500 shadow-lg shadow-indigo-900/40' 
                  : 'bg-transparent border-transparent hover:bg-white/5'
              }`}
            >
              <div className="flex-1 mr-2">
                <div className="flex items-center gap-2 mb-1">
                   <h4 className={`text-[11px] font-bold uppercase tracking-wider ${activeLessonId === lesson.id ? 'text-white' : 'text-slate-300'}`}>
                    {lesson.title}
                  </h4>
                  {completedLessons.includes(lesson.id) && (
                    <CheckCircle size={12} className="text-emerald-400 shrink-0" />
                  )}
                </div>
                <p className={`text-[10px] line-clamp-1 leading-relaxed ${activeLessonId === lesson.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                  {lesson.description}
                </p>
              </div>
              <ChevronRight size={14} className={`mt-0.5 transition-transform ${activeLessonId === lesson.id ? 'rotate-90 text-white' : 'text-slate-600 group-hover:translate-x-1'}`} />
            </button>
          ))}
        </div>
        <div className="p-6 bg-slate-900/50 border-t border-slate-800">
           <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] text-slate-500 font-bold uppercase">学习进度</span>
              <span className="text-[10px] text-indigo-400 font-bold">{Math.round((completedLessons.length / lessons.length) * 100)}%</span>
           </div>
           <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-indigo-500" 
                initial={{ width: 0 }}
                animate={{ width: `${(completedLessons.length / lessons.length) * 100}%` }}
              />
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <Database size={20} />
            </div>
            <div>
               <h1 className="text-slate-900 font-serif font-bold italic text-xl">
                {activeLesson.title}
              </h1>
              <div className="flex items-center gap-3 mt-0.5">
                 <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">任务进度: {activeTaskIndex + 1}/{activeLesson.tasks.length}</span>
                 <div className="flex items-center gap-1.5 ml-2">
                  {activeLesson.tasks.map((_, i) => (
                    <button 
                      key={`task-nav-${i}`} 
                      onClick={() => {
                        setActiveTaskIndex(i);
                        setResults([]);
                        setValidationStatus('none');
                        setQueryError(null);
                        setQueryStatus('Standby');
                      }}
                      title={`跳转到任务 ${i + 1}`}
                      className={`h-1.5 rounded-full transition-all hover:scale-y-150 ${
                        i === activeTaskIndex ? 'w-8 bg-indigo-600' : i < activeTaskIndex ? 'w-3 bg-emerald-400' : 'w-3 bg-slate-200'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {completedLessons.includes(activeLesson.id) && (
              <button 
                onClick={nextLesson}
                className="flex items-center gap-2 text-[10px] font-bold text-white bg-slate-900 px-6 py-2.5 rounded-full hover:bg-slate-800 transition-all uppercase tracking-widest shadow-xl shadow-slate-200"
              >
                解锁下一板块 <ChevronRight size={14} />
              </button>
            )}
            <div className="w-px h-6 bg-slate-200 mx-2" />
            <div className="flex items-center gap-2 text-[10px] bg-slate-50 px-3 py-1.5 rounded-lg border text-slate-400 font-bold uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SQL Engine: Active
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden bg-slate-50/30">
          {/* Left Column: Lesson Content (Independent Scroll) */}
          <div className="flex-[3] h-full overflow-y-auto custom-scrollbar p-8 pr-4 space-y-8">
            <motion.div 
              key={activeLessonId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-12 rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] markdown-body relative overflow-hidden"
            >
              {/* Image Banner */}
              <div className="absolute top-0 right-0 w-64 h-64 -mr-20 -mt-20 bg-indigo-50/50 rounded-full blur-3xl -z-10" />

              <div className="prose prose-slate max-w-none prose-headings:font-serif prose-headings:italic">
                <ReactMarkdown rehypePlugins={[rehypeRaw]}>
                  {activeLesson.content}
                </ReactMarkdown>
              </div>

              {/* Task Section */}
              <div className="mt-12 pt-10 border-t border-slate-100">
                <div className="bg-[#f8fafc] border border-slate-200 p-10 rounded-3xl shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col">
                       <div className="flex items-center gap-2 text-indigo-600 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">
                        <Info size={14} /> 审计任务路径 ({activeTaskIndex + 1}/{activeLesson.tasks.length})
                      </div>
                      <h3 className="text-2xl font-serif italic font-bold text-slate-800">
                        {activeTask.title}
                      </h3>
                    </div>
                    
                    <div className="flex gap-2">
                       <button 
                        onClick={() => setShowStructuralHint(!showStructuralHint)}
                        className={`text-[9px] font-bold px-4 py-2 rounded-full border transition-all uppercase tracking-widest flex items-center gap-1.5 ${
                          showStructuralHint ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-100 hover:border-indigo-300'
                        }`}
                      > 
                        <Database size={10} /> 参考写法
                      </button>
                      <button 
                        onClick={() => setShowHint(!showHint)}
                        className={`text-[9px] font-bold px-4 py-2 rounded-full border transition-all uppercase tracking-widest ${
                          showHint ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                        }`}
                      > 
                        语法提示
                      </button>
                    </div>
                  </div>
                  
                  {/* Pitfall Guide (新: 移动到任务级别) */}
                  {activeTask.pitfallGuide && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-8 bg-rose-50 border border-rose-100 p-6 rounded-2xl flex gap-4 items-start shadow-sm"
                    >
                      <div className="p-2 bg-white rounded-xl shadow-sm text-rose-500 shrink-0 border border-rose-100">
                          <AlertCircle size={20} />
                      </div>
                      <div>
                          <h4 className="text-[10px] font-bold text-rose-700 uppercase tracking-widest mb-1">审计避坑指南 (Pitfall Guide)</h4>
                          <p className="text-sm text-rose-600/90 leading-relaxed font-semibold">
                            {activeTask.pitfallGuide}
                          </p>
                      </div>
                    </motion.div>
                  )}
                  
                  <div className="text-slate-800 font-serif italic text-xl mb-8 leading-relaxed bg-white p-6 rounded-2xl border border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    <ReactMarkdown>
                      {activeTask.instructions}
                    </ReactMarkdown>
                  </div>

                  <AnimatePresence>
                    {validationStatus === 'success' && activeTaskIndex < activeLesson.tasks.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 p-6 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="text-emerald-500" size={20} />
                          <span className="text-sm font-bold text-emerald-800 tracking-tight">校验通过！本步骤审计逻辑正确。</span>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTaskIndex(prev => prev + 1);
                            setResults([]);
                            setValidationStatus('none');
                            setShowHint(false);
                            setShowStructuralHint(false);
                            setQueryStatus('就绪 (STANDBY)');
                          }}
                          className="px-6 py-2 bg-emerald-600 text-white rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 transition-all flex items-center gap-2"
                        >
                          进行下一题 <ChevronRight size={14} />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <AnimatePresence mode="wait">
                    {showStructuralHint && activeTask.structuralHint && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-slate-900 border border-slate-800 p-5 rounded-xl mb-6 overflow-hidden shadow-2xl"
                      >
                        <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold text-[9px] tracking-[0.2em] uppercase">
                          <Database size={12}/> 标准语法结构示意 (不含具体字段)
                        </div>
                        <code className="text-xs font-mono block whitespace-pre-wrap text-slate-300 bg-white/5 p-3 rounded border border-white/5">
                          {activeTask.structuralHint}
                        </code>
                      </motion.div>
                    )}
                    
                    {showHint && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-amber-50 border border-amber-200 p-5 rounded-xl mb-6 overflow-hidden"
                      >
                        <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold text-[9px] tracking-[0.2em] uppercase">
                          <Lightbulb size={12}/> 核心语法参考
                        </div>
                        <code className="text-xs font-mono block whitespace-pre-wrap text-amber-900 bg-white/50 p-3 rounded">
                          {activeTask.hint}
                        </code>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Context Helper */}
                  <div className="mt-8 pt-8 border-t border-slate-200/50">
                    <div className="flex items-center justify-between mb-4">
                       <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Database size={10} /> 
                          {isMultiTableLesson ? '待审计库表动态预览:' : '待审计运单库 (SHIPMENTS):'}
                        </div>
                        
                        {isMultiTableLesson && (
                          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                            {['shipments', 'invoices'].map(tab => (
                              <button
                                key={tab}
                                onClick={() => setPreviewTable(tab)}
                                className={`px-3 py-1 rounded-md text-[9px] font-bold transition-all uppercase ${
                                  previewTable === tab 
                                    ? 'bg-white text-indigo-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                {tab}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 font-mono italic">
                        Live Data Link: {isMultiTableLesson ? previewTable.toUpperCase() : 'SHIPMENTS'}
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm max-h-[300px] custom-scrollbar">
                      <table className="w-full text-[10px] text-left border-collapse">
                        <thead className="bg-slate-50/50 border-b sticky top-0 z-10">
                          <tr>
                            {dbPreviewData.length > 0 ? (
                              Object.keys(dbPreviewData[0]).map((key, kIdx) => (
                                <th key={`preview-head-${key}-${kIdx}`} className="px-3 py-2.5 text-slate-400 uppercase font-bold tracking-tight bg-slate-50/90 backdrop-blur-sm whitespace-nowrap">
                                  {key}
                                </th>
                              ))
                            ) : (
                              <th className="px-3 py-2.5 text-slate-400 uppercase font-bold tracking-tight">Status</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y text-slate-600 font-medium whitespace-nowrap">
                          {dbPreviewData.length > 0 ? (
                            dbPreviewData.map((row, i) => (
                              <tr key={`preview-row-${i}`} className="hover:bg-slate-50 transition-colors">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={`preview-cell-${i}-${j}`} className="px-3 py-2 font-mono">
                                    {val === null ? <span className="text-rose-400 italic">NULL</span> : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={10} className="px-3 py-16 text-center">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-indigo-500 animate-spin mb-2" />
                                  <p className="text-slate-400 italic">
                                    {isReady ? (previewTable === 'invoices' && activeLessonId.startsWith('lesson-1') ? '当前章节无需账单表，请切换至 Shipments' : '正在拉取实时快照...') : '引擎初始化中...'}
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Audit Knowledge Points (New Module) - Only visible in Lesson 2 */}
                  {activeLessonId === 'l2-like-in' && (
                    <div className="mt-8 pt-8 border-t border-slate-200">
                      <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
                              <Lightbulb className="text-indigo-300" size={18} />
                          </div>
                          <h4 className="text-base font-serif italic font-bold tracking-tight">审计知识点：SQL 语法精讲</h4>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                <Info size={12} /> WHERE 数据过滤逻辑
                              </h5>
                              <p className="text-xs text-indigo-100/80 leading-relaxed">
                                类似于 Excel 的“筛选按钮”，<span className="text-white font-bold">WHERE</span> 子句负责告诉引擎：我只要满足这些条件的行。
                              </p>
                              <div className="p-4 bg-black/30 rounded-xl border border-white/5 font-mono text-[10px]">
                                <span className="text-indigo-400">SELECT</span> * <br/>
                                <span className="text-indigo-400">FROM</span> shipments <br/>
                                <span className="text-indigo-400 font-bold">WHERE</span> client_name = 'Amazon';
                              </div>
                              <p className="text-[9px] text-indigo-300 italic">
                                * 注意：WHERE 必须写在 FROM 之后，且文本必须使用单引号包围。
                              </p>
                          </div>
                          
                          <div className="space-y-4">
                              <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-2">
                                <Search size={12} /> LIKE 模糊对账
                              </h5>
                              <div className="space-y-3">
                                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                                  <p className="text-[11px] text-white flex items-center gap-2 mb-1">
                                    <span className="text-indigo-400 font-bold">%</span> 任意长度占位
                                  </p>
                                  <p className="text-[9px] text-indigo-200/70 leading-tight">
                                    '%Appl%'：匹配包含 Appl 的任何文本。最灵活。
                                  </p>
                                </div>
                                <div className="p-3 bg-black/30 rounded-xl border border-white/5">
                                  <p className="text-[11px] text-white flex items-center gap-2 mb-1">
                                    <span className="text-indigo-400 font-bold">_</span> 精准单字符占位
                                  </p>
                                  <p className="text-[9px] text-indigo-200/70 leading-tight">
                                    'S_O'：匹配 SFO, SHO, SLO 等。固定长度审计（如机场代码、分类码）神器。
                                  </p>
                                </div>
                              </div>
                              <p className="text-[9px] text-indigo-300 italic mt-2">
                                * 提示：_ 与 % 可组合使用，但 _ 必须且仅能占 1 位。
                              </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Workbench (Independent Scroll) */}
          <div id="workbench-container" className="flex-[2] h-full overflow-y-auto custom-scrollbar p-8 pl-4 space-y-6">
            <div className="shrink-0">
               <SqlEditor 
                initialValue={activeTask.initialQuery || ''} 
                onRun={runQuery} 
                status={queryStatus}
                error={queryError}
                validationStatus={validationStatus}
              />
            </div>
            
            <div id="query-results-anchor" className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col max-h-[500px]">
              <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-6 justify-between shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">审计查询结果 (QUERY_RESULTS)</span>
                {results.length > 0 && !results[0]._system_message && (
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-mono text-slate-400">RECORDS: {results.length}</span>
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-auto custom-scrollbar bg-white">
                <AnimatePresence mode="wait">
                  {queryError ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="p-8 text-rose-600 font-mono text-xs bg-rose-50/20 h-full"
                    >
                      <div className="flex items-center gap-2 mb-4 font-bold uppercase tracking-tight text-rose-700">
                        <AlertCircle size={14} /> SQL 系统异常
                      </div>
                      <div className="p-4 bg-white rounded-xl border border-rose-100 shadow-sm text-slate-700">
                        {queryError}
                      </div>
                    </motion.div>
                  ) : results.length > 0 ? (
                    <motion.div 
                      key="results"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="h-full"
                    >
                      {results[0]._system_message ? (
                        <div className="flex-1 flex items-center justify-center text-slate-500 font-mono text-xs italic bg-slate-50/50 p-10 text-center h-[300px]">
                          <div className="flex flex-col items-center gap-4 text-slate-400">
                            <Info size={24} className="opacity-20" />
                            <p>{results[0]._system_message}</p>
                          </div>
                        </div>
                      ) : (
                        <table className="w-full text-left text-[11px] border-collapse relative">
                          <thead className="sticky top-0 z-10 shadow-sm bg-indigo-600">
                            <tr className="border-b border-white/10">
                              {Object.keys(results[0]).map((col, cIdx) => (
                                <th key={`results-head-${col}-${cIdx}`} className="px-5 py-3 font-bold text-white uppercase tracking-tighter border-r border-white/5 last:border-0 whitespace-nowrap bg-indigo-600">
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {results.map((row, i) => (
                              <tr key={`results-row-${i}`} className="hover:bg-indigo-50/30 transition-colors group">
                                {Object.values(row).map((val: any, j) => (
                                  <td key={`results-cell-${i}-${j}`} className="px-5 py-3 font-medium text-slate-600 font-mono tracking-tighter border-r border-slate-50 last:border-0">
                                    {val === null ? <span className="text-rose-400 italic">NULL</span> : String(val)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-300 text-[10px] italic flex-col gap-4">
                      <div className="p-4 bg-slate-50 rounded-full">
                         <Database size={32} className="opacity-10" />
                      </div>
                      <p className="uppercase tracking-[0.3em] font-bold opacity-30">等待审计指令介入...</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ y: -100, x: '-50%', opacity: 0 }}
            animate={{ y: 0, x: '-50%', opacity: 1 }}
            exit={{ y: -100, x: '-50%', opacity: 0 }}
            className="fixed top-12 left-1/2 z-[100] bg-slate-900 border border-slate-700 text-white px-10 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-5"
          >
            <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
              <CheckCircle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-base text-emerald-400">板块对账成功!</h4>
              <p className="text-[11px] text-slate-400 italic mt-0.5">该业务模块数据已完全解析并存入审计包。</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Lesson Complete Modal */}
      <AnimatePresence>
        {showLessonComplete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowLessonComplete(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.25)] overflow-hidden"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-indigo-200 mb-8 rotate-3">
                   <CheckCircle className="text-white" size={40} />
                </div>
                <h3 className="text-3xl font-serif italic text-slate-900 mb-4">全关卡审计达成</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-10 px-8">
                  恭喜！您已成功完成 <span className="font-bold text-slate-900">{activeLesson.title}</span> 的所有审计任务。
                  业务逻辑核验无误，数据包已封存。
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleNextLesson}
                    className="w-full py-4 bg-[#0f172a] hover:bg-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2"
                  >
                    进入下一章节 <ChevronRight size={16} />
                  </button>
                  <button 
                    onClick={() => setShowLessonComplete(false)}
                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    留在本页复习
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
