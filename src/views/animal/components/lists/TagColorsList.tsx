import { Search, Edit2, Trash2, Palette } from 'lucide-react'
import type { TagColor } from '@/services/animalAdminService'

interface TagColorsListProps {
  tagColors: TagColor[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (tagColor: TagColor) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export default function TagColorsList({
  tagColors,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  isLoading,
}: TagColorsListProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tag colors..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-green-500"></div>
          <p className="mt-3 text-gray-500">Loading tag colors...</p>
        </div>
      ) : tagColors.length === 0 ? (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">No tag colors found</p>
          <p className="text-sm text-gray-500">Add your first tag color to get started.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Color Preview
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Color Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Hex Code
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {tagColors.map((tagColor) => (
                  <tr 
                    key={tagColor.id} 
                    className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-150 group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-xl shadow-md border-2 border-white ring-2 ring-gray-200 group-hover:ring-gray-300 transition-all duration-200"
                            style={{ backgroundColor: tagColor.color }}
                            title={tagColor.color}
                          />
                          <div 
                            className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: tagColor.color }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {tagColor.color_name}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                          Color
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 text-xs font-mono bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {tagColor.color}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(tagColor.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(tagColor)}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-150"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tagColor.id)}
                          className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-150"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold text-gray-900">{tagColors.length}</span> tag color{tagColors.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs text-gray-500">Live</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
