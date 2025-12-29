import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hackathonService } from '../../services/hackathonService';
import { registrationService } from '../../services/registrationService';
import { apiRequest, API_CONFIG } from '../../config/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const RegisterPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  useAuth();

  const [hackathon, setHackathon] = useState<any | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [registerSearch, setRegisterSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [bonafideFile, setBonafideFile] = useState<File | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const h = await hackathonService.getHackathon(id);
        if (!h) {
          // backend may return 200 with empty body, handle gracefully
          setNotFound(true);
          return;
        }

        setHackathon(h);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load event');
        setNotFound(true);
      }
    })();
  }, [id]);

  const searchByRegister = async () => {
    if (!registerSearch) return;
    try {
      const res = await apiRequest(API_CONFIG.ENDPOINTS.USER.SEARCH + `?query=${encodeURIComponent(registerSearch)}`, {}, true);
      setSearchResults(res.data?.users || []);
    } catch (err) {
      console.error('User search failed:', err);
      toast.error((err as Error).message || 'Failed to search users');
    }
  };

  const addMember = (user: any) => {
    if (selectedMembers.find(m => m.id === user.id)) return;
    setSelectedMembers(prev => [...prev, user]);
  };

  const removeMember = (id: string) => setSelectedMembers(prev => prev.filter(m => m.id !== id));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setBonafideFile(f);
  };

  const handleSubmit = async () => {
    if (!hackathon) return;
    setSubmitting(true);
    try {
      let uploadedFiles: any[] = [];
      if (bonafideFile) {
        const form = new FormData();
        form.append('certificates', bonafideFile);
        form.append('hackathonId', hackathon.id);

        const uploadRes = await fetch('/api/upload/certificates', {
          method: 'POST',
          body: form
        });

        if (!uploadRes.ok) throw new Error('File upload failed');
        const uploadData = await uploadRes.json();
        uploadedFiles = uploadData.data.uploadedFiles || [];
      }

      const payload = {
        hackathonId: hackathon.id,
        teamName: teamName || undefined,
        // Server accepts teamMembers as either userId strings or full objects with required fields.
        // We send IDs to keep the client simple and let the server resolve user data.
        teamMembers: selectedMembers.map(m => m.id),
        bonafideFiles: uploadedFiles,
        note: note || undefined,
        // gformLink is part of the hackathon event and should not be submitted by the user
      };

      await registrationService.registerForHackathon(payload);
      toast.success('Registration submitted');
      navigate('/competitions');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (notFound) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <p className="text-gray-600 mb-4">The event you are trying to register for does not exist or may have been removed.</p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/competitions')} className="px-4 py-2 bg-gray-200 rounded">Back to Competitions</button>
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return <div className="p-6">Loading event...</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Register for: {hackathon.title}</h2>
      <p className="text-gray-600 mb-6">{hackathon.description}</p>

      <div className="space-y-4">
        {/* Team Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Team Name</label>
          <input value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        {/* Add team members (search by register number) */}
        <div>
          <label className="block text-sm font-medium mb-1">Add Team Members (search by register number)</label>
          <div className="flex gap-2 mb-2">
            <input value={registerSearch} onChange={e => setRegisterSearch(e.target.value)} placeholder="Enter register number" className="flex-1 px-3 py-2 border rounded" />
            <button onClick={searchByRegister} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded">Search</button>
          </div>

          <div className="space-y-2">
            {searchResults.map(u => (
              <div key={u.id} className="flex items-center justify-between border p-2 rounded">
                <div>
                  <div className="font-medium">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.registerNumber} • {u.email}</div>
                </div>
                <button onClick={() => addMember(u)} className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded">Add</button>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="text-sm font-medium mb-1">Selected Members</div>
            <div className="flex flex-wrap gap-2">
              {selectedMembers.map(m => (
                <div key={m.id} className="px-2 py-1 bg-gray-100 rounded flex items-center gap-2">
                  <span>{m.name} ({m.registerNumber})</span>
                  <button onClick={() => removeMember(m.id)} className="text-red-500">Remove</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bonafide / On-duty upload */}
        <div>
          <label className="block text-sm font-medium mb-1">Bonafide / On-duty (optional)</label>
          <input type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium mb-1">Notes (optional)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} className="w-full px-3 py-2 border rounded" />
        </div>

        {/* Form link (display only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Event Registration Link (Google Form)</label>
          {hackathon.gformLink ? (
            <div>
              <a href={hackathon.gformLink} target="_blank" rel="noreferrer" className="text-blue-600">Open registration form</a>
            </div>
          ) : (
            <div className="text-gray-500">No registration link provided for this event.</div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/competitions')} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded">{submitting ? 'Submitting...' : 'Submit Registration'}</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
