import { useState } from "react";
import * as XLSX from 'xlsx';
import membreApi from "../services/api";

const MembreXlsxImport = () => {
    const [data, setData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedHeaders, setSelectedHeaders] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
      console.log('File object:', file);
  console.log('File constructor:', file.constructor.name);
    if (!file) return;

    // D'abord envoyer le fichier au backend AVANT de le lire
    sendFileToBackend(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const workbook = XLSX.read(e.target.result, { type: 'binary' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length > 0) {
        const cols = Object.keys(jsonData[0]);
        setHeaders(cols);
        setSelectedHeaders(cols); // Initially select all
      }

      setData(jsonData);
    };

    reader.readAsBinaryString(file);
  };

  const toggleHeader = (header) => {
    setSelectedHeaders((prev) =>
      prev.includes(header)
        ? prev.filter((h) => h !== header)
        : [...prev, header]
    );
  };

 const sendFileToBackend = async (file) => {
    try {
      const response = await membreApi.import(file);
      console.log('Import réussi:', response);
      // Gérer le succès ici
    } catch (error) {
      console.error('Erreur import:', error.response?.data || error);
      // Gérer l'erreur ici
    }
  };
  
    return (
        <>
        { data.length === 0 && (
        <div className="flex card   justify-center items-center">
            <fieldset className="fieldset p-6 shadow-xl bg-base-100">
                <h4 className="fieldset-legend">Veuiller selectionner un fichier xlsx </h4>
                    <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="file-input" />
                <label className="label">Max size 2MB</label>
            <button className="btn btn-md">Traiter</button>
            </fieldset>
        </div> )}
        <div className="mt-4 card shadow-xl bg-base-100">
        {headers.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold mb-2">Select Columns to Display:</h3>
          {headers.map((header) => (
            <label key={header} className="mr-4">
              <input
                type="checkbox"
                checked={selectedHeaders.includes(header)}
                onChange={() => toggleHeader(header)}
                className="mr-1"
              />
              {header}
            </label>
          ))}
        </div>
      )}

      {data.length > 0 && (
        <table className="table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              {selectedHeaders.map((header) => (
                <th key={header} className="border px-2 py-1">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {selectedHeaders.map((header) => (
                  <td key={header} className="border px-2 py-1">
                    {row[header]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      </div>
        </>
    );
};

export default MembreXlsxImport;