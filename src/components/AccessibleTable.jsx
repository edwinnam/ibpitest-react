import { useEffect, useRef } from 'react'
import './AccessibleTable.css'

const AccessibleTable = ({ 
  columns, 
  data, 
  caption,
  onRowClick,
  selectedRows = [],
  ariaLabel,
  keyField = 'id'
}) => {
  const tableRef = useRef(null)

  // 키보드 네비게이션
  useEffect(() => {
    const table = tableRef.current
    if (!table) return

    const handleKeyDown = (e) => {
      const currentRow = e.target.closest('tr')
      if (!currentRow) return

      let nextRow
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          nextRow = currentRow.nextElementSibling
          if (nextRow) {
            const focusableElement = nextRow.querySelector('button, input, a') || nextRow
            focusableElement.focus()
          }
          break
        
        case 'ArrowUp':
          e.preventDefault()
          nextRow = currentRow.previousElementSibling
          if (nextRow && !nextRow.classList.contains('table-header')) {
            const focusableElement = nextRow.querySelector('button, input, a') || nextRow
            focusableElement.focus()
          }
          break
        
        case 'Enter':
        case ' ':
          if (onRowClick && !e.target.matches('button, input, a')) {
            e.preventDefault()
            const rowData = data.find(item => item[keyField] === currentRow.dataset.rowId)
            if (rowData) onRowClick(rowData)
          }
          break
      }
    }

    table.addEventListener('keydown', handleKeyDown)
    return () => table.removeEventListener('keydown', handleKeyDown)
  }, [data, onRowClick, keyField])

  return (
    <div className="accessible-table-wrapper">
      <table 
        ref={tableRef}
        className="accessible-table"
        role="table"
        aria-label={ariaLabel || caption}
      >
        {caption && <caption>{caption}</caption>}
        
        <thead>
          <tr className="table-header" role="row">
            {columns.map((column, index) => (
              <th 
                key={column.key || index}
                scope="col"
                aria-sort={column.sortable ? column.sortDirection || 'none' : undefined}
              >
                {column.sortable ? (
                  <button
                    className="sort-button"
                    onClick={() => column.onSort?.(column.key)}
                    aria-label={`${column.title} 정렬`}
                  >
                    {column.title}
                    <span className="sort-indicator" aria-hidden="true">
                      {column.sortDirection === 'asc' && ' ▲'}
                      {column.sortDirection === 'desc' && ' ▼'}
                    </span>
                  </button>
                ) : (
                  column.title
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-message">
                데이터가 없습니다.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr 
                key={row[keyField] || rowIndex}
                role="row"
                tabIndex={onRowClick ? 0 : undefined}
                onClick={() => onRowClick?.(row)}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onRowClick(row)
                  }
                }}
                className={`
                  ${onRowClick ? 'clickable' : ''} 
                  ${selectedRows.includes(row[keyField]) ? 'selected' : ''}
                `}
                data-row-id={row[keyField]}
                aria-selected={selectedRows.includes(row[keyField]) || undefined}
              >
                {columns.map((column, colIndex) => (
                  <td 
                    key={column.key || colIndex}
                    data-label={column.title}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default AccessibleTable