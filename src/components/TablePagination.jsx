import React from 'react'
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi'

const TablePagination = ({ 
  totalItems, 
  rowsPerPage, 
  setRowsPerPage, 
  currentPage, 
  setCurrentPage 
}) => {
  const totalPages = Math.ceil(totalItems / rowsPerPage)
  
  if (totalItems <= 0) return null

  return (
    <div className="bg-white px-6 py-4 border-t border-slate-50 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Rows per page:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-black text-brand-navy px-2 py-1 outline-none focus:border-primary transition-all"
          >
            {[5, 10, 20, 50].map(val => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
        </div>
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-l border-slate-100 pl-4">
          Showing {totalItems > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}-{Math.min(totalItems, currentPage * rowsPerPage)} of {totalItems}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button 
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <HiChevronLeft className="text-xl" />
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              if (totalPages <= 5) return true
              if (page === 1 || page === totalPages) return true
              return Math.abs(page - currentPage) <= 1
            })
            .map((page, idx, arr) => (
              <React.Fragment key={page}>
                {idx > 0 && arr[idx - 1] !== page - 1 && (
                  <span className="text-slate-300 px-1">...</span>
                )}
                <button
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-[11px] font-black transition-all ${
                    currentPage === page 
                    ? 'bg-primary text-white shadow-lg shadow-orange-100' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-brand-navy'
                  }`}
                >
                  {page}
                </button>
              </React.Fragment>
            ))
          }
        </div>

        <button 
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-all disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <HiChevronRight className="text-xl" />
        </button>
      </div>
    </div>
  )
}

export default TablePagination
