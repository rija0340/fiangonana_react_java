import { useState } from "react";
import membreApi from "../services/api";

const MembreXlsxImport = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    sendFileToBackend(file);
  };

  const sendFileToBackend = async (file) => {
    setIsLoading(true);
    setProgress(0);
    try {
      const response = await membreApi.import(file, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });
      console.log('Import réussi:', response);
      // Gérer le succès ici
    } catch (error) {
      console.error('Erreur import:', error.response?.data || error);
      // Gérer l'erreur ici
    } finally {
      setIsLoading(false);
    }
  };
  
    return (
        <>
        {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full">
                <span className="loading loading-spinner text-primary"></span>
                <progress className="progress progress-primary w-56" value={progress} max="100"></progress>
                <span>{progress}%</span>
            </div>
        ) : (
            <div className="flex card   justify-center items-center">
                <fieldset className="fieldset p-6 shadow-xl bg-base-100">
                    <h4 className="fieldset-legend">Veuiller selectionner un fichier xlsx </h4>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="file-input" />
                    <label className="label">Max size 2MB</label>
                </fieldset>
            </div>
        )}
        </>
    );
};

export default MembreXlsxImport;
