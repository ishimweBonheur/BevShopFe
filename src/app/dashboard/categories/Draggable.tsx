import React, { useState, useEffect } from "react";
import { useCategories } from "@/hooks/api/categories";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import AddCategoryModal from "./add"; 
import { FaEdit, FaTrash } from "react-icons/fa";
import toast from "react-hot-toast";

type Category = {
  _id: string;
  name: string;
  parent: string | null;
  children: Category[];
};

const ItemType = {
  CATEGORY: "category",
};

const DraggableCategory = ({ category, moveCategory, findCategory, onEdit, onDelete }: any) => {
  const originalIndex = findCategory(category._id).index;

  const [, drag] = useDrag({
    type: ItemType.CATEGORY,
    item: { id: category._id, originalIndex },
  });

  const [, drop] = useDrop({
    accept: ItemType.CATEGORY,
    hover({ id: draggedId }: any) {
      if (draggedId !== category._id) {
        const { index: overIndex } = findCategory(category._id);
        moveCategory(draggedId, overIndex);
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className="p-2 border rounded-md mb-2 bg-gray-50 dark:bg-gray-800 flex justify-between items-center"
    >
      <span>{category.name}</span>
      <div className="flex space-x-2">
        <button onClick={() => onEdit(category)} className="btn btn-xs btn-outline-primary">
          <FaEdit />
        </button>
        <button onClick={() => onDelete(category._id)} className="btn btn-xs btn-outline-danger">
          <FaTrash />
        </button>
      </div>
    </div>
  );
};

const HierarchicalCategoryTree = () => {
  const { categories, fetchCategories, updateCategory, deleteCategory } = useCategories();
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  useEffect(() => {
    fetchCategories().then((data: any) => {
      setCategoryTree(buildTreeStructure(data));
    });
  }, [fetchCategories]);

  const buildTreeStructure = (categories: any[]): Category[] => {
    const categoryMap: { [key: string]: Category } = {};
    categories.forEach((cat) => {
      categoryMap[cat._id] = { ...cat, children: [] };
    });

    const tree: Category[] = [];
    Object.values(categoryMap).forEach((cat) => {
      if (cat.parent) {
        categoryMap[cat.parent]?.children.push(cat);
      } else {
        tree.push(cat);
      }
    });
    return tree;
  };

  const moveCategory = (draggedId: string, overIndex: number) => {
    const draggedCategory = categoryTree.find((cat) => cat._id === draggedId);
    if (draggedCategory) {
      const newTree = [...categoryTree];
      newTree.splice(newTree.indexOf(draggedCategory), 1); // Remove the dragged item
      newTree.splice(overIndex, 0, draggedCategory); // Insert it at the new location
      setCategoryTree(newTree);

      // Send updated parent-child relationship to the backend
      updateCategory(draggedId, { parent: newTree[overIndex]?.parent || null });
      toast.success("Category position updated successfully.");
    }
  };

  const findCategory = (id: string) => {
    const category:any = categoryTree.find((cat) => cat._id === id);
    return { category, index: categoryTree.indexOf(category) };
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      await deleteCategory(id);
      fetchCategories(); // Refresh categories after deletion
      toast.success("Category deleted successfully.");
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const renderCategories = (categories: Category[]) => {
    return categories.map((category) => (
      <div key={category._id}>
        <DraggableCategory
          category={category}
          moveCategory={moveCategory}
          findCategory={findCategory}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        {category.children.length > 0 && (
          <div className="ml-4">{renderCategories(category.children)}</div>
        )}
      </div>
    ));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-4 max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Manage Categories</h2>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            + Add Category
          </button>
        </div>

        {categoryTree.length > 0 ? (
          <div>{renderCategories(categoryTree)}</div>
        ) : (
          <p className="text-gray-600">No categories available</p>
        )}

        {isModalOpen && (
          <AddCategoryModal
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedCategory(null);
            }}
            handleRefetch={fetchCategories}
            selectedCategory={selectedCategory}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default HierarchicalCategoryTree;
