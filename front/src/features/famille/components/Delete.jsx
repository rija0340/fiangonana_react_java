import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import familleApi from '../services/api';

const Delete = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const deleteFamille = async () => {
      try {
        await familleApi.delete(id);
        navigate('/familles');
      } catch (error) {
        console.error('Error deleting famille:', error);
        // Optionally show an error message to the user
      }
    };

    // Actually perform the deletion (confirmation is handled in the GenericList component)
    // so we can remove the confirm dialog from here
    deleteFamille();
  }, [id, navigate]);

  return (
    <div>
      <p>Suppression de la famille...</p>
    </div>
  );
};

export default Delete;