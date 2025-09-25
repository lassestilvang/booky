import React, { useState } from "react";
import { useForm } from "react-hook-form";
import apiClient from "../api/client";
import { useBookmarksStore } from "../stores/bookmarks";

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddBookmarkFormData {
  title: string;
  url: string;
  description?: string;
  tags?: string;
}

const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addBookmark } = useBookmarksStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddBookmarkFormData>();

  const onSubmit = async (data: AddBookmarkFormData) => {
    setLoading(true);
    setError(null);

    try {
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      const response = await apiClient.post("/bookmarks", {
        url: data.url,
        notes: data.description,
        tags: tagsArray,
      });

      // Create bookmark object for store
      const newBookmark = {
        id: response.data.id,
        title: data.title,
        url: data.url,
        description: data.description,
        tags: tagsArray,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addBookmark(newBookmark);
      reset();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to add bookmark");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Add New Bookmark
                </h3>

                {error && (
                  <div className="mb-4 text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label
                      htmlFor="title"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Title *
                    </label>
                    <input
                      {...register("title", {
                        required: "Title is required",
                      })}
                      type="text"
                      id="title"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter bookmark title"
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="url"
                      className="block text-sm font-medium text-gray-700"
                    >
                      URL *
                    </label>
                    <input
                      {...register("url", {
                        required: "URL is required",
                        pattern: {
                          value: /^https?:\/\/.+/,
                          message:
                            "Please enter a valid URL starting with http:// or https://",
                        },
                      })}
                      type="url"
                      id="url"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="https://example.com"
                    />
                    {errors.url && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.url.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      id="description"
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Optional description"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tags"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Tags
                    </label>
                    <input
                      {...register("tags")}
                      type="text"
                      id="tags"
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="tag1, tag2, tag3"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Comma-separated tags (optional)
                    </p>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="submit"
              onClick={handleSubmit(onSubmit)}
              disabled={loading}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Bookmark"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBookmarkModal;
