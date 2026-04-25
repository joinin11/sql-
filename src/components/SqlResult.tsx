import React from 'react';

interface SqlResultProps {
  data: any[];
  error?: string | null;
}

export default function SqlResult({ data, error }: SqlResultProps) {
  if (error) {
    return (
      <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 font-mono text-xs leading-relaxed shadow-sm">
        <span className="font-bold uppercase tracking-wider block mb-1">执行错误:</span>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-12 text-center text-slate-300 italic border-2 border-dashed border-slate-100 rounded-xl font-serif">
        查询成功执行，但未返回结果。
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden h-full">
      <div className="px-6 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">输出控制台: results_preview</h3>
        <span className="text-[10px] text-slate-400 font-medium">返回 {data.length} 行数据</span>
      </div>
      <div className="overflow-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 sticky top-0 z-10">
            <tr className="border-b border-slate-100">
              {columns.map((col) => (
                <th key={col} className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm text-slate-600 divide-y divide-slate-50">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                {columns.map((col) => {
                  const val = row[col];
                  const isString = typeof val === 'string';
                  const isNumeric = typeof val === 'number';
                  
                  return (
                    <td key={col} className={`px-6 py-3 ${isNumeric ? 'text-indigo-600 font-medium' : ''} ${isString ? 'italic text-slate-700' : ''}`}>
                      {isNumeric ? val.toLocaleString() : val}
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="bg-white">
              <td colSpan={columns.length} className="px-6 py-10 text-center text-slate-200 italic text-xs font-serif">
                结果结束
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
