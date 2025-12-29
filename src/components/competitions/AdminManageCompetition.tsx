import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { registrationService } from '../../services/registrationService';
import toast from 'react-hot-toast';

const AdminManageCompetition: React.FC = () => {
  const { currentUser } = useAuth();
  const { id } = useParams<{ id: string }>(); // hackathon id param
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!id) return;
    fetchRegistrations();
  }, [id]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const regs = await registrationService.getRegistrationsFiltered({ hackathonId: id });
      setRegistrations(regs);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const openRegistration = (reg: any) => {
    setSelected(reg);
    setFeedback(reg.feedback || '');
  };

  const closeDetails = () => setSelected(null);

  const handleDecision = async (status: 'approved' | 'rejected' | 'waitlisted') => {
    if (!selected) return;
    try {
  await registrationService.updateRegistrationStatus(selected.id, status, feedback || undefined);
      toast.success(`Registration ${status}`);
      await fetchRegistrations();
      setSelected(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update status');
    }
  };

  if (!currentUser?.isAdmin) {
    return <div className="p-6">Access denied</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Manage Registrations</h2>
        <button onClick={() => navigate('/competitions')} className="px-3 py-2 bg-gray-200 rounded">Back</button>
      </div>

      {loading ? (
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 space-y-2">
            {registrations.map(reg => (
              <div key={reg.id} className="p-3 border rounded cursor-pointer" onClick={() => openRegistration(reg)}>
                <div className="font-medium">{reg.teamName || 'Individual'}</div>
                <div className="text-sm text-gray-500">{reg.userId}</div>
                <div className="text-xs text-gray-400">{reg.status}</div>
              </div>
            ))}
          </div>

          <div className="md:col-span-2 bg-white p-4 border rounded">
            {selected ? (
              <div>
                <h3 className="text-lg font-semibold mb-2">Registration Details</h3>
                <div className="mb-4">
                  <div><strong>Team:</strong> {selected.teamName || 'N/A'}</div>
                  <div><strong>Leader:</strong> {selected.userId}</div>
                  <div><strong>Members:</strong></div>
                  <ul className="list-disc pl-5">
                    {(selected.teamMembers || []).map((m: any) => (
                      <li key={m.id}>{m.name || m.id} ({m.rollNumber || ''})</li>
                    ))}
                  </ul>
                  <div className="mt-2"><strong>Note:</strong> {selected.note || '—'}</div>
                  <div className="mt-2"><strong>GForm:</strong> {selected.gformLink ? <a href={selected.gformLink} target="_blank" rel="noreferrer" className="text-blue-600">Open</a> : '—'}</div>
                  <div className="mt-2"><strong>Bonafide Files:</strong></div>
                  <ul className="list-disc pl-5">
                    {(selected.bonafideFiles || []).map((f: any, idx: number) => (
                      <li key={idx}><a href={`https://drive.google.com/file/d/${f.googleDriveFileId}/view`} target="_blank" rel="noreferrer" className="text-blue-600">{f.originalName}</a></li>
                    ))}
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium">Feedback (optional)</label>
                  <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full p-2 border rounded" />
                </div>

                <div className="flex gap-3 mt-4">
                  <button onClick={() => handleDecision('approved')} className="px-4 py-2 bg-green-600 text-white rounded">Approve</button>
                  <button onClick={() => handleDecision('rejected')} className="px-4 py-2 bg-red-600 text-white rounded">Reject</button>
                  <button onClick={() => handleDecision('waitlisted')} className="px-4 py-2 bg-yellow-500 text-white rounded">Waitlist</button>
                  <button onClick={closeDetails} className="px-4 py-2 bg-gray-300 rounded">Close</button>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Select a registration to view details</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManageCompetition;
