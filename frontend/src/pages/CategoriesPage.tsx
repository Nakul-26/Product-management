import { FormEvent, useEffect, useState } from 'react';
import api from '../api/api';
import { Category } from '../types';

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  parent: string;
  status: 'active' | 'inactive';
};

const defaultForm: CategoryFormState = {
  name: '',
  slug: '',
  description: '',
  parent: '',
  status: 'active'
};

function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryFormState>(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get<Category[]>('/categories');
      setCategories(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: prev.slug === generateSlug(prev.name) ? generateSlug(name) : prev.slug
    }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const payload = {
      ...form,
      parent: form.parent || null
    };

    try {
      if (editingId) {
        await api.put(`/categories/${editingId}`, payload);
        setNotice('Category updated successfully.');
      } else {
        await api.post('/categories', payload);
        setNotice('Category created successfully.');
      }
      resetForm();
      await fetchCategories();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || 'Failed to save category.');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category._id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent: typeof category.parent === 'string' ? category.parent : category.parent?._id || '',
      status: category.status
    });
  };

  return (
    <main className="app">
      <section className="panel">
        <div className="panel-header">
          <div>
            <h1>Categories</h1>
            <p className="muted">Manage product categories.</p>
          </div>
          <button type="button" className="btn btn-light" onClick={fetchCategories} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && <p className="error-text">{error}</p>}
        {notice && <p className="success-text">{notice}</p>}

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Name *
            <input value={form.name} onChange={(e) => handleNameChange(e.target.value)} required />
          </label>
          <label>
            Slug *
            <input value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} required />
          </label>
          <label>
            Parent Category
            <select value={form.parent} onChange={(e) => setForm((prev) => ({ ...prev, parent: e.target.value }))}>
              <option value="">None</option>
              {categories
                .filter((c) => c._id !== editingId)
                .map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Status
            <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </label>
          <label className="full-width">
            Description
            <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
          </label>

          <div className="full-width form-actions">
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {editingId ? 'Update Category' : 'Add Category'}
            </button>
            <button type="button" className="btn btn-light" onClick={resetForm}>
              Clear
            </button>
          </div>
        </form>

        <h2>Category List</h2>
        <div className="table-container mobile-stack-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Parent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="muted">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id}>
                    <td data-label="Name">
                      <strong>{category.name}</strong>
                      {category.description && <div className="muted">{category.description}</div>}
                    </td>
                    <td data-label="Slug">{category.slug}</td>
                    <td data-label="Parent">{typeof category.parent === 'object' ? category.parent?.name : '-'}</td>
                    <td data-label="Status">{category.status}</td>
                    <td data-label="Actions">
                      <button type="button" className="btn btn-light" onClick={() => handleEdit(category)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default CategoriesPage;
