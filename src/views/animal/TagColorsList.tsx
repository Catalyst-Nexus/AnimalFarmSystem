import { Search, Edit2, Trash2 } from 'lucide-react'
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
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search tag colors..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : tagColors.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No tag colors found. Add your first tag color to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tagColors.map((tagColor) => (
                <tr key={tagColor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-200"
                        style={{ backgroundColor: tagColor.color }}
                        title={tagColor.color}
                      />
                      <span className="text-sm font-mono text-gray-600">
                        {tagColor.color}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {tagColor.color_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tagColor.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(tagColor)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => onDelete(tagColor.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && tagColors.length > 0 && (
        <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
          Showing {tagColors.length} tag color{tagColors.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
