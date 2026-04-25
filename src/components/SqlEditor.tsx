import React from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';

interface SqlEditorProps {
  initialValue: string;
  onRun: (query: string) => void;
  status?: string;
  error?: string | null;
  validationStatus?: 'none' | 'success' | 'error';
}

export const SqlEditor: React.FC<SqlEditorProps> = ({ initialValue, onRun, status, error, validationStatus }) => {
  const [query, setQuery] = React.useState(initialValue);

  React.useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  return (
    <div className="flex flex-col gap-4 bg-[#0f172a] rounded-xl p-5 shadow-2xl border border-slate-700/50 relative z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase italic">SQL Workbench Pro v3.0</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] rounded-full border border-emerald-500/20 font-bold uppercase tracking-wider">HMR Performance</span>
        </div>
      </div>
      
      <div className="relative rounded-lg border border-slate-700/30 overflow-hidden h-[300px]">
        <CodeMirror
          value={query}
          height="300px"
          theme={vscodeDark}
          extensions={[sql()]}
          onChange={(value) => {
            console.log('CodeMirror Change:', value);
            setQuery(value);
          }}
          className="text-sm font-mono"
          basicSetup={{
            lineNumbers: true,
            foldGutter: false,
            dropCursor: true,
            allowMultipleSelections: false,
            indentOnInput: true,
          }}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              onRun(query);
            }
          }}
        />
      </div>

      <div className="space-y-3">
        <button
          onClick={() => {
            console.log('Run Button Clicked with query:', query);
            onRun(query);
          }}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-lg text-xs font-bold active:scale-[0.96] transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer select-none"
          style={{ position: 'relative', zIndex: 60 }}
        >
          <span className="uppercase tracking-[0.2em]">执行对账查询</span>
          <span className="text-[10px] opacity-60 font-mono">(Ctrl + Enter)</span>
        </button>

        {/* Debug Status Area (New) */}
        <div className={`rounded-lg p-2 flex items-center justify-between min-h-[28px] transition-colors ${
          validationStatus === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30' : 
          validationStatus === 'error' ? 'bg-rose-500/20 border border-rose-500/30' : 
          'bg-black/40'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              validationStatus === 'success' ? 'bg-emerald-500' :
              (error || validationStatus === 'error') ? 'bg-rose-500' : 
              'bg-indigo-400 animate-pulse'
            }`} />
            <span className={`text-[9px] font-mono uppercase tracking-tighter ${
              validationStatus === 'success' ? 'text-emerald-400' :
              (error || validationStatus === 'error') ? 'text-rose-400' : 
              'text-slate-400'
            }`}>
              {validationStatus === 'success' ? '🎉 校验通过！逻辑正确' : 
               validationStatus === 'error' ? '❌ 结果不符，请检查筛选条件或列名' :
               status || (error ? '执行异常' : '就绪 (STANDBY)')}
            </span>
          </div>
          {error && (
            <span className="text-[8px] font-mono text-rose-500/80 truncate max-w-[150px]" title={error}>
              CODE: {error.substring(0, 30)}...
            </span>
          )}
        </div>
      </div>
      
      <div className="flex justify-between items-center text-[10px] text-slate-500 px-1 border-t border-slate-800/50 pt-3">
        <span className="flex items-center gap-1.5 italic">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          引擎就绪: 无输入延迟
        </span>
        <span className="uppercase tracking-widest font-bold text-slate-600">No Latency Editor Mode</span>
      </div>
    </div>
  );
};
