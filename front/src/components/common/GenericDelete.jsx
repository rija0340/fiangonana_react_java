import { useEffect } from "react";

 const GenericDelete = ({ressource,ressourceApi,id,navigate}) => {

  useEffect(() => {
    const deleteMbr = async () => {
      try {
        await ressourceApi.delete(id);
        navigate(`/${ressource}`);
      } catch (error) {
        console.error("Failed to delete membre", error);
      }
    };

    deleteMbr();
  }, [id, navigate]);

  return <div>Suppression en cours...</div>;
};
export default GenericDelete;