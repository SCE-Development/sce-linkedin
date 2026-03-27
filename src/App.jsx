import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api';

function App() {
  const [alumniList, setAlumniList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editAlumni, setEditAlumni] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch all alumni
  const loadAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/alumni`);
      setAlumniList(response.data);
    } catch (error) {
      showAlert(error.response?.data?.error || error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlumni();
  }, [loadAlumni]);

  // Create alumni
  const handleCreate = async (formData) => {
    try {
      await axios.post(`${API_URL}/alumni`, formData);
      showAlert('Alumni created successfully!', 'success');
      loadAlumni();
    } catch (error) {
      showAlert(error.response?.data?.error || error.message, 'error');
    }
  };

  // Update alumni
  const handleUpdate = async (id, formData) => {
    try {
      await axios.put(`${API_URL}/alumni/${id}`, formData);
      showAlert('Alumni updated successfully!', 'success');
      setModalOpen(false);
      loadAlumni();
    } catch (error) {
      showAlert(error.response?.data?.error || error.message, 'error');
    }
  };

  // Delete alumni
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this alumni?')) return;

    try {
      await axios.delete(`${API_URL}/alumni/${id}`);
      showAlert('Alumni deleted successfully!', 'success');
      loadAlumni();
    } catch (error) {
      showAlert(error.response?.data?.error || error.message, 'error');
    }
  };

  // Poll enrichment status
  const pollEnrichment = (alumniId) => {
    const maxPolls = 90; // 15 minutes at 10s intervals
    let polls = 0;

    const interval = setInterval(async () => {
      polls++;

      try {
        const response = await axios.get(`${API_URL}/alumni/${alumniId}`);
        const updated = response.data;

        // Update the specific alumni in the list
        setAlumniList(prev =>
          prev.map(a => (a._id === alumniId ? updated : a))
        );

        if (updated.enrichmentStatus !== 'pending' || polls >= maxPolls) {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Polling error:', error);
        clearInterval(interval);
      }
    }, 10000);
  };

  function showAlert(text, type = 'success') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }

  const openEditModal = (alumni) => {
    setEditAlumni(alumni);
    setModalOpen(true);
  };

  return (
    <div className="container">
      <header>
        <h1>🎓 SCE Alumni Directory</h1>
        <p>Manage alumni profiles with AI-powered enrichment</p>
      </header>

      <main>
        <section className="create-form">
          <h2>Add New Alumni</h2>
          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}
          <AlumniForm onSubmit={handleCreate} />
        </section>

        <section className="alumni-list">
          <h2>All Alumni</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <AlumniList
              alumni={alumniList}
              onEdit={openEditModal}
              onDelete={handleDelete}
            />
          )}
        </section>
      </main>

      {modalOpen && editAlumni && (
        <EditModal
          alumni={editAlumni}
          onSave={(data) => handleUpdate(editAlumni._id, data)}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

// Alumni Form Component
function AlumniForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    headline: '',
    profilePhotoUrl: '',
    linkedInUrl: '',
    startYear: '',
    graduationYear: '',
    major: '',
  });

  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichJobId, setEnrichJobId] = useState(null);
  const [enrichError, setEnrichError] = useState('');

  const handleEnrich = async () => {
    if (!formData.name.trim()) {
      setEnrichError('Please enter a name first');
      return;
    }

    setIsEnriching(true);
    setEnrichError('');
    setEnrichJobId(null);

    try {
      const response = await axios.post(`${API_URL}/alumni/enrich`, {
        name: formData.name,
        graduationYear: formData.graduationYear ? parseInt(formData.graduationYear) : null,
      });

      setEnrichJobId(response.data.jobId);
      pollEnrichment(response.data.jobId);
    } catch (error) {
      setEnrichError(error.response?.data?.error || error.message);
      setIsEnriching(false);
    }
  };

  const pollEnrichment = (jobId) => {
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`${API_URL}/alumni/enrich/${jobId}`);

        if (response.data.status === 'completed') {
          clearInterval(interval);
          setIsEnriching(false);

          if (response.data.data) {
            setFormData((prev) => ({
              ...prev,
              ...response.data.data,
            }));
          }
        } else if (response.data.status === 'failed') {
          clearInterval(interval);
          setIsEnriching(false);
          setEnrichError(response.data.error || 'Enrichment failed');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      startYear: formData.startYear ? parseInt(formData.startYear) : null,
      graduationYear: formData.graduationYear
        ? parseInt(formData.graduationYear)
        : null,
    };
    onSubmit(payload);
    setFormData({
      name: '',
      bio: '',
      headline: '',
      profilePhotoUrl: '',
      linkedInUrl: '',
      startYear: '',
      graduationYear: '',
      major: '',
    });
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const inputBlurClass = isEnriching ? 'input-blur' : '';

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name">Name *</label>
        <div className="input-with-button">
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="btn btn-enrich"
            onClick={handleEnrich}
            disabled={isEnriching || !formData.name.trim()}
          >
            {isEnriching ? '⏳ Fetching...' : '✨ Enrich'}
          </button>
        </div>
        {enrichError && <span className="error-text">{enrichError}</span>}
      </div>

      {isEnriching && (
        <div className="enrich-loading">
          Fetching data... Please wait.
        </div>
      )}

      <div className="form-group">
        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          rows="3"
          value={formData.bio}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="headline">Headline</label>
        <input
          type="text"
          id="headline"
          name="headline"
          value={formData.headline}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="profilePhotoUrl">Profile Photo URL</label>
        <input
          type="url"
          id="profilePhotoUrl"
          name="profilePhotoUrl"
          value={formData.profilePhotoUrl}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="linkedInUrl">LinkedIn URL</label>
        <input
          type="url"
          id="linkedInUrl"
          name="linkedInUrl"
          value={formData.linkedInUrl}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="startYear">Start Year</label>
        <input
          type="number"
          id="startYear"
          name="startYear"
          value={formData.startYear}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="graduationYear">Graduation Year</label>
        <input
          type="number"
          id="graduationYear"
          name="graduationYear"
          value={formData.graduationYear}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="major">Major</label>
        <input
          type="text"
          id="major"
          name="major"
          value={formData.major}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="currentCompany">Current Company</label>
        <input
          type="text"
          id="currentCompany"
          name="currentCompany"
          value={formData.currentCompany || ''}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="currentJobTitle">Current Job Title</label>
        <input
          type="text"
          id="currentJobTitle"
          name="currentJobTitle"
          value={formData.currentJobTitle || ''}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <div className="form-group">
        <label htmlFor="location">Location</label>
        <input
          type="text"
          id="location"
          name="location"
          value={formData.location || ''}
          onChange={handleChange}
          className={inputBlurClass}
          disabled={isEnriching}
        />
      </div>

      <button type="submit" className="btn btn-primary">
        💾 Insert Alumni Record
      </button>
    </form>
  );
}

// Alumni List Component
function AlumniList({ alumni, onEdit, onDelete }) {
  if (alumni.length === 0) {
    return (
      <p style={{ textAlign: 'center', color: '#666', gridColumn: '1/-1' }}>
        No alumni yet. Add one above!
      </p>
    );
  }

  return (
    <div className="alumni-grid">
      {alumni.map((a) => (
        <AlumniCard key={a._id} alumni={a} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

// Alumni Card Component
function AlumniCard({ alumni, onEdit, onDelete }) {
  const formatValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    return value;
  };

  return (
    <div className="alumni-card">
      <h3>{formatValue(alumni.name)}</h3>
      <div className="info">
        <div className="info-item">
          <span className="info-label">Company</span>
          <span className="info-value">{formatValue(alumni.currentCompany)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Job Title</span>
          <span className="info-value">{formatValue(alumni.currentJobTitle)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Location</span>
          <span className="info-value">{formatValue(alumni.location)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">LinkedIn</span>
          <span className="info-value">{formatValue(alumni.linkedInUrl)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Graduation</span>
          <span className="info-value">{formatValue(alumni.graduationYear)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Major</span>
          <span className="info-value">{formatValue(alumni.major)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Start Year</span>
          <span className="info-value">{formatValue(alumni.startYear)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Bio</span>
          <span className="info-value">{formatValue(alumni.bio)}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Headline</span>
          <span className="info-value">{formatValue(alumni.headline)}</span>
        </div>
      </div>
      <div className="actions">
        <button className="btn btn-edit" onClick={() => onEdit(alumni)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(alumni._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}

// Edit Modal Component
function EditModal({ alumni, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: alumni.name || '',
    bio: alumni.bio || '',
    headline: alumni.headline || '',
    profilePhotoUrl: alumni.profilePhotoUrl || '',
    linkedInUrl: alumni.linkedInUrl || '',
    startYear: alumni.startYear || '',
    graduationYear: alumni.graduationYear || '',
    major: alumni.major || '',
    currentCompany: alumni.currentCompany || '',
    currentJobTitle: alumni.currentJobTitle || '',
    location: alumni.location || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      startYear: formData.startYear ? parseInt(formData.startYear) : null,
      graduationYear: formData.graduationYear
        ? parseInt(formData.graduationYear)
        : null,
    };
    onSave(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span className="close" onClick={onClose}>&times;</span>
        <h2>Edit Alumni</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="editName">Name *</label>
            <input
              type="text"
              id="editName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="editBio">Bio</label>
            <textarea
              id="editBio"
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editHeadline">Headline</label>
            <input
              type="text"
              id="editHeadline"
              name="headline"
              value={formData.headline}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editProfilePhotoUrl">Profile Photo URL</label>
            <input
              type="url"
              id="editProfilePhotoUrl"
              name="profilePhotoUrl"
              value={formData.profilePhotoUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editLinkedInUrl">LinkedIn URL</label>
            <input
              type="url"
              id="editLinkedInUrl"
              name="linkedInUrl"
              value={formData.linkedInUrl}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editStartYear">Start Year</label>
            <input
              type="number"
              id="editStartYear"
              name="startYear"
              value={formData.startYear}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editGraduationYear">Graduation Year</label>
            <input
              type="number"
              id="editGraduationYear"
              name="graduationYear"
              value={formData.graduationYear}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editMajor">Major</label>
            <input
              type="text"
              id="editMajor"
              name="major"
              value={formData.major}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editCurrentCompany">Current Company</label>
            <input
              type="text"
              id="editCurrentCompany"
              name="currentCompany"
              value={formData.currentCompany}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editCurrentJobTitle">Current Job Title</label>
            <input
              type="text"
              id="editCurrentJobTitle"
              name="currentJobTitle"
              value={formData.currentJobTitle}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="editLocation">Location</label>
            <input
              type="text"
              id="editLocation"
              name="location"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
