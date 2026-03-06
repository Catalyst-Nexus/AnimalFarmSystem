import { Search, Edit2, Trash2 } from 'lucide-react'
import type { AnimalType } from '@/services/animalAdminService'

interface AnimalTypesListProps {
  animalTypes: AnimalType[]
  search: string
  onSearchChange: (value: string) => void
  onEdit: (animalType: AnimalType) => void
  onDelete: (id: string) => void
  isLoading: boolean
}

export default function AnimalTypesList({
  animalTypes,
  search,
  onSearchChange,
  onEdit,
  onDelete,
  isLoading,
}: AnimalTypesListProps) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search animal types..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : animalTypes.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No animal types found. Add your first animal type to get started.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Animal Name
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
              {animalTypes.map((animalType) => (
                <tr key={animalType.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {animalType.animal_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(animalType.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(animalType)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4 inline" />
                    </button>
                    <button
                      onClick={() => onDelete(animalType.id)}
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

      {!isLoading && animalTypes.length > 0 && (
        <div className="px-6 py-3 border-t bg-gray-50 text-sm text-gray-500">
          Showing {animalTypes.length} animal type{animalTypes.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
