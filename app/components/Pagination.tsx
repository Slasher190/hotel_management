'use client'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className="flex items-center justify-between border-t border-[#CBD5E1] bg-white px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-150"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-lg border border-[#CBD5E1] bg-white px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F8FAFC] disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-150"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#64748B]">
            Showing page <span className="font-medium text-[#111827]">{currentPage}</span> of{' '}
            <span className="font-medium text-[#111827]">{totalPages}</span>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-lg" aria-label="Pagination">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-l-lg px-2 py-2 text-[#64748B] border border-[#CBD5E1] hover:bg-[#F8FAFC] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-150"
            >
              <span className="sr-only">Previous</span>
              ←
            </button>
            {getPageNumbers().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={typeof page === 'string'}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold min-h-[44px] transition-colors duration-150 ${
                  page === currentPage
                    ? 'z-10 bg-[#8E0E1C] text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E0E1C]'
                    : typeof page === 'string'
                    ? 'text-[#CBD5E1] cursor-default border border-[#CBD5E1]'
                    : 'text-[#111827] border border-[#CBD5E1] hover:bg-[#F8FAFC] focus:z-20 focus:outline-offset-0'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center rounded-r-lg px-2 py-2 text-[#64748B] border border-[#CBD5E1] hover:bg-[#F8FAFC] focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors duration-150"
            >
              <span className="sr-only">Next</span>
              →
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}
